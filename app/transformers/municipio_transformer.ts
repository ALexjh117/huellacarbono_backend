import type Municipio from '#models/municipio'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class MunicipioTransformer extends BaseTransformer<Municipio> {
  toObject() {
    const departamento = this.resource.departamento

    return {
      id: this.resource.id,
      name: this.resource.nombre,
      code: this.resource.codigo,
      active: this.resource.estado,
      department: departamento
        ? {
            id: departamento.id,
            name: departamento.nombre,
            code: departamento.codigo,
            active: departamento.estado,
          }
        : null,
    }
  }
}
