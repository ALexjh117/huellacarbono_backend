import Actividad from '#models/actividad'
import Proceso from '#models/proceso'
import Sede from '#models/sede'
import { rethrowDatabaseError } from '#services/database_error'
import { Exception } from '@adonisjs/core/exceptions'

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

export default class ProcesoService {
  async list(sedeId: number, includeInactive: boolean) {
    await this.assertSede(sedeId)
    const procesos = Proceso.query()
      .where('sedeId', sedeId)
      .withCount('actividades', (actividades) => {
        actividades.where('estado', true)
      })
      .orderBy('nombre', 'asc')

    if (!includeInactive) procesos.where('estado', true)
    return procesos
  }

  async show(id: number) {
    const proceso = await Proceso.query()
      .where('id', id)
      .withCount('actividades', (actividades) => {
        actividades.where('estado', true)
      })
      .first()

    if (!proceso) {
      throw new Exception('El proceso no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return proceso
  }

  async create(sedeId: number, payload: Payload) {
    const sede = await this.assertSede(sedeId)
    if (!sede.estado) {
      throw new Exception('La sede está inactiva', { status: 409, code: 'E_CONFLICT' })
    }

    const nombre = payload.nombre!.trim()
    await this.assertNombreLibre(sedeId, nombre)

    try {
      const proceso = await Proceso.create({
        sedeId,
        nombre,
        descripcion: limpiar(payload.descripcion) ?? null,
        estado: true,
      })
      return await this.show(proceso.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el proceso')
    }
  }

  async update(id: number, payload: Payload) {
    const proceso = await Proceso.find(id)
    if (!proceso) {
      throw new Exception('El proceso no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    if (payload.active === false && !proceso.estado) {
      throw new Exception('El proceso ya está inactivo', { status: 409, code: 'E_CONFLICT' })
    }

    if (payload.active === false) {
      const actividad = await Actividad.query()
        .where('procesoId', proceso.id)
        .where('estado', true)
        .first()
      if (actividad) {
        throw new Exception('Desactiva primero las actividades de este proceso', {
          status: 409,
          code: 'E_CONFLICT',
        })
      }
    }

    if (payload.active === true) {
      const sede = await this.assertSede(proceso.sedeId)
      if (!sede.estado) {
        throw new Exception('La sede está inactiva', { status: 409, code: 'E_CONFLICT' })
      }
    }

    const nombre = payload.nombre?.trim() ?? proceso.nombre
    if (payload.nombre !== undefined) {
      await this.assertNombreLibre(proceso.sedeId, nombre, proceso.id)
      proceso.nombre = nombre
    }
    if (payload.descripcion !== undefined) proceso.descripcion = limpiar(payload.descripcion) ?? null
    if (payload.active !== undefined) proceso.estado = payload.active

    try {
      await proceso.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el proceso')
    }

    return this.show(proceso.id)
  }

  private async assertSede(id: number) {
    const sede = await Sede.find(id)
    if (!sede) throw new Exception('La sede no existe', { status: 404, code: 'E_NOT_FOUND' })
    return sede
  }

  private async assertNombreLibre(sedeId: number, nombre: string, exceptoId?: number) {
    const consulta = Proceso.query()
      .where('sedeId', sedeId)
      .whereRaw('lower(nombre) = lower(?)', [nombre])
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception('Ya existe un proceso con ese nombre en esta sede', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }
}
