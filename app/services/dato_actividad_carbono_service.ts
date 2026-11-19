import Actividad from '#models/actividad'
import AlcanceEmision from '#models/alcance_emision'
import DatoActividadCarbono from '#models/dato_actividad_carbono'
import FuenteEmision from '#models/fuente_emision'
import Organizacion from '#models/organizacion'
import PeriodoMedicion from '#models/periodo_medicion'
import UnidadMedida from '#models/unidad_medida'
import { aFecha, exigirActivo, limpiar } from '#services/catalogo_reglas'
import { rethrowDatabaseError } from '#services/database_error'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'

type CrearPayload = {
  actividadId: number
  periodoId: number
  fuenteEmisionId: number
  alcanceId: number
  unidadId: number
  cantidad: string
  fechaDato?: string | null
  fuenteDato?: string | null
  observacion?: string | null
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

async function periodoAbierto(periodoId: number) {
  const periodo = await PeriodoMedicion.find(periodoId)
  if (!periodo) {
    throw new Exception('El periodo no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
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
  async list(organizacionId: number, periodoId?: number) {
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
      .orderBy('id', 'desc')
      .limit(100)

    if (periodoId) consulta.where('periodoId', periodoId)
    return consulta
  }

  async show(id: number) {
    const dato = await conDetalle().where('id', id).first()
    if (!dato) {
      throw new Exception('El papel de carbono no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return dato
  }

  async opciones(organizacionId: number) {
    const organizacion = await Organizacion.find(organizacionId)
    if (!organizacion) {
      throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const [periodos, actividades, fuentes, alcances, unidades] = await Promise.all([
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
    ])

    return { periodos, actividades, fuentes, alcances, unidades }
  }

  async crear(usuarioId: number, payload: CrearPayload) {
    const periodo = await periodoAbierto(payload.periodoId)
    await actividadDeLaOrganizacion(payload.actividadId, periodo.organizacionId)
    await this.exigirCatalogos(payload.fuenteEmisionId, payload.alcanceId, payload.unidadId)
    const fecha = payload.fechaDato ? aFecha(payload.fechaDato) : null
    fechaDentroDelPeriodo(fecha, periodo)

    try {
      const dato = await DatoActividadCarbono.create({
        actividadId: payload.actividadId,
        periodoId: payload.periodoId,
        fuenteEmisionId: payload.fuenteEmisionId,
        alcanceId: payload.alcanceId,
        unidadId: payload.unidadId,
        usuarioRegistroId: usuarioId,
        cantidad: payload.cantidad,
        fechaDato: fecha,
        fuenteDato: limpiar(payload.fuenteDato) ?? null,
        observacion: limpiar(payload.observacion) ?? null,
        estadoRegistro: 'REGISTRADO',
      })
      return this.show(dato.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No fue posible guardar el papel de carbono')
    }
  }

  async actualizar(id: number, payload: ActualizarPayload) {
    const dato = await DatoActividadCarbono.find(id)
    if (!dato) {
      throw new Exception('El papel de carbono no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const periodoId = payload.periodoId ?? dato.periodoId
    const periodo = await periodoAbierto(periodoId)
    const actividadId = payload.actividadId ?? dato.actividadId
    await actividadDeLaOrganizacion(actividadId, periodo.organizacionId)

    const fuenteId = payload.fuenteEmisionId ?? dato.fuenteEmisionId
    const alcanceId = payload.alcanceId ?? dato.alcanceId
    const unidadId = payload.unidadId ?? dato.unidadId
    await this.exigirCatalogos(fuenteId, alcanceId, unidadId)

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
      unidadId,
      cantidad: payload.cantidad ?? dato.cantidad,
      fechaDato: fecha,
      fuenteDato:
        payload.fuenteDato === undefined ? dato.fuenteDato : (limpiar(payload.fuenteDato) ?? null),
      observacion:
        payload.observacion === undefined ? dato.observacion : (limpiar(payload.observacion) ?? null),
      estadoRegistro: payload.estadoRegistro ?? dato.estadoRegistro,
    })

    try {
      await dato.save()
      return this.show(dato.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No fue posible actualizar el papel de carbono')
    }
  }

  private async exigirCatalogos(fuenteId: number, alcanceId: number, unidadId: number) {
    await exigirActivo(
      'fuente_emision',
      'id_fuente_emision',
      fuenteId,
      'La fuente de emisión no existe',
      'La fuente de emisión está inactiva'
    )
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
