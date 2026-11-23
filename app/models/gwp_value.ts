import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import GwpSet from '#models/gwp_set'

export default class GwpValue extends BaseModel {
  static table = 'gwp_value'

  @column({ isPrimary: true, columnName: 'id_gwp_value' })
  declare id: number

  @column({ columnName: 'id_gwp_set' })
  declare gwpSetId: number

  @column({ columnName: 'gas_codigo' })
  declare gasCodigo: string

  @column({ columnName: 'nombre_gas' })
  declare nombreGas: string

  @column()
  declare valor: string

  @column()
  declare nota: string | null

  @belongsTo(() => GwpSet, { foreignKey: 'gwpSetId' })
  declare set: BelongsTo<typeof GwpSet>
}
