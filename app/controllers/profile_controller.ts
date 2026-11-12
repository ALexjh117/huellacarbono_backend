import UsuarioService from '#services/usuario_service'
import UserTransformer from '#transformers/user_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async show({ auth, serialize }: HttpContext) {
    const user = await new UsuarioService().show(auth.getUserOrFail().id)
    return serialize(UserTransformer.transform(user))
  }
}
