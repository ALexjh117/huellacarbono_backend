import type ComponenteHidrico from '#models/componente_hidrico'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ComponenteHidricoTransformer extends BaseTransformer<ComponenteHidrico> {
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
