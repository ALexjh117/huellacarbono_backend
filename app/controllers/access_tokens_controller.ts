import AuthService from '#services/auth_service'
import UserTransformer from '#transformers/user_transformer'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import Usuario from '#models/usuario'
import env from '#start/env'

// 1. Definimos la interfaz para la respuesta de Google
interface GoogleRecaptchaResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  'error-codes'?: string[]
}

export default class AccessTokensController {
  // 2. Agregamos "response" a la destructuración
  async store({ request, serialize, response }: HttpContext) {
    
    const { email, password } = await request.validateUsing(loginValidator)
    const recaptchaToken = request.input('recaptchaToken')

    if (recaptchaToken) {
      const secretKey = env.get('RECAPTCHA_SECRET_KEY')
      
      try {
        const params = new URLSearchParams()
        params.append('secret', secretKey)
        params.append('response', recaptchaToken)

        const googleResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        })

        // 3. Casteamos la respuesta con nuestra interfaz
        const googleData = (await googleResponse.json()) as GoogleRecaptchaResponse

        if (!googleData.success) {
          return response.badRequest({
            success: false,
            message: 'Verificación de seguridad fallida. Por favor, intenta de nuevo.',
            errors: googleData['error-codes'],
          })
        }
      } catch (error) {
        return response.internalServerError({
          success: false,
          message: 'Error al conectar con el servicio de seguridad.',
        })
      }
    } else {
      // Si quieres que el captcha sea obligatorio, descomenta esto:
      /*
      return response.badRequest({
        success: false,
        message: 'El token de seguridad es requerido.',
      })
      */
    }

    // Lógica normal de Login
    const result = await new AuthService().login(email, password)

    return serialize({
      user: UserTransformer.transform(result.user),
      token: result.token,
    })
  }

  async destroy({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await Usuario.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return { message: 'Logged out successfully' }
  }
}