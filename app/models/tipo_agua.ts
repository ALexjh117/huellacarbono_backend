import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class TipoAgua extends BaseModel {
  static table = 'tipo_agua'

  @column({ isPrimary: true, columnName: 'id_tipo_agua' })
  declare id: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare descripcion: string | null

  @column()
  declare estado: boolean
}
