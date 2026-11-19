import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Organizacion from '#models/organizacion'

export default class PeriodoMedicion extends BaseModel {
  static table = 'periodo_medicion'

  @column({ isPrimary: true, columnName: 'id_periodo' })
  declare id: number

  @column({ columnName: 'id_organizacion' })
  declare organizacionId: number

  @column()
  declare nombre: string

  @column.date({ columnName: 'fecha_inicio' })
  declare fechaInicio: DateTime

  @column.date({ columnName: 'fecha_fin' })
  declare fechaFin: DateTime

  @column()
  declare estado: string

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @belongsTo(() => Organizacion, { foreignKey: 'organizacionId' })
  declare organizacion: BelongsTo<typeof Organizacion>
}
