import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AccountMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail()

    if (!user.estado) {
      throw new Exception('La cuenta está inactiva', {
        status: 403,
        code: 'E_ACCOUNT_INACTIVE',
      })
    }

    return next()
  }
}
