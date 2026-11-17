import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import MetodologiaVersion from '#models/metodologia_version'

export default class Metodologia extends BaseModel {
  static table = 'metodologia'

  @column({ isPrimary: true, columnName: 'id_metodologia' })
  declare id: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare tipo: string

  @column()
  declare descripcion: string | null

  @column({ columnName: 'entidad_fuente' })
  declare entidadFuente: string | null

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @hasMany(() => MetodologiaVersion, { foreignKey: 'metodologiaId' })
  declare versiones: HasMany<typeof MetodologiaVersion>
}
