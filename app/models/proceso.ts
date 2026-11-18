import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Sede from '#models/sede'

/** Proceso de una sede. Integra la cadena de pertenencia al proyecto. */
export default class Proceso extends BaseModel {
  static table = 'proceso'

  @column({ isPrimary: true, columnName: 'id_proceso' })
  declare id: number

  @column({ columnName: 'id_sede' })
  declare idSede: number

  @column()
  declare nombre: string

  @column()
  declare descripcion: string | null

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime

  @belongsTo(() => Sede, { foreignKey: 'idSede' })
  declare sede: BelongsTo<typeof Sede>
}
