import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Municipio from '#models/municipio'

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

  @hasMany(() => Municipio, { foreignKey: 'departamentoId' })
  declare municipios: HasMany<typeof Municipio>
}
