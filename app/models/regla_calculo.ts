import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import FuenteEmision from '#models/fuente_emision'
import MetodologiaVersion from '#models/metodologia_version'
import ReglaCalculoParametro from '#models/regla_calculo_parametro'

export default class ReglaCalculo extends BaseModel {
  static table = 'regla_calculo'

  @column({ isPrimary: true, columnName: 'id_regla_calculo' })
  declare id: number

  @column({ columnName: 'id_fuente_emision' })
  declare fuenteEmisionId: number

  @column({ columnName: 'id_version' })
  declare versionId: number | null

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column({ columnName: 'tipo_calculo' })
  declare tipoCalculo: string

  @column()
  declare formula: string | null

  @column()
  declare descripcion: string | null

  @column()
  declare metodologia: string | null

  @column({ columnName: 'referencia_bibliografica' })
  declare referenciaBibliografica: string | null

  @column({ columnName: 'version_metodologia' })
  declare versionMetodologia: string | null

  @column({ columnName: 'unidad_entrada_id' })
  declare unidadEntradaId: number | null

  @column({ columnName: 'unidad_resultado_id' })
  declare unidadResultadoId: number | null

  @column({ columnName: 'base_gases' })
  declare baseGases: string

  @column({ columnName: 'requiere_factor' })
  declare requiereFactor: boolean

  @column({ columnName: 'requiere_parametros' })
  declare requiereParametros: boolean

  @column()
  declare estado: boolean

  @belongsTo(() => FuenteEmision, { foreignKey: 'fuenteEmisionId' })
  declare fuenteEmision: BelongsTo<typeof FuenteEmision>

  @belongsTo(() => MetodologiaVersion, { foreignKey: 'versionId' })
  declare version: BelongsTo<typeof MetodologiaVersion>

  @hasMany(() => ReglaCalculoParametro, { foreignKey: 'reglaCalculoId' })
  declare parametros: HasMany<typeof ReglaCalculoParametro>
}
