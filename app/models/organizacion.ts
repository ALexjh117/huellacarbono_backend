import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Sede from '#models/sede'

export default class Organizacion extends BaseModel {
  static table = 'organizacion'

  @column({ isPrimary: true, columnName: 'id_organizacion', consume: (value) => Number(value) })
  declare id: number

  @column()
  declare nombre: string

  @column()
  declare nombreCorto: string | null

  @column()
  declare nit: string | null

  @column()
  declare tipo: string

  @column()
  declare sectorEconomico: string | null

  @column()
  declare direccion: string | null

  @column({ columnName: 'id_municipio' })
  declare municipioId: number | null

  @column()
  declare correo: string | null

  @column()
  declare telefono: string | null

  @column()
  declare representanteNombre: string | null

  @column()
  declare representanteTipoDocumento: string | null

  @column()
  declare representanteNumeroDocumento: string | null

  @column()
  declare representanteCorreo: string | null

  @column()
  declare representanteTelefono: string | null

  @column()
  declare estado: boolean

  @column.dateTime({ autoCreate: true, columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime

  @hasMany(() => Sede, { foreignKey: 'organizacionId' })
  declare sedes: HasMany<typeof Sede>
}