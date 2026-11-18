import type FuenteEmision from '#models/fuente_emision'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class FuenteEmisionTransformer extends BaseTransformer<FuenteEmision> {
  toObject() {
    return {
      id: this.resource.id,
      codigo: this.resource.codigo,
      nombre: this.resource.nombre,
      categoria: this.resource.categoria,
      descripcion: this.resource.descripcion,
      active: this.resource.estado,
    }
  }
}
