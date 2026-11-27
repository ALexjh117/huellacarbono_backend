import Actividad from '#models/actividad'
import AlcanceEmision from '#models/alcance_emision'
import ActividadEmision from '#models/actividad_emision'
import DatoActividadCarbono from '#models/dato_actividad_carbono'
import FuenteEmision from '#models/fuente_emision'
import Organizacion from '#models/organizacion'
import PeriodoMedicion from '#models/periodo_medicion'
import UnidadMedida from '#models/unidad_medida'
import SubcategoriaEmision from '#models/subcategoria_emision'
import { aFecha, exigirActivo, limpiar } from '#services/catalogo_reglas'
import { rethrowDatabaseError } from '#services/database_error'
import { normalizarMagnitud } from '#services/emissions/unit_conversion_service'
import {
  exigirAccesoOrganizacion,
  obtenerOrganizacionesAutorizadas,
} from '#services/access_control'
import { Exception } from '@adonisjs/core/exceptions'
import { type DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

type CrearPayload = {
  actividadId: number
  periodoId: number
  fuenteEmisionId: number
  alcanceId: number
  actividadEmisionId: number
  subcategoriaEmisionId?: number | null
  unidadId: number
  cantidad: string
  fechaDato?: string | null
  fuenteDato?: string | null
  observacion?: string | null
  parametrosCalculo?: {
    consumoEspecifico?: string
    unidadConsumoId?: number
    unidadDistanciaId?: number
    densidad?: string
    unidadDensidadId?: number
    poderCalorifico?: string
    unidadPoderCalorificoId?: number
    opcionFactor?: string
    decisionFactor?: 'USAR_ULTIMO' | 'VALOR_PROPIO'
    factorReferenciaId?: number
    valorFactorPropio?: string
  }
}

/**
 * Densidad y poder calorífico son opcionales, pero si se registran deben venir
 * completos (valor > 0 y unidad activa de la magnitud correspondiente). Así el
 * motor no tiene que suponer nada al convertir volumen a masa o energía.
 */
async function validarParametrosConversion(parametros: CrearPayload['parametrosCalculo']) {
  const pares = [
    {
      nombre: 'densidad',
      valor: parametros?.densidad,
      unidadId: parametros?.unidadDensidadId,
      magnitudes: ['densidad'],
    },
    {
      nombre: 'poder calorífico',
      valor: parametros?.poderCalorifico,
      unidadId: parametros?.unidadPoderCalorificoId,
      magnitudes: ['poder calorifico masico', 'poder calorifico volumetrico'],
    },
  ]
  for (const par of pares) {
    const sinValor = par.valor === undefined || par.valor === null
    const sinUnidad = par.unidadId === undefined || par.unidadId === null
    if (sinValor && sinUnidad) continue
    if (sinValor || sinUnidad) {
      throw new Exception(`El parámetro ${par.nombre} requiere valor y unidad`, {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    if (!/[1-9]/.test(String(par.valor))) {
      throw new Exception(`El parámetro ${par.nombre} debe ser mayor que cero`, {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    const unidad = await UnidadMedida.find(par.unidadId)
    if (!unidad?.estado || !par.magnitudes.includes(normalizarMagnitud(unidad.magnitud))) {
      throw new Exception(
        `La unidad del parámetro ${par.nombre} no existe, está inactiva o no corresponde a esa magnitud`,
        { status: 422, code: 'E_VALIDATION' }
      )
    }
  }
}

type ActualizarPayload = Partial<CrearPayload> & {
  estadoRegistro?: string
}

function conDetalle() {
  return DatoActividadCarbono.query()
    .preload('actividad', (actividad) => actividad.preload('proceso'))
    .preload('periodo')
    .preload('fuenteEmision')
    .preload('alcance')
    .preload('actividadEmision')
    .preload('subcategoriaEmision')
    .preload('unidad')
}

function fechaDentroDelPeriodo(fecha: DateTime | null, periodo: PeriodoMedicion) {
  if (!fecha) return
  const dia = fecha.toISODate()
  const inicio = periodo.fechaInicio.toISODate()
  const fin = periodo.fechaFin.toISODate()
  if (!dia || !inicio || !fin || dia < inicio || dia > fin) {
    throw new Exception('La fecha del dato tiene que caer dentro del periodo', {
      status: 422,
      code: 'E_VALIDATION',
    })
  }
}

async function periodoAbierto(periodoId: number, usuarioId: number) {
  const periodo = await PeriodoMedicion.find(periodoId)
  if (!periodo) {
    throw new Exception('El recurso no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  await exigirAccesoOrganizacion(usuarioId, periodo.organizacionId)
  if (periodo.estado !== 'ABIERTO') {
    throw new Exception('Ese periodo ya no recibe papeles', { status: 409, code: 'E_CONFLICT' })
  }
  return periodo
}

async function actividadDeLaOrganizacion(actividadId: number, organizacionId: number) {
  const actividad = await Actividad.query()
    .where('id', actividadId)
    .where('estado', true)
    .whereHas('proceso', (proceso) => {
      proceso.where('estado', true).whereHas('sede', (sede) => {
        sede.where('organizacionId', organizacionId).where('estado', true)
      })
    })
    .first()

  if (actividad) return actividad

  const existe = await Actividad.find(actividadId)
  if (!existe) {
    throw new Exception('La actividad no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  if (!existe.estado) {
    throw new Exception('La actividad está inactiva', { status: 409, code: 'E_CONFLICT' })
  }
  throw new Exception('La actividad no pertenece a la organización del periodo', {
    status: 404,
    code: 'E_NOT_FOUND',
  })
}

export default class DatoActividadCarbonoService {
  async list(usuarioId: number, organizacionId: number, periodoId?: number) {
    await exigirAccesoOrganizacion(usuarioId, organizacionId)
    const organizacion = await Organizacion.find(organizacionId)
    if (!organizacion) {
      throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const consulta = conDetalle()
      .whereHas('actividad', (actividad) => {
        actividad.whereHas('proceso', (proceso) => {
          proceso.whereHas('sede', (sede) => {
            sede.where('organizacionId', organizacionId)
          })
        })
      })
      .whereHas('periodo', (periodo) => periodo.where('organizacionId', organizacionId))
      .orderBy('id', 'desc')
      .limit(100)

    if (periodoId) consulta.where('periodoId', periodoId)
    return consulta
  }

  async show(id: number, usuarioId: number) {
    const organizaciones = await obtenerOrganizacionesAutorizadas(usuarioId)
    const consulta = conDetalle().where('id', id)
    if (organizaciones !== null) {
      consulta
        .whereHas('periodo', (periodo) => periodo.whereIn('organizacionId', organizaciones))
        .whereHas('actividad', (actividad) =>
          actividad.whereHas('proceso', (proceso) =>
            proceso.whereHas('sede', (sede) => sede.whereIn('organizacionId', organizaciones))
          )
        )
    }
    const dato = await consulta.first()
    if (!dato) {
      throw new Exception('El papel de carbono no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return dato
  }

  async opciones(usuarioId: number, organizacionId: number) {
    await exigirAccesoOrganizacion(usuarioId, organizacionId)
    const organizacion = await Organizacion.find(organizacionId)
    if (!organizacion) {
      throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const [
      periodos,
      actividades,
      fuentes,
      alcances,
      unidades,
      actividadesEmision,
      subcategorias,
      vinculosFuente,
      resumenFactores,
    ] = await Promise.all([
      PeriodoMedicion.query()
        .where('organizacionId', organizacionId)
        .where('estado', 'ABIERTO')
        .orderBy('fechaInicio', 'desc'),
      Actividad.query()
        .where('estado', true)
        .whereHas('proceso', (proceso) => {
          proceso.where('estado', true).whereHas('sede', (sede) => {
            sede.where('organizacionId', organizacionId).where('estado', true)
          })
        })
        .preload('proceso')
        .orderBy('nombre', 'asc'),
      FuenteEmision.query().where('estado', true).orderBy('nombre', 'asc'),
      AlcanceEmision.query().where('estado', true).orderBy('codigo', 'asc'),
      UnidadMedida.query().where('estado', true).orderBy('nombre', 'asc'),
      ActividadEmision.query().where('estado', true).preload('alcance').orderBy('codigo', 'asc'),
      SubcategoriaEmision.query().where('estado', true).orderBy('nombre', 'asc'),
      db
        .from('actividad_emision_fuente as vinculo')
        .join(
          'actividad_emision as actividad',
          'actividad.id_actividad_emision',
          'vinculo.id_actividad_emision'
        )
        .join('fuente_emision as fuente', 'fuente.id_fuente_emision', 'vinculo.id_fuente_emision')
        .where('actividad.estado', true)
        .where('fuente.estado', true)
        .select(
          'actividad.id_actividad_emision as actividadEmisionId',
          'vinculo.id_fuente_emision as fuenteEmisionId',
          'vinculo.id_subcategoria_emision as subcategoriaEmisionId'
        ),
      this.resumenFactoresAprobados(),
    ])

    return {
      periodos,
      actividades,
      fuentes,
      alcances,
      unidades,
      actividadesEmision,
      subcategorias,
      vinculosFuente,
      resumenFactores,
    }
  }

  /** Unidades, gases, años y opciones de factor que ya están aprobadas por fuente. */
  private async resumenFactoresAprobados() {
    const result = await db.rawQuery(`
      SELECT f.id_fuente_emision AS "fuenteEmisionId",
             COALESCE(
               array_agg(DISTINCT f.variante) FILTER (
                 WHERE f.variante IS NOT NULL AND btrim(f.variante) <> ''
               ),
               '{}'
             ) AS variantes,
             COALESCE(
               array_agg(DISTINCT entrada.simbolo) FILTER (WHERE entrada.simbolo IS NOT NULL),
               '{}'
             ) AS unidades,
             COALESCE(array_agg(DISTINCT f.gas) FILTER (WHERE f.gas IS NOT NULL), '{}') AS gases,
             COALESCE(
               array_agg(DISTINCT f.anio_aplicacion) FILTER (WHERE f.anio_aplicacion IS NOT NULL),
               '{}'
             ) AS anios
        FROM factor_emision f
        JOIN unidad_medida entrada ON entrada.id_unidad = f.id_unidad_entrada
       WHERE f.estado = TRUE
         AND f.estado_aprobacion = 'APROBADO'
       GROUP BY f.id_fuente_emision
    `)
    const filas = (result as { rows?: Record<string, unknown>[] }).rows ?? []
    return filas.map((fila) => ({
      fuenteEmisionId: Number(fila.fuenteEmisionId),
      variantes: this.textos(fila.variantes).sort((a, b) => a.localeCompare(b)),
      unidades: this.textos(fila.unidades).sort((a, b) => a.localeCompare(b)),
      gases: this.textos(fila.gases).sort((a, b) => a.localeCompare(b)),
      anios: this.textos(fila.anios)
        .map((anio) => Number(anio))
        .filter((anio) => Number.isInteger(anio))
        .sort((a, b) => a - b),
    }))
  }

  private textos(valor: unknown) {
    if (!Array.isArray(valor)) return []
    return valor.map((item) => String(item).trim()).filter(Boolean)
  }

  async crear(usuarioId: number, payload: CrearPayload) {
    const periodo = await periodoAbierto(payload.periodoId, usuarioId)
    await actividadDeLaOrganizacion(payload.actividadId, periodo.organizacionId)
    await this.exigirCatalogos(
      payload.fuenteEmisionId,
      payload.alcanceId,
      payload.unidadId,
      payload.actividadEmisionId,
      payload.subcategoriaEmisionId,
      payload.parametrosCalculo
    )
    const fecha = payload.fechaDato ? aFecha(payload.fechaDato) : null
    fechaDentroDelPeriodo(fecha, periodo)

    try {
      const dato = await DatoActividadCarbono.create({
        actividadId: payload.actividadId,
        periodoId: payload.periodoId,
        fuenteEmisionId: payload.fuenteEmisionId,
        alcanceId: payload.alcanceId,
        actividadEmisionId: payload.actividadEmisionId,
        subcategoriaEmisionId: payload.subcategoriaEmisionId ?? null,
        unidadId: payload.unidadId,
        usuarioRegistroId: usuarioId,
        cantidad: payload.cantidad,
        fechaDato: fecha,
        fuenteDato: limpiar(payload.fuenteDato) ?? null,
        observacion: limpiar(payload.observacion) ?? null,
        parametrosCalculo: payload.parametrosCalculo ?? {},
        estadoRegistro: 'REGISTRADO',
      })
      return this.show(dato.id, usuarioId)
    } catch (error) {
      rethrowDatabaseError(error, 'No fue posible guardar el papel de carbono')
    }
  }

  async actualizar(id: number, usuarioId: number, payload: ActualizarPayload) {
    const dato = await this.show(id, usuarioId)

    const periodoId = payload.periodoId ?? dato.periodoId
    const periodo = await periodoAbierto(periodoId, usuarioId)
    const actividadId = payload.actividadId ?? dato.actividadId
    await actividadDeLaOrganizacion(actividadId, periodo.organizacionId)

    const fuenteId = payload.fuenteEmisionId ?? dato.fuenteEmisionId
    const alcanceId = payload.alcanceId ?? dato.alcanceId
    const actividadEmisionId = payload.actividadEmisionId ?? dato.actividadEmisionId
    const subcategoriaEmisionId =
      payload.subcategoriaEmisionId === undefined
        ? dato.subcategoriaEmisionId
        : payload.subcategoriaEmisionId
    const unidadId = payload.unidadId ?? dato.unidadId
    if (!actividadEmisionId) {
      throw new Exception('Selecciona la actividad de emisión para este registro', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    await this.exigirCatalogos(
      fuenteId,
      alcanceId,
      unidadId,
      actividadEmisionId,
      subcategoriaEmisionId,
      payload.parametrosCalculo ?? dato.parametrosCalculo
    )

    const fecha =
      payload.fechaDato === undefined
        ? dato.fechaDato
        : payload.fechaDato
          ? aFecha(payload.fechaDato)
          : null
    fechaDentroDelPeriodo(fecha, periodo)

    dato.merge({
      actividadId,
      periodoId,
      fuenteEmisionId: fuenteId,
      alcanceId,
      actividadEmisionId,
      subcategoriaEmisionId,
      unidadId,
      cantidad: payload.cantidad ?? dato.cantidad,
      fechaDato: fecha,
      fuenteDato:
        payload.fuenteDato === undefined ? dato.fuenteDato : (limpiar(payload.fuenteDato) ?? null),
      observacion:
        payload.observacion === undefined
          ? dato.observacion
          : (limpiar(payload.observacion) ?? null),
      parametrosCalculo: payload.parametrosCalculo ?? dato.parametrosCalculo ?? {},
      estadoRegistro: payload.estadoRegistro ?? dato.estadoRegistro,
    })

    try {
      await dato.save()
      return this.show(dato.id, usuarioId)
    } catch (error) {
      rethrowDatabaseError(error, 'No fue posible actualizar el papel de carbono')
    }
  }

  private async exigirCatalogos(
    fuenteId: number,
    alcanceId: number,
    unidadId: number,
    actividadEmisionId: number,
    subcategoriaEmisionId?: number | null,
    parametrosCalculo?: CrearPayload['parametrosCalculo']
  ) {
    await exigirActivo(
      'fuente_emision',
      'id_fuente_emision',
      fuenteId,
      'La fuente de emisión no existe',
      'La fuente de emisión está inactiva'
    )

    const actividadEmision = await ActividadEmision.query()
      .where('id', actividadEmisionId)
      .where('alcanceId', alcanceId)
      .where('estado', true)
      .first()
    if (!actividadEmision) {
      throw new Exception(
        'La actividad de emisión no pertenece al alcance seleccionado o está inactiva',
        { status: 422, code: 'E_VALIDATION' }
      )
    }

    const unidadActividad = await UnidadMedida.find(unidadId)
    if (!unidadActividad || !unidadActividad.estado) {
      throw new Exception('La unidad de actividad no existe o está inactiva', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    if (
      actividadEmision.codigo === 'A2' &&
      unidadActividad.magnitud
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase() === 'distancia'
    ) {
      const consumo = Number(parametrosCalculo?.consumoEspecifico)
      if (
        !Number.isFinite(consumo) ||
        consumo <= 0 ||
        !parametrosCalculo?.unidadConsumoId ||
        !parametrosCalculo.unidadDistanciaId
      ) {
        throw new Exception(
          'La combustión móvil por distancia requiere consumo específico positivo y unidades de consumo y distancia',
          { status: 422, code: 'E_VALIDATION' }
        )
      }
      const [unidadConsumo, unidadDistancia] = await Promise.all([
        UnidadMedida.find(parametrosCalculo.unidadConsumoId),
        UnidadMedida.find(parametrosCalculo.unidadDistanciaId),
      ])
      if (
        !unidadConsumo?.estado ||
        !unidadDistancia?.estado ||
        unidadDistancia.magnitud
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase() !== 'distancia'
      ) {
        throw new Exception('Las unidades del consumo específico no son válidas o compatibles', {
          status: 422,
          code: 'E_VALIDATION',
        })
      }
    }

    await validarParametrosConversion(parametrosCalculo)

    const vinculo = await db
      .from('actividad_emision_fuente')
      .where('id_actividad_emision', actividadEmisionId)
      .where('id_fuente_emision', fuenteId)
      .first()
    if (!vinculo) {
      throw new Exception('La fuente no pertenece a la actividad de emisión seleccionada', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    if ((vinculo.id_subcategoria_emision ?? null) !== (subcategoriaEmisionId ?? null)) {
      throw new Exception('La subcategoría seleccionada no corresponde a la fuente y actividad', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    if (subcategoriaEmisionId) {
      const subcategoria = await SubcategoriaEmision.query()
        .where('id', subcategoriaEmisionId)
        .where('actividadEmisionId', actividadEmisionId)
        .where('estado', true)
        .first()
      if (!subcategoria) {
        throw new Exception('La subcategoría no pertenece a la actividad de emisión', {
          status: 422,
          code: 'E_VALIDATION',
        })
      }
    }
    await exigirActivo(
      'alcance_emision',
      'id_alcance',
      alcanceId,
      'El alcance no existe',
      'El alcance está inactivo'
    )
    await exigirActivo(
      'unidad_medida',
      'id_unidad',
      unidadId,
      'La unidad de medida no existe',
      'La unidad de medida está inactiva'
    )
  }
}
