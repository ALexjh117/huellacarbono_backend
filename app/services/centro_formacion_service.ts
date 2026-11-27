import CentroFormacion from '#models/centro_formacion'
import Regional from '#models/regional'
import Usuario from '#models/usuario'
import { normalizarCodigo } from '#services/catalogo_reglas'
import { rethrowDatabaseError } from '#services/database_error'
import { Exception } from '@adonisjs/core/exceptions'

export type CentroPayload = {
  regionalId?: number
  codigo?: string
  nombre?: string
  active?: boolean
}

export default class CentroFormacionService {
  async list(includeInactive: boolean, regionalId?: number) {
    const consulta = CentroFormacion.query().preload('regional').orderBy('nombre', 'asc')
    if (!includeInactive) consulta.where('estado', true)
    if (regionalId) consulta.where('regionalId', regionalId)
    return consulta
  }

  async show(id: number) {
    const centro = await CentroFormacion.query().where('id', id).preload('regional').first()
    if (!centro) {
      throw new Exception('El centro de formación no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return centro
  }

  async create(payload: CentroPayload) {
    const regionalId = payload.regionalId!
    const codigo = normalizarCodigo(payload.codigo!)
    const nombre = payload.nombre!.trim()
    await this.assertRegionalActiva(regionalId)
    await this.assertCodigoLibre(codigo)
    await this.assertNombreLibre(regionalId, nombre)

    try {
      const centro = await CentroFormacion.create({
        regionalId,
        codigo,
        nombre,
        estado: true,
      })
      return await this.show(centro.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el centro de formación')
    }
  }

  async update(id: number, payload: CentroPayload) {
    const centro = await CentroFormacion.find(id)
    if (!centro) {
      throw new Exception('El centro de formación no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    if (payload.active === false && !centro.estado) {
      throw new Exception('El centro de formación ya está inactivo', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    if (payload.active === false) {
      const usuario = await Usuario.query()
        .where('centroId', centro.id)
        .where('estado', true)
        .first()
      if (usuario) {
        throw new Exception('Desactiva primero los usuarios de este centro', {
          status: 409,
          code: 'E_CONFLICT',
        })
      }
    }

    const regionalId = payload.regionalId ?? centro.regionalId
    if (payload.regionalId !== undefined) await this.assertRegionalActiva(regionalId)

    if (payload.codigo !== undefined) {
      const codigo = normalizarCodigo(payload.codigo)
      await this.assertCodigoLibre(codigo, centro.id)
      centro.codigo = codigo
    }
    if (payload.nombre !== undefined || payload.regionalId !== undefined) {
      const nombre = payload.nombre?.trim() ?? centro.nombre
      await this.assertNombreLibre(regionalId, nombre, centro.id)
      centro.nombre = nombre
    }
    if (payload.regionalId !== undefined) centro.regionalId = regionalId
    if (payload.active !== undefined) centro.estado = payload.active

    try {
      await centro.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el centro de formación')
    }

    return this.show(centro.id)
  }

  private async assertRegionalActiva(regionalId: number) {
    const regional = await Regional.query().where('id', regionalId).where('estado', true).first()
    if (!regional) {
      throw new Exception('La regional no existe o está inactiva', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }
  }

  private async assertCodigoLibre(codigo: string, exceptoId?: number) {
    const consulta = CentroFormacion.query().whereRaw('lower(codigo) = lower(?)', [codigo])
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception('Ya existe un centro de formación con ese código', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }

  private async assertNombreLibre(regionalId: number, nombre: string, exceptoId?: number) {
    const consulta = CentroFormacion.query()
      .where('regionalId', regionalId)
      .whereRaw('lower(nombre) = lower(?)', [nombre])
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception('Ya existe un centro con ese nombre en esta regional', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }
}
