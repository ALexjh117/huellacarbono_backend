import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Metodologia from '#models/metodologia'
import GwpSet from '#models/gwp_set'

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

  @column({ columnName: 'referencia_documental' })
  declare referenciaDocumental: string | null

  @column()
  declare estado: boolean

  @column({ columnName: 'id_gwp_set' })
  declare gwpSetId: number | null

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @belongsTo(() => Metodologia, { foreignKey: 'metodologiaId' })
  declare metodologia: BelongsTo<typeof Metodologia>

  @belongsTo(() => GwpSet, { foreignKey: 'gwpSetId' })
  declare gwpSet: BelongsTo<typeof GwpSet>
}
