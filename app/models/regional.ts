import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import CentroFormacion from '#models/centro_formacion'

export default class Regional extends BaseModel {
  static table = 'regional'

  @column({ isPrimary: true, columnName: 'id_regional' })
  declare id: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @hasMany(() => CentroFormacion, { foreignKey: 'regionalId' })
  declare centros: HasMany<typeof CentroFormacion>
}
