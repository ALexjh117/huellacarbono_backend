import { BaseTransformer } from '@adonisjs/core/transformers'
import type Organizacion from '#models/organizacion'
import SedeTransformer from '#transformers/sede_transformer'

export default class OrganizacionTransformer extends BaseTransformer<Organizacion> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'nombre',
        'nombreCorto',
        'nit',
        'tipo',
        'sectorEconomico',
        'direccion',
        'municipioId',
        'correo',
        'telefono',
        'representanteNombre',
        'representanteTipoDocumento',
        'representanteNumeroDocumento',
        'representanteCorreo',
        'representanteTelefono',
        'estado',
        'fechaCreacion',
      ]),
      sedes: SedeTransformer.transform(this.whenLoaded(this.resource.sedes)),
    }
  }
}