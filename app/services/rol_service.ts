import { PERMISSIONS, isSystemRole } from '#data/permission_catalog'
import Permiso from '#models/permiso'
import Rol from '#models/rol'
import { rethrowDatabaseError } from '#services/database_error'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

type CreateRolePayload = {
  name: string
  description?: string
}

type UpdateRolePayload = {
  name?: string
  description?: string
  active?: boolean
}

export default class RolService {
  async list(includeInactive: boolean) {
    const query = Rol.query().preload('permisos').orderBy('nombre', 'asc')
    if (!includeInactive) {
      query.where('estado', true)
    }
    return query
  }

  async show(id: number) {
    const role = await Rol.query().where('id', id).preload('permisos').first()
    if (!role) {
      throw new Exception('El rol no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return role
  }

  async catalog() {
    const permisos = await Permiso.query().orderBy('codigo', 'asc').preload('roles')
    return permisos.map((permiso) => ({
      code: permiso.codigo,
      name: permiso.nombre,
      roles: permiso.roles
        .filter((rol) => rol.estado)
        .map((rol) => rol.nombre)
        .sort(),
    }))
  }

  async create(payload: CreateRolePayload) {
    const nombre = payload.name.trim()
    const existing = await Rol.query().where('nombre', nombre).first()
    if (existing) {
      throw new Exception('Ya existe un rol con ese nombre', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }

    try {
      const role = await Rol.create({
        nombre,
        descripcion: this.description(payload.description),
        estado: true,
      })
      return await this.show(role.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el rol')
    }
  }

  async update(id: number, payload: UpdateRolePayload) {
    const role = await this.show(id)

    if (payload.active === false && !role.estado) {
      throw new Exception('El rol ya está inactivo', { status: 409, code: 'E_CONFLICT' })
    }

    if (isSystemRole(role.nombre)) {
      if (payload.name !== undefined && payload.name.trim() !== role.nombre) {
        throw new Exception('No se puede renombrar un rol del sistema', {
          status: 422,
          code: 'E_VALIDATION_ERROR',
        })
      }
      if (payload.active === false) {
        throw new Exception('No se puede desactivar un rol del sistema', {
          status: 422,
          code: 'E_VALIDATION_ERROR',
        })
      }
    }

    if (payload.name !== undefined && payload.name.trim() !== role.nombre) {
      const nombre = payload.name.trim()
      const existing = await Rol.query().where('nombre', nombre).whereNot('id', id).first()
      if (existing) {
        throw new Exception('Ya existe un rol con ese nombre', {
          status: 409,
          code: 'E_DUPLICATE',
        })
      }
      role.nombre = nombre
    }

    if (payload.description !== undefined) {
      role.descripcion = this.description(payload.description)
    }

    if (payload.active !== undefined) {
      role.estado = payload.active
    }

    try {
      await role.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el rol')
    }

    return this.show(role.id)
  }

  async syncPermissions(id: number, codes: string[]) {
    const role = await this.show(id)
    const unique = [...new Set(codes)]

    try {
      await db.transaction(async (trx) => {
        const found =
          unique.length === 0
            ? []
            : await Permiso.query({ client: trx }).whereIn('codigo', unique)
        if (found.length !== unique.length) {
          throw new Exception('Hay un permiso que no existe', {
            status: 422,
            code: 'E_VALIDATION_ERROR',
          })
        }

        role.useTransaction(trx)
        await role.related('permisos').sync(found.map((permiso) => permiso.id))

        if (!(await this.quedaUnAdministrador(trx))) {
          throw new Exception(
            'Debe quedar un usuario activo que pueda administrar usuarios y roles',
            { status: 409, code: 'E_CONFLICT' }
          )
        }
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudieron guardar los permisos')
    }

    return this.show(id)
  }

  private async quedaUnAdministrador(trx: TransactionClientContract) {
    const codes = PERMISSIONS.map((permission) => permission.code)
    const placeholders = codes.map(() => '?').join(', ')
    const result = await trx.rawQuery(
      `
      SELECT u.id_usuario
      FROM usuario u
      INNER JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
      INNER JOIN rol r ON r.id_rol = ur.id_rol AND r.estado = TRUE
      INNER JOIN rol_permiso rp ON rp.id_rol = r.id_rol
      INNER JOIN permiso p ON p.id_permiso = rp.id_permiso
      WHERE u.estado = TRUE AND p.codigo IN (${placeholders})
      GROUP BY u.id_usuario
      HAVING COUNT(DISTINCT p.codigo) = ?
      LIMIT 1
      `,
      [...codes, codes.length]
    )
    const rows = (result as { rows?: unknown[] }).rows ?? []
    return rows.length > 0
  }

  private description(value: string | undefined) {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
  }
}
