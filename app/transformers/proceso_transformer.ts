import type Proceso from '#models/proceso'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ProcesoTransformer extends BaseTransformer<Proceso> {
  toObject() {
    return {
      id: this.resource.id,
      sedeId: this.resource.sedeId,
      nombre: this.resource.nombre,
      descripcion: this.resource.descripcion,
      active: this.resource.estado,
      actividadesActivas: Number(this.resource.$extras.actividades_count ?? 0),
      createdAt: this.resource.fechaCreacion?.toISO() ?? null,
    }
  }
}
