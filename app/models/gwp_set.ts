import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import GwpValue from '#models/gwp_value'
import { DateTime } from 'luxon'

export default class GwpSet extends BaseModel {
  static table = 'gwp_set'

  @column({ isPrimary: true, columnName: 'id_gwp_set' })
  declare id: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column({ columnName: 'horizonte_anios' })
  declare horizonteAnios: number

  @column({ columnName: 'estandar_version' })
  declare estandarVersion: string

  @column({ columnName: 'fuente_cientifica' })
  declare fuenteCientifica: string

  @column()
  declare referencia: string | null

  @column.date({ columnName: 'fecha_publicacion' })
  declare fechaPublicacion: DateTime | null

  @column()
  declare estado: boolean

  @hasMany(() => GwpValue, { foreignKey: 'gwpSetId' })
  declare gases: HasMany<typeof GwpValue>
}
