import type Metodologia from '#models/metodologia'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class MetodologiaTransformer extends BaseTransformer<Metodologia> {
  toObject() {
    return {
      id: this.resource.id,
      codigo: this.resource.codigo,
      nombre: this.resource.nombre,
      tipo: this.resource.tipo,
      descripcion: this.resource.descripcion,
      entidadFuente: this.resource.entidadFuente,
      active: this.resource.estado,
      createdAt: this.resource.fechaCreacion?.toISO() ?? null,
      versionesActivas: Number(this.resource.$extras.versiones_count ?? 0),
    }
  }
}
