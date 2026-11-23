import Actividad from '#models/actividad'
import Proceso from '#models/proceso'
import { rethrowDatabaseError } from '#services/database_error'
import { exigirAccesoActividad, exigirAccesoProceso } from '#services/access_control'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'

type Payload = {
  nombre?: string
  descripcion?: string | null
  active?: boolean
}

function limpiar(valor: string | null | undefined) {
  if (valor === undefined) return undefined
  if (valor === null) return null
  const texto = valor.trim()
  return texto.length ? texto : null
}

async function tieneMediciones(actividadId: number) {
  const hidrico = await db
    .from('dato_hidrico')
    .where('id_actividad', actividadId)
    .whereNot('estado_registro', 'RECHAZADO')
    .count('* as total')
  const carbono = await db
    .from('dato_actividad_carbono')
    .where('id_actividad', actividadId)
    .whereNot('estado_registro', 'RECHAZADO')
    .count('* as total')

  return Number(hidrico[0]?.total ?? 0) + Number(carbono[0]?.total ?? 0) > 0
}

export default class ActividadService {
  async list(usuarioId: number, procesoId: number, includeInactive: boolean) {
    await exigirAccesoProceso(usuarioId, procesoId)
    await this.assertProceso(procesoId)
    const actividades = Actividad.query().where('procesoId', procesoId).orderBy('nombre', 'asc')
    if (!includeInactive) actividades.where('estado', true)
    return actividades
  }

  async show(id: number, usuarioId: number) {
    await exigirAccesoActividad(usuarioId, id)
    const actividad = await Actividad.find(id)
    if (!actividad) {
      throw new Exception('La actividad no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return actividad
  }

  async create(usuarioId: number, procesoId: number, payload: Payload) {
    await exigirAccesoProceso(usuarioId, procesoId)
    const proceso = await this.assertProceso(procesoId)
    if (!proceso.estado) {
      throw new Exception('El proceso está inactivo', { status: 409, code: 'E_CONFLICT' })
    }

    const nombre = payload.nombre!.trim()
    await this.assertNombreLibre(procesoId, nombre)

    try {
      const actividad = await Actividad.create({
        procesoId,
        nombre,
        descripcion: limpiar(payload.descripcion) ?? null,
        estado: true,
      })
      return actividad
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la actividad')
    }
  }

  async update(id: number, usuarioId: number, payload: Payload) {
    const actividad = await this.show(id, usuarioId)

    if (payload.active === false && !actividad.estado) {
      throw new Exception('La actividad ya está inactiva', { status: 409, code: 'E_CONFLICT' })
    }

    if (payload.active === false && (await tieneMediciones(actividad.id))) {
      throw new Exception('Esta actividad ya tiene mediciones registradas', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    if (payload.active === true) {
      const proceso = await this.assertProceso(actividad.procesoId)
      if (!proceso.estado) {
        throw new Exception('El proceso está inactivo', { status: 409, code: 'E_CONFLICT' })
      }
    }

    const nombre = payload.nombre?.trim() ?? actividad.nombre
    if (payload.nombre !== undefined) {
      await this.assertNombreLibre(actividad.procesoId, nombre, actividad.id)
      actividad.nombre = nombre
    }
    if (payload.descripcion !== undefined)
      actividad.descripcion = limpiar(payload.descripcion) ?? null
    if (payload.active !== undefined) actividad.estado = payload.active

    try {
      await actividad.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la actividad')
    }

    return actividad
  }

  private async assertProceso(id: number) {
    const proceso = await Proceso.find(id)
    if (!proceso) throw new Exception('El proceso no existe', { status: 404, code: 'E_NOT_FOUND' })
    return proceso
  }

  private async assertNombreLibre(procesoId: number, nombre: string, exceptoId?: number) {
    const consulta = Actividad.query()
      .where('procesoId', procesoId)
      .whereRaw('lower(nombre) = lower(?)', [nombre])
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception('Ya existe una actividad con ese nombre en este proceso', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }
}
