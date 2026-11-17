import type AlcanceEmision from '#models/alcance_emision'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class AlcanceEmisionTransformer extends BaseTransformer<AlcanceEmision> {
  toObject() {
    return {
      id: this.resource.id,
      codigo: this.resource.codigo,
      nombre: this.resource.nombre,
      descripcion: this.resource.descripcion,
      active: this.resource.estado,
    }
  }
}
