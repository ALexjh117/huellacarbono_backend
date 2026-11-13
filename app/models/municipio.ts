import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Departamento from '#models/departamento'

export default class Municipio extends BaseModel {
  static table = 'municipio'

  @column({ isPrimary: true, columnName: 'id_municipio' })
  declare id: number

  @column({ columnName: 'id_departamento' })
  declare idDepartamento: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @belongsTo(() => Departamento, {
    foreignKey: 'idDepartamento',
  })
  declare departamento: BelongsTo<typeof Departamento>
}
