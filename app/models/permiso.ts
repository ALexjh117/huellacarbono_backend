import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Rol from '#models/rol'

export default class Permiso extends BaseModel {
  static table = 'permiso'

  @column({ isPrimary: true, columnName: 'id_permiso' })
  declare id: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime

  @manyToMany(() => Rol, {
    pivotTable: 'rol_permiso',
    localKey: 'id',
    pivotForeignKey: 'id_permiso',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'id_rol',
  })
  declare roles: ManyToMany<typeof Rol>
}
