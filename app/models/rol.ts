import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Permiso from '#models/permiso'
import Usuario from '#models/usuario'

export default class Rol extends BaseModel {
  static table = 'rol'

  @column({ isPrimary: true, columnName: 'id_rol' })
  declare id: number

  @column()
  declare nombre: string

  @column()
  declare descripcion: string | null

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime

  @manyToMany(() => Usuario, {
    pivotTable: 'usuario_rol',
    localKey: 'id',
    pivotForeignKey: 'id_rol',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'id_usuario',
  })
  declare usuarios: ManyToMany<typeof Usuario>

  @manyToMany(() => Permiso, {
    pivotTable: 'rol_permiso',
    localKey: 'id',
    pivotForeignKey: 'id_rol',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'id_permiso',
  })
  declare permisos: ManyToMany<typeof Permiso>
}
