import { Exception } from '@adonisjs/core/exceptions'
import type { LucidModel } from '@adonisjs/lucid/types/model'
import { rethrowDatabaseError } from '#services/database_error'
import {
  estaEnUso,
  limpiar,
  normalizarCodigo,
  type UsoCatalogo,
} from '#services/catalogo_reglas'

type Fila = {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  estado: boolean
  save(): Promise<Fila>
}

export type PayloadCatalogo = {
  codigo?: string
  nombre?: string
  descripcion?: string | null
  active?: boolean
}

export type TextosCatalogo = {
  noExiste: string
  yaInactivo: string
  codigoDuplicado: string
  nombreDuplicado: string
  enUso: string
}

export default class CatalogoSimpleService {
  constructor(
    private Modelo: LucidModel,
    private textos: TextosCatalogo,
    private usos: UsoCatalogo[]
  ) {}

  async list(includeInactive: boolean) {
    const consulta = this.Modelo.query().orderBy('nombre', 'asc')
    if (!includeInactive) consulta.where('estado', true)
    return consulta
  }

  async show(id: number) {
    const fila = (await this.Modelo.find(id)) as unknown as Fila | null
    if (!fila) throw new Exception(this.textos.noExiste, { status: 404, code: 'E_NOT_FOUND' })
    return fila
  }

  async create(payload: PayloadCatalogo) {
    const codigo = normalizarCodigo(payload.codigo!)
    const nombre = payload.nombre!.trim()
    await this.assertCodigoLibre(codigo)
    await this.assertNombreLibre(nombre)

    try {
      return (await this.Modelo.create({
        codigo,
        nombre,
        descripcion: limpiar(payload.descripcion) ?? null,
        estado: true,
      })) as unknown as Fila
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el registro')
    }
  }

  async update(id: number, payload: PayloadCatalogo) {
    const fila = (await this.Modelo.find(id)) as unknown as Fila | null
    if (!fila) throw new Exception(this.textos.noExiste, { status: 404, code: 'E_NOT_FOUND' })

    if (payload.active === false && !fila.estado) {
      throw new Exception(this.textos.yaInactivo, { status: 409, code: 'E_CONFLICT' })
    }

    if (payload.active === false && (await estaEnUso(fila.id, this.usos))) {
      throw new Exception(this.textos.enUso, { status: 409, code: 'E_CONFLICT' })
    }

    if (payload.codigo !== undefined) {
      const codigo = normalizarCodigo(payload.codigo)
      await this.assertCodigoLibre(codigo, fila.id)
      fila.codigo = codigo
    }
    if (payload.nombre !== undefined) {
      const nombre = payload.nombre.trim()
      await this.assertNombreLibre(nombre, fila.id)
      fila.nombre = nombre
    }
    if (payload.descripcion !== undefined) fila.descripcion = limpiar(payload.descripcion) ?? null
    if (payload.active !== undefined) fila.estado = payload.active

    try {
      await fila.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el catálogo')
    }

    return fila
  }

  private async assertCodigoLibre(codigo: string, exceptoId?: number) {
    const consulta = this.Modelo.query().whereRaw('lower(codigo) = lower(?)', [codigo])
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception(this.textos.codigoDuplicado, { status: 409, code: 'E_DUPLICATE' })
    }
  }

  private async assertNombreLibre(nombre: string, exceptoId?: number) {
    const consulta = this.Modelo.query().whereRaw('lower(nombre) = lower(?)', [nombre])
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception(this.textos.nombreDuplicado, { status: 409, code: 'E_DUPLICATE' })
    }
  }
}
