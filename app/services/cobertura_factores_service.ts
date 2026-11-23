import MetodologiaVersion from '#models/metodologia_version'
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
}
