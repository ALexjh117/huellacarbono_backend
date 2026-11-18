import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Departamento from '#models/departamento'
import Organizacion from '#models/organizacion'

export default class Municipio extends BaseModel {
  static table = 'municipio'

  @column({ isPrimary: true, columnName: 'id_municipio' })
  declare id: number

  @column({ columnName: 'id_departamento' })
  declare departamentoId: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @belongsTo(() => Departamento, { foreignKey: 'departamentoId' })
  declare departamento: BelongsTo<typeof Departamento>

  @hasMany(() => Organizacion, { foreignKey: 'municipioId' })
  declare organizaciones: HasMany<typeof Organizacion>
}
