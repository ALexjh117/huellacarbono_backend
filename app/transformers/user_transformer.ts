import { codigosDelRol } from '#data/permission_catalog'
import type Usuario from '#models/usuario'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<Usuario> {
  toObject() {
    const roles = this.resource.roles ?? []

    return {
      id: this.resource.id,
      nombres: this.resource.nombres,
      apellidos: this.resource.apellidos,
      fullName: this.resource.fullName,
      initials: this.resource.initials,
      email: this.resource.email,
      active: this.resource.estado,
      lastAccessAt: this.resource.fechaUltimoAcceso?.toISO() ?? null,
      createdAt: this.resource.fechaCreacion?.toISO() ?? null,
      roles: roles.map((role) => ({
        id: role.id,
        name: role.nombre,
        description: role.descripcion ?? '',
        active: role.estado,
      })),
      permissions: codigosDelRol(
        roles.filter((role) => role.estado).flatMap((role) => role.permisos ?? [])
      ),
    }
  }
}
