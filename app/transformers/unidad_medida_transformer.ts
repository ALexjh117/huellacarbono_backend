import type UnidadMedida from '#models/unidad_medida'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UnidadMedidaTransformer extends BaseTransformer<UnidadMedida> {
  toObject() {
    return {
      id: this.resource.id,
      code: this.resource.codigo,
      name: this.resource.nombre,
      symbol: this.resource.simbolo,
      magnitude: this.resource.magnitud,
      baseFactor: this.resource.factorBase,
      active: this.resource.estado,
    }
  }
}
