import { codigosDelRol, isSystemRole } from '#data/permission_catalog'
import type Rol from '#models/rol'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class RolTransformer extends BaseTransformer<Rol> {
  toObject() {
    return {
      id: this.resource.id,
      name: this.resource.nombre,
      description: this.resource.descripcion ?? '',
      active: this.resource.estado,
      system: isSystemRole(this.resource.nombre),
      permissions: codigosDelRol(this.resource.permisos),
    }
  }
}
