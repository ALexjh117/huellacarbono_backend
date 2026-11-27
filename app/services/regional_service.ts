import Regional from '#models/regional'
import CentroFormacion from '#models/centro_formacion'
import { normalizarCodigo } from '#services/catalogo_reglas'
import { rethrowDatabaseError } from '#services/database_error'
import { Exception } from '@adonisjs/core/exceptions'

export type RegionalPayload = {
  codigo?: string
  nombre?: string
  active?: boolean
}

export default class RegionalService {
  async list(includeInactive: boolean) {
    const consulta = Regional.query().orderBy('nombre', 'asc')
    if (!includeInactive) consulta.where('estado', true)
    return consulta
  }

  async show(id: number) {
    const regional = await Regional.find(id)
    if (!regional) {
      throw new Exception('La regional no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return regional
  }

  async create(payload: RegionalPayload) {
    const codigo = normalizarCodigo(payload.codigo!)
    const nombre = payload.nombre!.trim()
    await this.assertCodigoLibre(codigo)
    await this.assertNombreLibre(nombre)

    try {
      return await Regional.create({ codigo, nombre, estado: true })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la regional')
    }
  }

  async update(id: number, payload: RegionalPayload) {
    const regional = await this.show(id)

    if (payload.active === false && !regional.estado) {
      throw new Exception('La regional ya está inactiva', { status: 409, code: 'E_CONFLICT' })
    }

    if (payload.active === false) {
      const centro = await CentroFormacion.query()
        .where('regionalId', regional.id)
        .where('estado', true)
        .first()
      if (centro) {
        throw new Exception('Desactiva primero los centros de esta regional', {
          status: 409,
          code: 'E_CONFLICT',
        })
      }
    }

    if (payload.codigo !== undefined) {
      const codigo = normalizarCodigo(payload.codigo)
      await this.assertCodigoLibre(codigo, regional.id)
      regional.codigo = codigo
    }
    if (payload.nombre !== undefined) {
      const nombre = payload.nombre.trim()
      await this.assertNombreLibre(nombre, regional.id)
      regional.nombre = nombre
    }
    if (payload.active !== undefined) regional.estado = payload.active

    try {
      await regional.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la regional')
    }

    return regional
  }

  private async assertCodigoLibre(codigo: string, exceptoId?: number) {
    const consulta = Regional.query().whereRaw('lower(codigo) = lower(?)', [codigo])
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception('Ya existe una regional con ese código', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }

  private async assertNombreLibre(nombre: string, exceptoId?: number) {
    const consulta = Regional.query().whereRaw('lower(nombre) = lower(?)', [nombre])
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception('Ya existe una regional con ese nombre', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }
}
