import Rol from '#models/rol'
import Usuario from '#models/usuario'
import { rethrowDatabaseError } from '#services/database_error'
import { Exception } from '@adonisjs/core/exceptions'

type CreateUserPayload = {
  nombres: string
  apellidos: string
  email: string
  password: string
  roleIds: number[]
}

type UpdateUserPayload = {
  nombres?: string
  apellidos?: string
  email?: string
  password?: string
  active?: boolean
}

type ListUsersQuery = {
  page: number
  perPage: number
  includeInactive: boolean
}

const ADMIN_ROLE = 'ADMINISTRADOR'

export default class UsuarioService {
  async list(query: ListUsersQuery) {
    const users = Usuario.query()
      .preload('roles', (roles) => {
        roles.orderBy('nombre', 'asc').preload('permisos')
      })
      .orderBy('id_usuario', 'asc')

    if (!query.includeInactive) {
      users.where('estado', true)
    }

    return users.paginate(query.page, query.perPage)
  }

  async show(id: number) {
    const user = await Usuario.query()
      .where('id', id)
      .preload('roles', (roles) => {
        roles.orderBy('nombre', 'asc').preload('permisos')
      })
      .first()

    if (!user) {
      throw new Exception('El usuario no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    return user
  }

  async options() {
    const roles = await Rol.query().where('estado', true).orderBy('nombre', 'asc')
    return roles.map((role) => ({
      id: role.id,
      name: role.nombre,
      description: role.descripcion ?? '',
    }))
  }

  async create(payload: CreateUserPayload) {
    const roleIds = await this.assertActiveRoles(payload.roleIds)

    try {
      const user = await Usuario.create({
        nombres: payload.nombres,
        apellidos: payload.apellidos,
        email: payload.email,
        password: payload.password,
        estado: true,
      })
      await user.related('roles').sync(roleIds)
      return await this.show(user.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el usuario')
    }
  }

  async update(id: number, payload: UpdateUserPayload, actorId: number) {
    const user = await Usuario.find(id)
    if (!user) {
      throw new Exception('El usuario no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    if (payload.active === false && !user.estado) {
      throw new Exception('El usuario ya está inactivo', { status: 409, code: 'E_CONFLICT' })
    }

    if (id === actorId && payload.active === false) {
      throw new Exception('No puedes desactivar tu propia cuenta', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }

    if (payload.active === false) {
      await this.assertKeepsAnAdmin(user, false, null)
    }

    if (payload.nombres !== undefined) {
      user.nombres = payload.nombres
    }
    if (payload.apellidos !== undefined) {
      user.apellidos = payload.apellidos
    }
    if (payload.email !== undefined) {
      user.email = payload.email
    }
    if (payload.password !== undefined) {
      user.password = payload.password
    }
    if (payload.active !== undefined) {
      user.estado = payload.active
    }

    try {
      await user.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el usuario')
    }

    return this.show(user.id)
  }

  async syncRoles(id: number, roleIds: number[]) {
    const user = await Usuario.query().where('id', id).preload('roles').first()
    if (!user) {
      throw new Exception('El usuario no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const uniqueIds = await this.assertActiveRoles(roleIds)
    await this.assertKeepsAnAdmin(user, user.estado, uniqueIds)

    try {
      await user.related('roles').sync(uniqueIds)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudieron asignar los roles')
    }

    return this.show(user.id)
  }

  private async assertActiveRoles(roleIds: number[]) {
    const uniqueIds = [...new Set(roleIds)]

    if (!uniqueIds.length) {
      return uniqueIds
    }

    const found = await Rol.query().whereIn('id', uniqueIds).where('estado', true)
    if (found.length !== uniqueIds.length) {
      throw new Exception('Hay un rol que no existe o está inactivo', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }

    return uniqueIds
  }

  private async assertKeepsAnAdmin(
    user: Usuario,
    nextActive: boolean,
    nextRoleIds: number[] | null
  ) {
    if (!user.roles) {
      await user.load('roles')
    }

    const adminRole = await Rol.findBy('nombre', ADMIN_ROLE)
    if (!adminRole) {
      return
    }

    const hasAdmin = user.roles.some((role) => role.id === adminRole.id)
    if (!user.estado || !hasAdmin) {
      return
    }

    const keepsAdmin = nextActive && (nextRoleIds === null || nextRoleIds.includes(adminRole.id))

    if (keepsAdmin) {
      return
    }

    const another = await Usuario.query()
      .where('estado', true)
      .whereNot('id', user.id)
      .whereHas('roles', (roles) => {
        roles.where('id', adminRole.id)
      })
      .first()

    if (!another) {
      throw new Exception('Debe quedar al menos un administrador activo', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }
  }
}
