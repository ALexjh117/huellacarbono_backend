import type CentroFormacion from '#models/centro_formacion'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class CentroFormacionTransformer extends BaseTransformer<CentroFormacion> {
  toObject() {
    const regional = this.resource.regional

    return {
      id: this.resource.id,
      codigo: this.resource.codigo,
      nombre: this.resource.nombre,
      active: this.resource.estado,
      regional: regional
        ? {
            id: regional.id,
            codigo: regional.codigo,
            nombre: regional.nombre,
          }
        : null,
    }
  }
}
