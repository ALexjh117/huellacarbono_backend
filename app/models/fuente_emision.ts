import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Su CRUD vive en el módulo de fuentes de emisión. La tabla también es
 * referenciada por factores, datos y resultados de carbono.
 */
export default class FuenteEmision extends BaseModel {
  static table = 'fuente_emision'

  @column({ isPrimary: true, columnName: 'id_fuente_emision' })
  declare id: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare categoria: string | null

  @column()
  declare descripcion: string | null

  @column()
  declare estado: boolean
}
