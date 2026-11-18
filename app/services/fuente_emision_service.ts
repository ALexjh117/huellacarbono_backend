import FuenteEmision from '#models/fuente_emision'
import { estaEnUso, limpiar, normalizarCodigo } from '#services/catalogo_reglas'
import { rethrowDatabaseError } from '#services/database_error'
import { Exception } from '@adonisjs/core/exceptions'

type CreateFuentePayload = {
  codigo: string
  nombre: string
  categoria?: string | null
  descripcion?: string | null
}

type UpdateFuentePayload = {
  codigo?: string
  nombre?: string
  categoria?: string | null
  descripcion?: string | null
  active?: boolean
}

/**
 * Las tres tablas referencian fuente_emision con ON DELETE RESTRICT.
 * Las filas que llegan a dato_actividad_carbono como RECHAZADO no cuentan
 * como uso, igual que ocurre con el catálogo de alcances.
 */
const USO = [
  { tabla: 'factor_emision', columna: 'id_fuente_emision' },
  { tabla: 'dato_actividad_carbono', columna: 'id_fuente_emision', excluirRechazados: true },
  { tabla: 'resultado_carbono', columna: 'id_fuente_emision' },
]

export default class FuenteEmisionService {
  async list(includeInactive: boolean) {
    const query = FuenteEmision.query().orderBy('nombre', 'asc')
    if (!includeInactive) {
      query.where('estado', true)
    }
    return query
  }

  async show(id: number) {
    const fuente = await FuenteEmision.query().where('id', id).first()
    if (!fuente) {
      throw new Exception('La fuente de emisión no existe', {
        status: 404,
        code: 'E_NOT_FOUND',
      })
    }
    return fuente
  }

  async create(payload: CreateFuentePayload) {
    const codigo = normalizarCodigo(payload.codigo)
    const nombre = payload.nombre.trim()
    await this.assertCodigoLibre(codigo)
    await this.assertNombreLibre(nombre)

    try {
      const fuente = await FuenteEmision.create({
        codigo,
        nombre,
        categoria: limpiar(payload.categoria) ?? null,
        descripcion: limpiar(payload.descripcion) ?? null,
        estado: true,
      })
      return await this.show(fuente.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la fuente de emisión')
    }
  }

  async update(id: number, payload: UpdateFuentePayload) {
    const fuente = await this.show(id)

    if (payload.active === false && !fuente.estado) {
      throw new Exception('La fuente de emisión ya está inactiva', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    if (payload.active === false && (await estaEnUso(fuente.id, USO))) {
      throw new Exception('Esta fuente ya tiene factores o datos de carbono asociados', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    if (payload.codigo !== undefined) {
      const codigo = normalizarCodigo(payload.codigo)
      await this.assertCodigoLibre(codigo, id)
      fuente.codigo = codigo
    }

    if (payload.nombre !== undefined) {
      const nombre = payload.nombre.trim()
      await this.assertNombreLibre(nombre, id)
      fuente.nombre = nombre
    }

    if (payload.categoria !== undefined) {
      fuente.categoria = limpiar(payload.categoria) ?? null
    }

    if (payload.descripcion !== undefined) {
      fuente.descripcion = limpiar(payload.descripcion) ?? null
    }

    if (payload.active !== undefined) {
      fuente.estado = payload.active
    }

    try {
      await fuente.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la fuente de emisión')
    }

    return this.show(fuente.id)
  }

  /**
   * Eliminación lógica: nunca borra la fila en PostgreSQL porque factor_emision,
   * dato_actividad_carbono y resultado_carbono la referencian con ON DELETE RESTRICT.
   */
  async delete(id: number) {
    const fuente = await this.show(id)

    if (!fuente.estado) {
      throw new Exception('La fuente de emisión ya está inactiva', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    if (await estaEnUso(fuente.id, USO)) {
      throw new Exception('Esta fuente ya tiene factores o datos de carbono asociados', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    fuente.estado = false

    try {
      await fuente.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo desactivar la fuente de emisión')
    }

    return fuente
  }

  private async assertCodigoLibre(codigo: string, exceptoId?: number) {
    const consulta = FuenteEmision.query().whereRaw('lower(codigo) = lower(?)', [codigo])
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception('Ya existe una fuente de emisión con ese código', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }

  private async assertNombreLibre(nombre: string, exceptoId?: number) {
    const consulta = FuenteEmision.query().whereRaw('lower(nombre) = lower(?)', [nombre])
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception('Ya existe una fuente de emisión con ese nombre', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }
}
