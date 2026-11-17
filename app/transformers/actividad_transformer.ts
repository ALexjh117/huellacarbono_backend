import type Actividad from '#models/actividad'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ActividadTransformer extends BaseTransformer<Actividad> {
  toObject() {
    return {
      id: this.resource.id,
      procesoId: this.resource.procesoId,
      nombre: this.resource.nombre,
      descripcion: this.resource.descripcion,
      active: this.resource.estado,
      createdAt: this.resource.fechaCreacion?.toISO() ?? null,
    }
  }
}
