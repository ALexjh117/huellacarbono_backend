import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Actividad from '#models/actividad'
import AlcanceEmision from '#models/alcance_emision'
import ActividadEmision from '#models/actividad_emision'
import SubcategoriaEmision from '#models/subcategoria_emision'
import FuenteEmision from '#models/fuente_emision'
import PeriodoMedicion from '#models/periodo_medicion'
import UnidadMedida from '#models/unidad_medida'

export default class DatoActividadCarbono extends BaseModel {
  static table = 'dato_actividad_carbono'

  @column({ isPrimary: true, columnName: 'id_dato_carbono' })
  declare id: number

  @column({ columnName: 'id_actividad' })
  declare actividadId: number

  @column({ columnName: 'id_periodo' })
  declare periodoId: number

  @column({ columnName: 'id_fuente_emision' })
  declare fuenteEmisionId: number

  @column({ columnName: 'id_alcance' })
  declare alcanceId: number

  @column({ columnName: 'id_actividad_emision' })
  declare actividadEmisionId: number | null

  @column({ columnName: 'id_subcategoria_emision' })
  declare subcategoriaEmisionId: number | null

  @column({ columnName: 'id_unidad' })
  declare unidadId: number

  @column({ columnName: 'id_usuario_registro' })
  declare usuarioRegistroId: number

  @column()
  declare cantidad: string

  @column({ columnName: 'parametros_calculo' })
  declare parametrosCalculo: Record<string, string | number | boolean | null>

  @column.date({ columnName: 'fecha_dato' })
  declare fechaDato: DateTime | null

  @column({ columnName: 'fuente_dato' })
  declare fuenteDato: string | null

  @column()
  declare observacion: string | null

  @column({ columnName: 'estado_registro' })
  declare estadoRegistro: string

  @column.dateTime({ columnName: 'fecha_registro' })
  declare fechaRegistro: DateTime | null

  @column.dateTime({ columnName: 'fecha_actualizacion' })
  declare fechaActualizacion: DateTime | null

  @belongsTo(() => Actividad, { foreignKey: 'actividadId' })
  declare actividad: BelongsTo<typeof Actividad>

  @belongsTo(() => PeriodoMedicion, { foreignKey: 'periodoId' })
  declare periodo: BelongsTo<typeof PeriodoMedicion>

  @belongsTo(() => FuenteEmision, { foreignKey: 'fuenteEmisionId' })
  declare fuenteEmision: BelongsTo<typeof FuenteEmision>

  @belongsTo(() => AlcanceEmision, { foreignKey: 'alcanceId' })
  declare alcance: BelongsTo<typeof AlcanceEmision>

  @belongsTo(() => ActividadEmision, { foreignKey: 'actividadEmisionId' })
  declare actividadEmision: BelongsTo<typeof ActividadEmision>

  @belongsTo(() => SubcategoriaEmision, { foreignKey: 'subcategoriaEmisionId' })
  declare subcategoriaEmision: BelongsTo<typeof SubcategoriaEmision>

  @belongsTo(() => UnidadMedida, { foreignKey: 'unidadId' })
  declare unidad: BelongsTo<typeof UnidadMedida>
}
