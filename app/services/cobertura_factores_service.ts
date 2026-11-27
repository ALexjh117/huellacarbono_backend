import MetodologiaVersion from '#models/metodologia_version'
import Organizacion from '#models/organizacion'
import { exigirAccesoOrganizacion } from '#services/access_control'
import {
  factorCubreIntervalo,
  regionAplica,
  sectorAplica,
  unidadCompatibleConActividades,
} from '#services/emissions/cobertura_intervalo'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export type EstadoCobertura = 'CON_FACTOR_APROBADO' | 'SOLO_PENDIENTES' | 'SIN_FACTOR'

type FilaCobertura = {
  fuenteEmisionId: number
  fuenteCodigo: string
  fuenteNombre: string
  actividadCodigo: string | null
  alcanceCodigo: string | null
  aprobadosVigentes: number
  /** Aprobados pero vencidos o aún no vigentes en la fecha consultada. */
  aprobadosNoVigentes: number
  pendientes: number
}

/**
 * Informa, para una versión metodológica, cuántas de las fuentes activas del
 * catálogo tienen un factor aprobado y vigente hoy, sólo factores pendientes
 * de aprobación o ninguno. No calcula emisiones ni juzga si la unidad del
 * dato será compatible: eso depende de cada registro de actividad.
 */
export default class CoberturaFactoresService {
  async cobertura(versionId: number, fecha: DateTime = DateTime.utc()) {
    const version = await MetodologiaVersion.query()
      .where('id', versionId)
      .preload('metodologia')
      .first()
    if (!version || version.metodologia.tipo !== 'CARBONO') {
      throw new Exception('La versión metodológica de carbono no existe', {
        status: 404,
        code: 'E_NOT_FOUND',
      })
    }
    const dia = fecha.toISODate()!

    const filas = (await db
      .from('fuente_emision as fuente')
      .leftJoin(
        'actividad_emision_fuente as vinculo',
        'vinculo.id_fuente_emision',
        'fuente.id_fuente_emision'
      )
      .leftJoin(
        'actividad_emision as actividad',
        'actividad.id_actividad_emision',
        'vinculo.id_actividad_emision'
      )
      .leftJoin('alcance_emision as alcance', 'alcance.id_alcance', 'actividad.id_alcance')
      .where('fuente.estado', true)
      .select(
        'fuente.id_fuente_emision as fuenteEmisionId',
        'fuente.codigo as fuenteCodigo',
        'fuente.nombre as fuenteNombre',
        'actividad.codigo as actividadCodigo',
        'alcance.codigo as alcanceCodigo'
      )
      .select(
        db.raw(
          `(SELECT COUNT(*)::int FROM factor_emision f
             WHERE f.id_fuente_emision = fuente.id_fuente_emision
               AND f.id_version = ? AND f.estado = TRUE
               AND f.estado_aprobacion = 'APROBADO'
               AND f.fecha_inicio_vigencia <= ?::date
               AND (f.fecha_fin_vigencia IS NULL OR f.fecha_fin_vigencia >= ?::date)
           ) AS "aprobadosVigentes"`,
          [versionId, dia, dia]
        ),
        db.raw(
          `(SELECT COUNT(*)::int FROM factor_emision f
             WHERE f.id_fuente_emision = fuente.id_fuente_emision
               AND f.id_version = ? AND f.estado = TRUE
               AND f.estado_aprobacion = 'APROBADO'
               AND (f.fecha_inicio_vigencia > ?::date OR f.fecha_fin_vigencia < ?::date)
           ) AS "aprobadosNoVigentes"`,
          [versionId, dia, dia]
        ),
        db.raw(
          `(SELECT COUNT(*)::int FROM factor_emision f
             WHERE f.id_fuente_emision = fuente.id_fuente_emision
               AND f.id_version = ? AND f.estado = TRUE
               AND f.estado_aprobacion IN ('BORRADOR', 'PENDIENTE')
           ) AS "pendientes"`,
          [versionId]
        )
      )
      .orderBy('fuente.codigo', 'asc')) as FilaCobertura[]

    const fuentes = filas.map((fila) => {
      const estado: EstadoCobertura =
        fila.aprobadosVigentes > 0
          ? 'CON_FACTOR_APROBADO'
          : fila.pendientes > 0
            ? 'SOLO_PENDIENTES'
            : 'SIN_FACTOR'
      return { ...fila, estado }
    })

    const resumen = new Map<
      string,
      { alcanceCodigo: string; total: number } & Record<EstadoCobertura, number>
    >()
    for (const fuente of fuentes) {
      const clave = fuente.alcanceCodigo ?? 'SIN_ALCANCE'
      const grupo = resumen.get(clave) ?? {
        alcanceCodigo: clave,
        total: 0,
        CON_FACTOR_APROBADO: 0,
        SOLO_PENDIENTES: 0,
        SIN_FACTOR: 0,
      }
      grupo.total += 1
      grupo[fuente.estado] += 1
      resumen.set(clave, grupo)
    }

    return {
      versionId: version.id,
      metodologia: version.metodologia.nombre,
      numeroVersion: version.numeroVersion,
      fecha: dia,
      totalFuentes: fuentes.length,
      porAlcance: [...resumen.values()].sort((a, b) =>
        a.alcanceCodigo.localeCompare(b.alcanceCodigo)
      ),
      fuentes,
    }
  }

