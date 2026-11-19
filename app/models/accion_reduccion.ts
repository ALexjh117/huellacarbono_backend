import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import CalculoCarbono from '#models/calculo_carbono'
import FuenteEmision from '#models/fuente_emision'

export default class AccionReduccion extends BaseModel {
  static table = 'accion_reduccion'

  @column({ isPrimary: true, columnName: 'id_accion_reduccion' })
  declare id: number

  @column({ columnName: 'id_calculo_carbono' })
  declare calculoCarbonoId: number

  @column({ columnName: 'id_fuente_emision' })
  declare fuenteEmisionId: number | null

  @column()
  declare estrategia: string

  @column()
  declare indicador: string

  @column()
  declare meta: string

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @belongsTo(() => CalculoCarbono, { foreignKey: 'calculoCarbonoId' })
  declare calculo: BelongsTo<typeof CalculoCarbono>

  @belongsTo(() => FuenteEmision, { foreignKey: 'fuenteEmisionId' })
  declare fuenteEmision: BelongsTo<typeof FuenteEmision>
}
