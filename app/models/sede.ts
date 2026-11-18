import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Organizacion from '#models/organizacion'
import Proceso from '#models/proceso'
import Usuario from '#models/usuario'

export default class Sede extends BaseModel {
  static table = 'sede'

  @column({ isPrimary: true, columnName: 'id_sede' })
  declare id: number

  @column({ columnName: 'id_organizacion' })
  declare organizacionId: number

  @column()
  declare codigo: string | null

  @column()
  declare nombre: string

  @column()
  declare direccion: string | null

  @column()
  declare telefono: string | null

  @column()
  declare correo: string | null

  @column({ columnName: 'responsable_nombre' })
  declare responsableNombre: string | null

  @column({ columnName: 'responsable_cargo' })
  declare responsableCargo: string | null

  @column({ columnName: 'responsable_correo' })
  declare responsableCorreo: string | null

  @column({ columnName: 'responsable_telefono' })
  declare responsableTelefono: string | null

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @belongsTo(() => Organizacion, { foreignKey: 'organizacionId' })
  declare organizacion: BelongsTo<typeof Organizacion>

  @manyToMany(() => Usuario, {
    pivotTable: 'usuario_sede',
    localKey: 'id',
    pivotForeignKey: 'id_sede',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'id_usuario',
  })
  declare usuarios: ManyToMany<typeof Usuario>

  @hasMany(() => Proceso, { foreignKey: 'sedeId' })
  declare procesos: HasMany<typeof Proceso>
}
