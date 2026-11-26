import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import FuenteEmision from '#models/fuente_emision'
import MetodologiaVersion from '#models/metodologia_version'
import UnidadMedida from '#models/unidad_medida'
import ImportacionFactor from '#models/importacion_factor'

export default class FactorEmision extends BaseModel {
  static table = 'factor_emision'

  @column({ isPrimary: true, columnName: 'id_factor_emision' })
  declare id: number

  @column({ columnName: 'id_version' })
  declare versionId: number

  @column({ columnName: 'id_fuente_emision' })
  declare fuenteEmisionId: number

  @column({ columnName: 'id_unidad_entrada' })
  declare unidadEntradaId: number

  @column({ columnName: 'id_unidad_salida' })
  declare unidadSalidaId: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare valor: string

  /** Gas base del factor: CO2, CH4, N2O, CO2E u OTRO. */
  @column()
  declare gas: string

  /** Especie exacta para CH4 u OTRO (por ejemplo, la clase de CH4 o R-134a). */
  @column({ columnName: 'gas_especifico' })
  declare gasEspecifico: string | null

  @column({ columnName: 'estado_aprobacion' })
  declare estadoAprobacion: 'BORRADOR' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'

  @column()
  declare fuente: string | null

  @column()
  declare region: string | null

  @column({ columnName: 'institucion_responsable' })
  declare institucionResponsable: string | null

  @column({ columnName: 'anio_publicacion' })
  declare anioPublicacion: number | null

  @column({ columnName: 'anio_aplicacion' })
  declare anioAplicacion: number | null

  @column()
  declare origen: string | null

  @column({ columnName: 'id_importacion' })
  declare importacionId: number | null

  @column({ columnName: 'sector_categoria' })
  declare sectorCategoria: string | null

  @column.date({ columnName: 'fecha_inicio_vigencia' })
  declare fechaInicioVigencia: DateTime

  @column.date({ columnName: 'fecha_fin_vigencia' })
  declare fechaFinVigencia: DateTime | null

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @belongsTo(() => MetodologiaVersion, { foreignKey: 'versionId' })
  declare version: BelongsTo<typeof MetodologiaVersion>

  @belongsTo(() => FuenteEmision, { foreignKey: 'fuenteEmisionId' })
  declare fuenteEmision: BelongsTo<typeof FuenteEmision>

  @belongsTo(() => UnidadMedida, { foreignKey: 'unidadEntradaId' })
  declare unidadEntrada: BelongsTo<typeof UnidadMedida>

  @belongsTo(() => UnidadMedida, { foreignKey: 'unidadSalidaId' })
  declare unidadSalida: BelongsTo<typeof UnidadMedida>

  @belongsTo(() => ImportacionFactor, { foreignKey: 'importacionId' })
  declare importacion: BelongsTo<typeof ImportacionFactor>
}
