import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Regional from '#models/regional'
import Usuario from '#models/usuario'

export default class CentroFormacion extends BaseModel {
  static table = 'centro_formacion'

  @column({ isPrimary: true, columnName: 'id_centro' })
  declare id: number

  @column({ columnName: 'id_regional' })
  declare regionalId: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @belongsTo(() => Regional, { foreignKey: 'regionalId' })
  declare regional: BelongsTo<typeof Regional>

  @hasMany(() => Usuario, { foreignKey: 'centroId' })
  declare usuarios: HasMany<typeof Usuario>
}
