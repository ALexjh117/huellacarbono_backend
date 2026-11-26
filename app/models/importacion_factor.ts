import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import FactorEmision from '#models/factor_emision'
import ImportacionFactorDetalle from '#models/importacion_factor_detalle'

export default class ImportacionFactor extends BaseModel {
  static table = 'importacion_factor'

  @column({ isPrimary: true, columnName: 'id_importacion' })
  declare id: number

  @column({ columnName: 'id_usuario' })
  declare usuarioId: number | null

  @column()
  declare origen: string

  @column()
  declare referencia: string | null

  @column()
  declare archivo: string | null

  @column()
  declare hash: string

  @column()
  declare estado: 'PREVISUALIZADA' | 'APLICADA' | 'RECHAZADA' | 'PARCIAL'

  @column({ columnName: 'total_filas' })
  declare totalFilas: number

  @column()
  declare insertados: number

  @column()
  declare actualizados: number

  @column()
  declare duplicados: number

  @column()
  declare rechazados: number

  @column()
  declare resumen: Record<string, unknown> | null

  @column()
  declare errores: Record<string, unknown> | null

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @column.dateTime({ columnName: 'fecha_aplicacion' })
  declare fechaAplicacion: DateTime | null

  @hasMany(() => FactorEmision, { foreignKey: 'importacionId' })
  declare factores: HasMany<typeof FactorEmision>

  @hasMany(() => ImportacionFactorDetalle, { foreignKey: 'importacionId' })
  declare detalles: HasMany<typeof ImportacionFactorDetalle>
}
