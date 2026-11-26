import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ReglaCalculo from '#models/regla_calculo'
import UnidadMedida from '#models/unidad_medida'

export default class ReglaCalculoParametro extends BaseModel {
  static table = 'regla_calculo_parametro'

  @column({ isPrimary: true, columnName: 'id_parametro' })
  declare id: number

  @column({ columnName: 'id_regla_calculo' })
  declare reglaCalculoId: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare descripcion: string | null

  @column({ columnName: 'unidad_id' })
  declare unidadId: number | null

  @column()
  declare requerido: boolean

  @column()
  declare orden: number

  @belongsTo(() => ReglaCalculo, { foreignKey: 'reglaCalculoId' })
  declare regla: BelongsTo<typeof ReglaCalculo>

  @belongsTo(() => UnidadMedida, { foreignKey: 'unidadId' })
  declare unidad: BelongsTo<typeof UnidadMedida>
}
