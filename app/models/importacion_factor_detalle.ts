import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import ImportacionFactor from '#models/importacion_factor'

export type AccionImportacion = 'INSERTAR' | 'ACTUALIZAR' | 'DUPLICADO' | 'RECHAZADO'

export default class ImportacionFactorDetalle extends BaseModel {
  static table = 'importacion_factor_detalle'

  @column({ isPrimary: true, columnName: 'id_detalle' })
  declare id: number

  @column({ columnName: 'id_importacion' })
  declare importacionId: number

  @column()
  declare fila: number

  @column()
  declare accion: AccionImportacion

  @column()
  declare codigo: string | null

  @column({ columnName: 'id_fuente_emision' })
  declare fuenteEmisionId: number | null

  @column({ columnName: 'id_factor_emision' })
  declare factorEmisionId: number | null

  @column()
  declare mensaje: string | null

  /** Fila tal como llegó en el archivo (evidencia de la carga). */
  @column()
  declare datos: Record<string, unknown> | null

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @belongsTo(() => ImportacionFactor, { foreignKey: 'importacionId' })
  declare importacion: BelongsTo<typeof ImportacionFactor>
}
