import RolService from '#services/rol_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class PermissionsController {
  async index({ serialize }: HttpContext) {
    return serialize({ permissions: await new RolService().catalog() })
  }
}
