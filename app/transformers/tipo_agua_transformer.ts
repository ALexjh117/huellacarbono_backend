import type TipoAgua from '#models/tipo_agua'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class TipoAguaTransformer extends BaseTransformer<TipoAgua> {
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
