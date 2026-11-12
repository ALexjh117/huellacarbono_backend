import { codigosDelRol, type PermissionCode } from '#data/permission_catalog'
import Usuario from '#models/usuario'
import { Exception } from '@adonisjs/core/exceptions'

export async function assertCan(userId: number, code: PermissionCode) {
  const user = await Usuario.query()
    .where('id', userId)
    .preload('roles', (roles) => {
      roles.where('estado', true).preload('permisos')
    })
    .first()

  if (!user) {
    throw new Exception('No autenticado', { status: 401, code: 'E_UNAUTHORIZED' })
  }

  const codes = codigosDelRol(user.roles.flatMap((role) => role.permisos))

  if (!codes.includes(code)) {
    throw new Exception('No tienes permiso para realizar esta acción', {
      status: 403,
      code: 'E_FORBIDDEN',
    })
  }
}
