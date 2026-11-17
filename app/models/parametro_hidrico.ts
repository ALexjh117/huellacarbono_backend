import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import MetodologiaVersion from '#models/metodologia_version'
import UnidadMedida from '#models/unidad_medida'

export default class ParametroHidrico extends BaseModel {
  static table = 'parametro_hidrico'

  @column({ isPrimary: true, columnName: 'id_parametro_hidrico' })
  declare id: number

  @column({ columnName: 'id_version' })
  declare versionId: number

  @column({ columnName: 'id_unidad' })
  declare unidadId: number | null

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare valor: string

  @column()
  declare fuente: string | null

  @column.date({ columnName: 'fecha_inicio_vigencia' })
  declare fechaInicioVigencia: DateTime

  @column.date({ columnName: 'fecha_fin_vigencia' })
  declare fechaFinVigencia: DateTime | null

  @column()
  declare estado: boolean

  @belongsTo(() => MetodologiaVersion, { foreignKey: 'versionId' })
  declare version: BelongsTo<typeof MetodologiaVersion>

  @belongsTo(() => UnidadMedida, { foreignKey: 'unidadId' })
  declare unidad: BelongsTo<typeof UnidadMedida>
}
