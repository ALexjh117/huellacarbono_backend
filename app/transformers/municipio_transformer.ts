import type Municipio from '#models/municipio'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class MunicipioTransformer extends BaseTransformer<Municipio> {
  toObject() {
    const departamento = this.resource.departamento

    return {
      id: this.resource.id,
      codigo: this.resource.codigo,
      nombre: this.resource.nombre,
      active: this.resource.estado,
      departamentoId: this.resource.departamentoId,
      departamento: departamento
        ? {
            id: departamento.id,
            codigo: departamento.codigo,
            nombre: departamento.nombre,
          }
        : null,
    }
  }
}
