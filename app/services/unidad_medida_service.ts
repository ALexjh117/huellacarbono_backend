import UnidadMedida from '#models/unidad_medida'
import { rethrowDatabaseError } from '#services/database_error'
import { Exception } from '@adonisjs/core/exceptions'

type CreateUnitPayload = {
  codigo: string
  nombre: string
  simbolo: string
  magnitud: string
  /** DECIMAL(24, 12): siempre cadena para conservar la precisión original. */
  factorBase: string
}

type UpdateUnitPayload = {
  codigo?: string
  nombre?: string
  simbolo?: string
  magnitud?: string
  /** DECIMAL(24, 12): siempre cadena para conservar la precisión original. */
  factorBase?: string
  active?: boolean
}

export default class UnidadMedidaService {
  async list(includeInactive: boolean) {
    const query = UnidadMedida.query().orderBy('nombre', 'asc')
    if (!includeInactive) {
      query.where('estado', true)
    }
    return query
  }

  async show(id: number) {
    const unit = await UnidadMedida.query().where('id', id).first()
    if (!unit) {
      throw new Exception('La unidad de medida no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return unit
  }

  async create(payload: CreateUnitPayload) {
    const codigo = payload.codigo.trim()
    const existing = await UnidadMedida.query().where('codigo', codigo).first()
    if (existing) {
      throw new Exception('Ya existe una unidad de medida con ese código', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }

    try {
      const unit = await UnidadMedida.create({
        codigo,
        nombre: payload.nombre.trim(),
        simbolo: payload.simbolo.trim(),
        magnitud: payload.magnitud.trim(),
        factorBase: payload.factorBase.trim(),
        estado: true,
      })
      return await this.show(unit.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la unidad de medida')
    }
  }

  async update(id: number, payload: UpdateUnitPayload) {
    const unit = await this.show(id)

    if (payload.active === false && !unit.estado) {
      throw new Exception('La unidad de medida ya está inactiva', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    if (payload.codigo !== undefined && payload.codigo.trim() !== unit.codigo) {
      const codigo = payload.codigo.trim()
      const existing = await UnidadMedida.query().where('codigo', codigo).whereNot('id', id).first()
      if (existing) {
        throw new Exception('Ya existe una unidad de medida con ese código', {
          status: 409,
          code: 'E_DUPLICATE',
        })
      }
      unit.codigo = codigo
    }

    if (payload.nombre !== undefined) {
      unit.nombre = payload.nombre.trim()
    }
    if (payload.simbolo !== undefined) {
      unit.simbolo = payload.simbolo.trim()
    }
    if (payload.magnitud !== undefined) {
      unit.magnitud = payload.magnitud.trim()
    }
    if (payload.factorBase !== undefined) {
      unit.factorBase = payload.factorBase.trim()
    }
    if (payload.active !== undefined) {
      unit.estado = payload.active
    }

    try {
      await unit.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la unidad de medida')
    }

    return this.show(unit.id)
  }

  /**
   * Eliminación lógica: nunca borra la fila en PostgreSQL porque otras
   * tablas la referencian con ON DELETE RESTRICT.
   */
  async delete(id: number) {
    const unit = await this.show(id)

    if (!unit.estado) {
      throw new Exception('La unidad de medida ya está inactiva', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    unit.estado = false

    try {
      await unit.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo desactivar la unidad de medida')
    }

    return unit
  }
}
