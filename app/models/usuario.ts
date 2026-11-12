import hash from '@adonisjs/core/services/hash'
import { BaseModel, column, computed, manyToMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Rol from '#models/rol'

const AuthFinder = withAuthFinder(hash, {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class Usuario extends AuthFinder(BaseModel) {
  static table = 'usuario'
  static accessTokens = DbAccessTokensProvider.forModel(Usuario)

  declare currentAccessToken?: AccessToken

  @column({ isPrimary: true, columnName: 'id_usuario' })
  declare id: number

  @column()
  declare nombres: string

  @column()
  declare apellidos: string

  @column({ columnName: 'correo' })
  declare email: string

  @column({ columnName: 'password_hash', serializeAs: null })
  declare password: string

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime | null

  @column.dateTime({ columnName: 'fecha_actualizacion' })
  declare fechaActualizacion: DateTime | null

  @column.dateTime({ columnName: 'fecha_ultimo_acceso' })
  declare fechaUltimoAcceso: DateTime | null

  @manyToMany(() => Rol, {
    pivotTable: 'usuario_rol',
    localKey: 'id',
    pivotForeignKey: 'id_usuario',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'id_rol',
  })
  declare roles: ManyToMany<typeof Rol>

  @computed()
  get fullName() {
    return `${this.nombres} ${this.apellidos}`.trim()
  }

  @computed()
  get initials() {
    const [first, last] = this.fullName.split(' ')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return first.slice(0, 2).toUpperCase()
  }
}
