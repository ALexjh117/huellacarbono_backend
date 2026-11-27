import type Regional from '#models/regional'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class RegionalTransformer extends BaseTransformer<Regional> {
  toObject() {
    return {
      id: this.resource.id,
      codigo: this.resource.codigo,
      nombre: this.resource.nombre,
      active: this.resource.estado,
    }
  }
}
