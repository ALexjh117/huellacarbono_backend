import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Organizacion from '#models/organizacion'

export default class Sede extends BaseModel {
  static table = 'sede'

  @column({ isPrimary: true, columnName: 'id_sede', consume: (value) => Number(value) })
  declare id: number

  @column({ columnName: 'id_organizacion', consume: (value) => Number(value) })
  declare organizacionId: number

  @column()
  declare nombre: string

  @column()
  declare codigo: string | null

  @column()
  declare direccion: string | null

  @column()
  declare telefono: string | null

  @column()
  declare correo: string | null

  @column()
  declare responsableNombre: string | null

  @column()
  declare responsableCargo: string | null

  @column()
  declare responsableCorreo: string | null

  @column()
  declare responsableTelefono: string | null

  @column()
  declare estado: boolean

  @column.dateTime({ autoCreate: true, columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime

  @belongsTo(() => Organizacion, { foreignKey: 'organizacionId' })
  declare organizacion: BelongsTo<typeof Organizacion>
}