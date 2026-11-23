import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import UnidadMedida from '#models/unidad_medida'

export default class ConversionUnidad extends BaseModel {
  static table = 'conversion_unidad'

  @column({ isPrimary: true, columnName: 'id_conversion' })
  declare id: number

  @column({ columnName: 'id_unidad_origen' })
  declare unidadOrigenId: number

  @column({ columnName: 'id_unidad_destino' })
  declare unidadDestinoId: number

  @column()
  declare factor: string

  @column()
  declare tipo: string

  @column({ columnName: 'parametro_codigo' })
  declare parametroCodigo: string | null

  @column({ columnName: 'parametro_unidad_id' })
  declare parametroUnidadId: number | null

  @column({ columnName: 'operacion_parametro' })
  declare operacionParametro: 'MULTIPLICAR' | 'DIVIDIR' | null

  @column()
  declare descripcion: string | null

  @column()
  declare estado: boolean

  @belongsTo(() => UnidadMedida, { foreignKey: 'unidadOrigenId' })
  declare unidadOrigen: BelongsTo<typeof UnidadMedida>

  @belongsTo(() => UnidadMedida, { foreignKey: 'unidadDestinoId' })
  declare unidadDestino: BelongsTo<typeof UnidadMedida>
}
