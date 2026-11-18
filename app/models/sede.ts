import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

/**
 * Sede de una organización (jerarquía: organizacion → sede → proceso →
 * actividad). Solo se declara la columna FK porque los datos de actividad
 * resuelven la pertenencia al proyecto recorriendo actividad → proceso →
 * sede → organizacion.
 */
export default class Sede extends BaseModel {
  static table = 'sede'

  @column({ isPrimary: true, columnName: 'id_sede' })
  declare id: number

  @column({ columnName: 'id_organizacion' })
  declare idOrganizacion: number

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime
}
