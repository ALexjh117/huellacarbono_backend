import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Municipio from '#models/municipio'
import Sede from '#models/sede'

export default class Organizacion extends BaseModel {
  static table = 'organizacion'

  @column({ isPrimary: true, columnName: 'id_organizacion' })
  declare id: number

  @column({ columnName: 'id_municipio' })
  declare municipioId: number

  @column()
  declare nombre: string

  @column({ columnName: 'nombre_corto' })
  declare nombreCorto: string | null

  @column()
  declare nit: string

  @column()
  declare tipo: string

  @column({ columnName: 'sector_economico' })
  declare sectorEconomico: string | null

  @column()
  declare correo: string | null

  @column()
  declare telefono: string | null

  @column()
  declare direccion: string | null

  @column({ columnName: 'representante_nombre' })
  declare representanteNombre: string | null

  @column({ columnName: 'representante_tipo_documento' })
  declare representanteTipoDocumento: string | null

  @column({ columnName: 'representante_numero_documento' })
  declare representanteNumeroDocumento: string | null

  @column({ columnName: 'representante_correo' })
  declare representanteCorreo: string | null

  @column({ columnName: 'representante_telefono' })
  declare representanteTelefono: string | null

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @belongsTo(() => Municipio, { foreignKey: 'municipioId' })
  declare municipio: BelongsTo<typeof Municipio>

  @hasMany(() => Sede, { foreignKey: 'organizacionId' })
  declare sedes: HasMany<typeof Sede>
}
