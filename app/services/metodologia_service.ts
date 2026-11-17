import Metodologia from '#models/metodologia'
import { rethrowDatabaseError } from '#services/database_error'
import { estaEnUso, limpiar, normalizarCodigo } from '#services/catalogo_reglas'
import { Exception } from '@adonisjs/core/exceptions'

type Payload = {
  codigo?: string
  nombre?: string
  tipo?: string
  descripcion?: string | null
  entidadFuente?: string | null
  active?: boolean
}

function consulta(id?: number) {
  const fila = Metodologia.query().withCount('versiones', (versiones) => {
    versiones.where('estado', true)
  })
  if (id) return fila.where('id', id)
  return fila.orderBy('nombre', 'asc')
}

export default class MetodologiaService {
  async list(includeInactive: boolean) {
    const filas = consulta()
    if (!includeInactive) filas.where('estado', true)
    return filas
  }

  async show(id: number) {
    const metodologia = await consulta(id).first()
    if (!metodologia) {
      throw new Exception('La metodología no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return metodologia
  }

  async create(payload: Payload) {
    const codigo = normalizarCodigo(payload.codigo!)
    await this.assertCodigoLibre(codigo)

    try {
      const metodologia = await Metodologia.create({
        codigo,
        nombre: payload.nombre!.trim(),
        tipo: payload.tipo!,
        descripcion: limpiar(payload.descripcion) ?? null,
        entidadFuente: limpiar(payload.entidadFuente) ?? null,
        estado: true,
      })
      return this.show(metodologia.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la metodología')
    }
  }

  async update(id: number, payload: Payload) {
    const metodologia = await Metodologia.find(id)
    if (!metodologia) {
      throw new Exception('La metodología no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    if (payload.active === false && !metodologia.estado) {
      throw new Exception('La metodología ya está inactiva', { status: 409, code: 'E_CONFLICT' })
    }

    if (
      payload.active === false &&
      (await estaEnUso(metodologia.id, [
        { tabla: 'metodologia_version', columna: 'id_metodologia', soloActivos: true },
      ]))
    ) {
      throw new Exception('Esta metodología tiene versiones activas', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    if (payload.codigo !== undefined) {
      const codigo = normalizarCodigo(payload.codigo)
      await this.assertCodigoLibre(codigo, metodologia.id)
      metodologia.codigo = codigo
    }
    if (payload.nombre !== undefined) metodologia.nombre = payload.nombre.trim()
    if (payload.tipo !== undefined) metodologia.tipo = payload.tipo
    if (payload.descripcion !== undefined) metodologia.descripcion = limpiar(payload.descripcion) ?? null
    if (payload.entidadFuente !== undefined) {
      metodologia.entidadFuente = limpiar(payload.entidadFuente) ?? null
    }
    if (payload.active !== undefined) metodologia.estado = payload.active

    try {
      await metodologia.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la metodología')
    }

    return this.show(metodologia.id)
  }

  private async assertCodigoLibre(codigo: string, exceptoId?: number) {
    const filas = Metodologia.query().whereRaw('lower(codigo) = lower(?)', [codigo])
    if (exceptoId) filas.whereNot('id', exceptoId)
    if (await filas.first()) {
      throw new Exception('Ya existe una metodología con ese código', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }
}
