import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * La tabla la consultan los factores de emisión.
 * El CRUD de fuentes de emisión vive en otro módulo.
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
