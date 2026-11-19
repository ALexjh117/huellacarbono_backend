import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Actividad from '#models/actividad'
import AlcanceEmision from '#models/alcance_emision'
import CalculoCarbono from '#models/calculo_carbono'
import FuenteEmision from '#models/fuente_emision'
import UnidadMedida from '#models/unidad_medida'

export default class ResultadoCarbono extends BaseModel {
  static table = 'resultado_carbono'

  @column({ isPrimary: true, columnName: 'id_resultado_carbono' })
  declare id: number

  @column({ columnName: 'id_calculo_carbono' })
  declare calculoCarbonoId: number

  @column({ columnName: 'id_actividad' })
  declare actividadId: number | null

  @column({ columnName: 'id_alcance' })
  declare alcanceId: number

  @column({ columnName: 'id_fuente_emision' })
  declare fuenteEmisionId: number

  @column({ columnName: 'id_unidad' })
  declare unidadId: number

  @column({ columnName: 'valor_co2e' })
  declare valorCo2e: string

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @belongsTo(() => CalculoCarbono, { foreignKey: 'calculoCarbonoId' })
  declare calculo: BelongsTo<typeof CalculoCarbono>

  @belongsTo(() => Actividad, { foreignKey: 'actividadId' })
  declare actividad: BelongsTo<typeof Actividad>

  @belongsTo(() => AlcanceEmision, { foreignKey: 'alcanceId' })
  declare alcance: BelongsTo<typeof AlcanceEmision>

  @belongsTo(() => FuenteEmision, { foreignKey: 'fuenteEmisionId' })
  declare fuenteEmision: BelongsTo<typeof FuenteEmision>

  @belongsTo(() => UnidadMedida, { foreignKey: 'unidadId' })
  declare unidad: BelongsTo<typeof UnidadMedida>
}
