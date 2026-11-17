import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Actividad from '#models/actividad'
import Sede from '#models/sede'

export default class Proceso extends BaseModel {
  static table = 'proceso'

  @column({ isPrimary: true, columnName: 'id_proceso' })
  declare id: number

  @column({ columnName: 'id_sede' })
  declare sedeId: number

  @column()
  declare nombre: string

  @column()
  declare descripcion: string | null

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @belongsTo(() => Sede, { foreignKey: 'sedeId' })
  declare sede: BelongsTo<typeof Sede>

  @hasMany(() => Actividad, { foreignKey: 'procesoId' })
  declare actividades: HasMany<typeof Actividad>
}
