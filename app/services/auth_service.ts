import Usuario from '#models/usuario'
import UsuarioService from '#services/usuario_service'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'

export default class AuthService {
  async login(email: string, password: string) {
    const user = await Usuario.verifyCredentials(email, password)

    if (!user.estado) {
      throw new Exception('La cuenta está inactiva', {
        status: 403,
        code: 'E_ACCOUNT_INACTIVE',
      })
    }

    user.fechaUltimoAcceso = DateTime.now()
    await user.save()

    const token = await Usuario.accessTokens.create(user)
    const full = await new UsuarioService().show(user.id)

    return {
      user: full,
      token: token.value!.release(),
    }
  }
}
