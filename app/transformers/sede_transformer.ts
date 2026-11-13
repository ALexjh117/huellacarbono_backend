import { BaseTransformer } from '@adonisjs/core/transformers'
import type Sede from '#models/sede'
import OrganizacionResumenTransformer from '#transformers/organizacion_resumen_transformer'

export default class SedeTransformer extends BaseTransformer<Sede> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'organizacionId',
        'nombre',
        'codigo',
        'direccion',
        'telefono',
        'correo',
        'responsableNombre',
        'responsableCargo',
        'responsableCorreo',
        'responsableTelefono',
        'estado',
        'fechaCreacion',
      ]),
      organizacion: OrganizacionResumenTransformer.transform(
        this.whenLoaded(this.resource.organizacion)
      ),
    }
  }
}