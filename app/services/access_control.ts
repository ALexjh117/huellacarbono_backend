import { codigosDelRol, type PermissionCode } from '#data/permission_catalog'
import Usuario from '#models/usuario'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'

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

/**
 * Returns the organizations reachable through a user's assigned sites.
 * Active administrators retain the existing global-administration behavior.
 * A null result means global scope; an empty array means no organization access.
 */
export async function obtenerOrganizacionesAutorizadas(userId: number): Promise<number[] | null> {
  const user = await Usuario.query()
    .where('id', userId)
    .preload('roles', (roles) => roles.where('estado', true))
    .first()

  if (!user) {
    throw new Exception('No autenticado', { status: 401, code: 'E_UNAUTHORIZED' })
  }

  if (user.roles.some((role) => role.nombre === 'ADMINISTRADOR')) return null

  const rows = await db
    .from('usuario_sede as usuario_sede')
    .join('sede', 'sede.id_sede', 'usuario_sede.id_sede')
    .where('usuario_sede.id_usuario', userId)
    .distinct('sede.id_organizacion')
    .select('sede.id_organizacion')

  return rows.map((row) => Number(row.id_organizacion))
}

export async function exigirAccesoOrganizacion(userId: number, organizacionId: number) {
  const organizaciones = await obtenerOrganizacionesAutorizadas(userId)
  if (organizaciones !== null && !organizaciones.includes(Number(organizacionId))) {
    // Do not disclose whether an inaccessible organization exists.
    throw new Exception('El recurso no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
}

async function exigirAccesoPorConsulta(
  userId: number,
  query: PromiseLike<{ id_organizacion: number | string } | undefined>
) {
  const fila = await query
  if (!fila) throw new Exception('El recurso no existe', { status: 404, code: 'E_NOT_FOUND' })
  await exigirAccesoOrganizacion(userId, Number(fila.id_organizacion))
}

export function exigirAccesoSede(userId: number, sedeId: number) {
  return exigirAccesoPorConsulta(
    userId,
    db.from('sede').select('id_organizacion').where('id_sede', sedeId).first()
  )
}

export function exigirAccesoProceso(userId: number, procesoId: number) {
  return exigirAccesoPorConsulta(
    userId,
    db
      .from('proceso')
      .join('sede', 'sede.id_sede', 'proceso.id_sede')
      .select('sede.id_organizacion')
      .where('proceso.id_proceso', procesoId)
      .first()
  )
}

export function exigirAccesoActividad(userId: number, actividadId: number) {
  return exigirAccesoPorConsulta(
    userId,
    db
      .from('actividad')
      .join('proceso', 'proceso.id_proceso', 'actividad.id_proceso')
      .join('sede', 'sede.id_sede', 'proceso.id_sede')
      .select('sede.id_organizacion')
      .where('actividad.id_actividad', actividadId)
      .first()
  )
}
