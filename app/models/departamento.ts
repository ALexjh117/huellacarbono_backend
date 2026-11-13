import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Departamento extends BaseModel {
  static table = 'departamento'

  @column({ isPrimary: true, columnName: 'id_departamento' })
  declare id: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare estado: boolean
}
