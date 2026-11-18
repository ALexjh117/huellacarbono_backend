import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

/**
 * Periodo de medición de una organización. Cada dato de actividad referencia
 * un periodo, y el periodo define a qué proyecto (organización) pertenece.
 *
 * `estado` usa el vocabulario del esquema: ABIERTO | CERRADO | BLOQUEADO.
 */
export default class PeriodoMedicion extends BaseModel {
  static table = 'periodo_medicion'

  @column({ isPrimary: true, columnName: 'id_periodo' })
  declare id: number

  @column({ columnName: 'id_organizacion' })
  declare idOrganizacion: number

  @column()
  declare nombre: string

  @column.date({ columnName: 'fecha_inicio' })
  declare fechaInicio: DateTime

  @column.date({ columnName: 'fecha_fin' })
  declare fechaFin: DateTime

  @column()
  declare estado: string

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime
}
