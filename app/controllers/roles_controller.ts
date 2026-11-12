import RolService from '#services/rol_service'
import RolTransformer from '#transformers/rol_transformer'
import { listQueryValidator } from '#validators/usuario'
import {
  createRoleValidator,
  syncRolePermissionsValidator,
  updateRoleValidator,
} from '#validators/rol'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

function resourceId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) {
    throw new Exception('El rol no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  return id
}

function includeInactive(request: HttpContext['request']) {
  const value = request.input('includeInactive')
  return {
    includeInactive:
      value === undefined || value === ''
        ? undefined
        : value === true || value === 'true'
          ? true
          : value === false || value === 'false'
            ? false
            : value,
  }
}

export default class RolesController {
  async index({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(listQueryValidator, {
      data: includeInactive(request),
    })
    const roles = await new RolService().list(query.includeInactive ?? false)
    return serialize(RolTransformer.transform(roles))
  }

  async show({ params, serialize }: HttpContext) {
    const role = await new RolService().show(resourceId(params.id))
    return serialize(RolTransformer.transform(role))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createRoleValidator)
    const role = await new RolService().create(payload)
    return serialize(RolTransformer.transform(role))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateRoleValidator)
    const role = await new RolService().update(resourceId(params.id), payload)
    return serialize(RolTransformer.transform(role))
  }

  async syncPermissions({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(syncRolePermissionsValidator)
    const role = await new RolService().syncPermissions(resourceId(params.id), payload.codes)
    return serialize(RolTransformer.transform(role))
  }
}