  /**
   * Cobertura preliminar del formulario de datos de actividad para un intervalo.
   * No reemplaza al motor: confirma aprobación, vigencia, región, sector y si
   * la magnitud de la unidad cabe en la metodología de la actividad.
   */
  async coberturaIntervalo(
    usuarioId: number,
    consulta: { versionId: number; desde: string; hasta: string; organizacionId?: number }
  ) {
    const desde = this.fecha(consulta.desde, 'inicial')
    const hasta = this.fecha(consulta.hasta, 'final')
    if (desde > hasta) {
      throw new Exception('La fecha inicial de la cobertura no puede ser posterior a la final', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    await this.exigirVersionCarbono(consulta.versionId)

    let sectorOrganizacion: string | null = null
    if (consulta.organizacionId) {
      await exigirAccesoOrganizacion(usuarioId, consulta.organizacionId)
      const organizacion = await Organizacion.find(consulta.organizacionId)
      if (!organizacion) {
        throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
      }
      sectorOrganizacion = organizacion.sectorEconomico
    }

    const fuentes = await db
      .from('fuente_emision as fuente')
      .leftJoin(
        'actividad_emision_fuente as vinculo',
        'vinculo.id_fuente_emision',
        'fuente.id_fuente_emision'
      )
      .leftJoin(
        'actividad_emision as actividad',
        'actividad.id_actividad_emision',
        'vinculo.id_actividad_emision'
      )
      .where('fuente.estado', true)
      .select(
        'fuente.id_fuente_emision as fuenteEmisionId',
        'fuente.codigo as fuenteCodigo',
        'actividad.codigo as actividadCodigo'
      )
      .orderBy('fuente.codigo', 'asc')

    const actividadesPorFuente = new Map<number, { codigo: string; actividades: Set<string> }>()
    for (const fila of fuentes) {
      const id = Number(fila.fuenteEmisionId)
      const actual = actividadesPorFuente.get(id) ?? {
        codigo: String(fila.fuenteCodigo),
        actividades: new Set<string>(),
      }
      if (fila.actividadCodigo) actual.actividades.add(String(fila.actividadCodigo))
      actividadesPorFuente.set(id, actual)
    }

    const factores = await db
      .from('factor_emision as factor')
      .join(
        'unidad_medida as entrada',
        'entrada.id_unidad',
        'factor.id_unidad_entrada'
      )
      .join('unidad_medida as salida', 'salida.id_unidad', 'factor.id_unidad_salida')
      .where('factor.id_version', consulta.versionId)
      .where('factor.estado', true)
      .select(
        'factor.id_fuente_emision as fuenteEmisionId',
        'factor.estado_aprobacion as estadoAprobacion',
        'factor.fecha_inicio_vigencia as fechaInicio',
        'factor.fecha_fin_vigencia as fechaFin',
        'factor.anio_aplicacion as anioAplicacion',
        'factor.region as region',
        'factor.sector_categoria as sectorCategoria',
        'entrada.magnitud as magnitudEntrada',
        'salida.magnitud as magnitudSalida'
      )

    type Acumulado = {
      fuenteCodigo: string
      factorDisponible: boolean
      aprobadosVigentes: number
      aprobadosNoVigentes: number
      pendientes: number
      rechazados: number
      unidadesCompatibles: boolean
    }
    const acumulados = new Map<number, Acumulado>()
    for (const [id, fuente] of actividadesPorFuente) {
      acumulados.set(id, {
        fuenteCodigo: fuente.codigo,
        factorDisponible: false,
        aprobadosVigentes: 0,
        aprobadosNoVigentes: 0,
        pendientes: 0,
        rechazados: 0,
        unidadesCompatibles: false,
      })
    }

    for (const factor of factores) {
      const id = Number(factor.fuenteEmisionId)
      const acumulado = acumulados.get(id)
      if (!acumulado) continue
      acumulado.factorDisponible = true
      const aprobacion = String(factor.estadoAprobacion)
      if (aprobacion === 'RECHAZADO') acumulado.rechazados += 1
      if (aprobacion === 'PENDIENTE' || aprobacion === 'BORRADOR') acumulado.pendientes += 1
      if (aprobacion !== 'APROBADO') continue

      const dimensiones =
        regionAplica(factor.region == null ? null : String(factor.region)) &&
        (consulta.organizacionId
          ? sectorAplica(
              factor.sectorCategoria == null ? null : String(factor.sectorCategoria),
              sectorOrganizacion
            )
          : true)
      const cubre = factorCubreIntervalo(
        {
          fechaInicio: this.dia(factor.fechaInicio),
          fechaFin: factor.fechaFin == null ? null : this.dia(factor.fechaFin),
          anioAplicacion:
            factor.anioAplicacion == null ? null : Number(factor.anioAplicacion),
        },
        desde,
        hasta
      )
      if (!dimensiones) continue
      if (!cubre) {
        acumulado.aprobadosNoVigentes += 1
        continue
      }
      acumulado.aprobadosVigentes += 1
      const actividades = [...(actividadesPorFuente.get(id)?.actividades ?? [])]
      if (
        unidadCompatibleConActividades(
          String(factor.magnitudEntrada),
          String(factor.magnitudSalida),
          actividades
        )
      ) {
        acumulado.unidadesCompatibles = true
      }
    }

    return {
      versionId: consulta.versionId,
      desde,
      hasta,
      fuentes: [...acumulados.values()]
        .sort((a, b) => a.fuenteCodigo.localeCompare(b.fuenteCodigo))
        .map((fila) => {
          const estado: EstadoCobertura =
            fila.aprobadosVigentes > 0
              ? 'CON_FACTOR_APROBADO'
              : fila.pendientes > 0
                ? 'SOLO_PENDIENTES'
                : 'SIN_FACTOR'
          const compatibilidadDato =
            fila.aprobadosVigentes === 0
              ? 'Sin factor aprobado vigente para las fechas consultadas.'
              : fila.unidadesCompatibles
                ? 'La unidad de entrada del factor vigente corresponde a la metodología de la actividad y la salida es masa.'
                : 'Hay un factor vigente, pero su unidad no corresponde a la metodología de la actividad o la salida no es masa.'
          return {
            fuenteCodigo: fila.fuenteCodigo,
            estado,
            factorDisponible: fila.factorDisponible,
            aprobadosVigentes: fila.aprobadosVigentes,
            aprobadosNoVigentes: fila.aprobadosNoVigentes,
            pendientes: fila.pendientes,
            rechazados: fila.rechazados,
            unidadesCompatibles: fila.unidadesCompatibles,
            compatibilidadDato,
          }
        }),
    }
  }

  private async exigirVersionCarbono(versionId: number) {
    const version = await MetodologiaVersion.query()
      .where('id', versionId)
      .preload('metodologia')
      .first()
    if (!version || version.metodologia.tipo !== 'CARBONO') {
      throw new Exception('La versión metodológica de carbono no existe', {
        status: 404,
        code: 'E_NOT_FOUND',
      })
    }
    return version
  }

  private fecha(valor: string, extremo: 'inicial' | 'final') {
    const fecha = DateTime.fromISO(valor)
    if (!fecha.isValid || fecha.toISODate() !== valor) {
      throw new Exception(`La fecha ${extremo} de la cobertura no es válida`, {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    return valor
  }

  /** node-pg entrega DATE como Date local; toISOString desplazaría el día. */
  private dia(valor: unknown) {
    if (valor instanceof Date) {
      const mes = String(valor.getMonth() + 1).padStart(2, '0')
      const dia = String(valor.getDate()).padStart(2, '0')
      return `${valor.getFullYear()}-${mes}-${dia}`
    }
    return String(valor).slice(0, 10)
  }
}
