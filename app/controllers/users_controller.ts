import UsuarioService from '#services/usuario_service'
import UserTransformer from '#transformers/user_transformer'
import {
  createUserValidator,
  listQueryValidator,
  syncRolesValidator,
  updateUserValidator,
} from '#validators/usuario'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

function resourceId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) {
    throw new Exception('El usuario no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  return id
}

function listQuery(request: HttpContext['request']) {
  const page = request.input('page')
  const perPage = request.input('perPage')
  const includeInactive = request.input('includeInactive')

  return {
    page: page === undefined || page === '' ? undefined : Number(page),
    perPage: perPage === undefined || perPage === '' ? undefined : Number(perPage),
    includeInactive:
      includeInactive === undefined || includeInactive === ''
        ? undefined
        : includeInactive === true || includeInactive === 'true'
          ? true
          : includeInactive === false || includeInactive === 'false'
            ? false
            : includeInactive,
  }
}

export default class UsersController {
  async options({ serialize }: HttpContext) {
    return serialize({ roles: await new UsuarioService().options() })
  }

  async index({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(listQueryValidator, { data: listQuery(request) })
    const users = await new UsuarioService().list({
      page: query.page ?? 1,
      perPage: query.perPage ?? 20,
      includeInactive: query.includeInactive ?? false,
    })

    return serialize(UserTransformer.paginate(users.all(), users.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    const user = await new UsuarioService().show(resourceId(params.id))
    return serialize(UserTransformer.transform(user))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createUserValidator)
    const user = await new UsuarioService().create({
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      email: payload.email,
      password: payload.password,
      roleIds: payload.roleIds,
    })

    return serialize(UserTransformer.transform(user))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateUserValidator)

    if (payload.password !== undefined && payload.password !== payload.passwordConfirmation) {
      throw new Exception('La confirmación de la contraseña no coincide', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }

    const user = await new UsuarioService().update(
      resourceId(params.id),
      {
        nombres: payload.nombres,
        apellidos: payload.apellidos,
        email: payload.email,
        password: payload.password,
        active: payload.active,
      },
      auth.getUserOrFail().id
    )

    return serialize(UserTransformer.transform(user))
  }

  async syncRoles({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(syncRolesValidator)
    const user = await new UsuarioService().syncRoles(resourceId(params.id), payload.roleIds)
    return serialize(UserTransformer.transform(user))
  }
}
