import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Proceso from '#models/proceso'

export default class Actividad extends BaseModel {
  static table = 'actividad'

  @column({ isPrimary: true, columnName: 'id_actividad' })
  declare id: number

  @column({ columnName: 'id_proceso' })
  declare procesoId: number

  @column()
  declare nombre: string

  @column()
  declare descripcion: string | null

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @belongsTo(() => Proceso, { foreignKey: 'procesoId' })
  declare proceso: BelongsTo<typeof Proceso>
}
