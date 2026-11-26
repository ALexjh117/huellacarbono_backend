import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Actividad from '#models/actividad'
import AlcanceEmision from '#models/alcance_emision'
import ActividadEmision from '#models/actividad_emision'
import SubcategoriaEmision from '#models/subcategoria_emision'
import CalculoCarbono from '#models/calculo_carbono'
import FuenteEmision from '#models/fuente_emision'
import UnidadMedida from '#models/unidad_medida'
import DatoActividadCarbono from '#models/dato_actividad_carbono'
import GwpValue from '#models/gwp_value'

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

  @column({ columnName: 'id_actividad_emision' })
  declare actividadEmisionId: number | null

  @column({ columnName: 'id_subcategoria_emision' })
  declare subcategoriaEmisionId: number | null

  @column({ columnName: 'id_unidad' })
  declare unidadId: number

  @column({ columnName: 'valor_co2e' })
  declare valorCo2e: string

  @column({ columnName: 'id_dato_carbono' })
  declare datoCarbonoId: number | null

  @column({ columnName: 'id_factor_emision' })
  declare factorEmisionId: number | null

  @column({ columnName: 'id_regla_calculo' })
  declare reglaCalculoId: number | null

  @column({ columnName: 'gas_calculado' })
  declare gasCalculado: string | null

  @column({ columnName: 'gas_especifico' })
  declare gasEspecifico: string | null

  @column({ columnName: 'cantidad_emision' })
  declare cantidadEmision: string | null

  @column({ columnName: 'unidad_emision_id' })
  declare unidadEmisionId: number | null

  @column({ columnName: 'id_gwp_value' })
  declare gwpValueId: number | null

  @column({ columnName: 'valor_gwp' })
  declare valorGwp: string | null

  @column({ columnName: 'gwp_horizonte_anios' })
  declare gwpHorizonteAnios: number | null

  @column({ columnName: 'gwp_version' })
  declare gwpVersion: string | null

  @column({ columnName: 'version_motor' })
  declare versionMotor: string | null

  @column({ columnName: 'cantidad_original' })
  declare cantidadOriginal: string | null

  @column({ columnName: 'cantidad_convertida' })
  declare cantidadConvertida: string | null

  @column({ columnName: 'id_unidad_original' })
  declare unidadOriginalId: number | null

  @column({ columnName: 'id_unidad_utilizada' })
  declare unidadUtilizadaId: number | null

  @column({ columnName: 'valor_factor' })
  declare valorFactor: string | null

  /** Densidad usada al convertir (copia; no depende del dato de actividad). */
  @column({ columnName: 'densidad_valor' })
  declare densidadValor: string | null

  @column({ columnName: 'id_unidad_densidad' })
  declare unidadDensidadId: number | null

  /** Poder calorífico usado al convertir (copia; no depende del dato). */
  @column({ columnName: 'poder_calorifico_valor' })
  declare poderCalorificoValor: string | null

  @column({ columnName: 'id_unidad_poder_calorifico' })
  declare unidadPoderCalorificoId: number | null

  /** Copia de parametros_calculo del dato en el momento del cálculo. */
  @column({ columnName: 'parametros_calculo' })
  declare parametrosCalculo: Record<string, string | number | boolean | null> | null

  @column({ columnName: 'factor_codigo' })
  declare factorCodigo: string | null

  @column({ columnName: 'factor_fuente' })
  declare factorFuente: string | null

  @column({ columnName: 'factor_version' })
  declare factorVersion: string | null

  @column({ columnName: 'factor_anio_aplicacion' })
  declare factorAnioAplicacion: number | null

  @column({ columnName: 'factor_anio_publicacion' })
  declare factorAnioPublicacion: number | null

  @column({ columnName: 'factor_institucion_responsable' })
  declare factorInstitucionResponsable: string | null

  @column({ columnName: 'factor_origen' })
  declare factorOrigen: string | null

  @column()
  declare metodologia: string | null

  @column({ columnName: 'base_gases' })
  declare baseGases: string | null

  @column.dateTime({ columnName: 'fecha_calculo' })
  declare fechaCalculo: DateTime | null

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

  @belongsTo(() => ActividadEmision, { foreignKey: 'actividadEmisionId' })
  declare actividadEmision: BelongsTo<typeof ActividadEmision>

  @belongsTo(() => SubcategoriaEmision, { foreignKey: 'subcategoriaEmisionId' })
  declare subcategoriaEmision: BelongsTo<typeof SubcategoriaEmision>

  @belongsTo(() => UnidadMedida, { foreignKey: 'unidadId' })
  declare unidad: BelongsTo<typeof UnidadMedida>

  @belongsTo(() => DatoActividadCarbono, { foreignKey: 'datoCarbonoId' })
  declare datoCarbono: BelongsTo<typeof DatoActividadCarbono>

  @belongsTo(() => GwpValue, { foreignKey: 'gwpValueId' })
  declare gwp: BelongsTo<typeof GwpValue>
}
