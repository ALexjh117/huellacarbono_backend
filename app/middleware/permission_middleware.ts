import type { PermissionCode } from '#data/permission_catalog'
import { assertCan } from '#services/access_control'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class PermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, code: PermissionCode) {
    await assertCan(ctx.auth.getUserOrFail().id, code)
    return next()
  }
}
