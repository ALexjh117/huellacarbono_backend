import type Departamento from '#models/departamento'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class DepartamentoTransformer extends BaseTransformer<Departamento> {
  toObject() {
    return {
      id: this.resource.id,
      codigo: this.resource.codigo,
      nombre: this.resource.nombre,
      active: this.resource.estado,
    }
  }
}
