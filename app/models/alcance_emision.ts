import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AlcanceEmision extends BaseModel {
  static table = 'alcance_emision'

  @column({ isPrimary: true, columnName: 'id_alcance' })
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
