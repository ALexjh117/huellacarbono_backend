import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Metodologia from '#models/metodologia'

export default class MetodologiaVersion extends BaseModel {
  static table = 'metodologia_version'

  @column({ isPrimary: true, columnName: 'id_version' })
  declare id: number

  @column({ columnName: 'id_metodologia' })
  declare metodologiaId: number

  @column({ columnName: 'numero_version' })
  declare numeroVersion: string

  @column.date({ columnName: 'fecha_inicio_vigencia' })
  declare fechaInicioVigencia: DateTime

  @column.date({ columnName: 'fecha_fin_vigencia' })
  declare fechaFinVigencia: DateTime | null

  @column()
  declare descripcion: string | null

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @belongsTo(() => Metodologia, { foreignKey: 'metodologiaId' })
  declare metodologia: BelongsTo<typeof Metodologia>
}
