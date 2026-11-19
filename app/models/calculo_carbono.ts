import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import MetodologiaVersion from '#models/metodologia_version'
import Organizacion from '#models/organizacion'
import PeriodoMedicion from '#models/periodo_medicion'
import ResultadoCarbono from '#models/resultado_carbono'
import UnidadMedida from '#models/unidad_medida'
import Usuario from '#models/usuario'

export type FilaOmitida = {
  datoId: number
  actividadNombre: string
  fuenteNombre: string
  cantidad: string
  unidadSimbolo: string
  motivo: string
}

export default class CalculoCarbono extends BaseModel {
  static table = 'calculo_carbono'

  @column({ isPrimary: true, columnName: 'id_calculo_carbono' })
  declare id: number

  @column({ columnName: 'id_organizacion' })
  declare organizacionId: number

  @column({ columnName: 'id_periodo' })
  declare periodoId: number

  @column({ columnName: 'id_version' })
  declare versionId: number

  @column({ columnName: 'id_usuario' })
  declare usuarioId: number

  @column({ columnName: 'id_unidad_resultado' })
  declare unidadResultadoId: number | null

  @column.dateTime({ columnName: 'fecha_calculo' })
  declare fechaCalculo: DateTime | null

  @column()
  declare estado: string

  @column({ columnName: 'total_co2e' })
  declare totalCo2e: string | null

  @column({ columnName: 'unidades_producidas' })
  declare unidadesProducidas: string | null

  @column({ columnName: 'unidad_funcional' })
  declare unidadFuncional: string | null

  @column()
  declare observacion: string | null

  omitidos: FilaOmitida[] = []

  @belongsTo(() => Organizacion, { foreignKey: 'organizacionId' })
  declare organizacion: BelongsTo<typeof Organizacion>

  @belongsTo(() => PeriodoMedicion, { foreignKey: 'periodoId' })
  declare periodo: BelongsTo<typeof PeriodoMedicion>

  @belongsTo(() => MetodologiaVersion, { foreignKey: 'versionId' })
  declare version: BelongsTo<typeof MetodologiaVersion>

  @belongsTo(() => Usuario, { foreignKey: 'usuarioId' })
  declare usuario: BelongsTo<typeof Usuario>

  @belongsTo(() => UnidadMedida, { foreignKey: 'unidadResultadoId' })
  declare unidadResultado: BelongsTo<typeof UnidadMedida>

  @hasMany(() => ResultadoCarbono, { foreignKey: 'calculoCarbonoId' })
  declare resultados: HasMany<typeof ResultadoCarbono>
}
