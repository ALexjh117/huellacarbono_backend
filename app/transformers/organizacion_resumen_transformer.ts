import { BaseTransformer } from '@adonisjs/core/transformers'
import type Organizacion from '#models/organizacion'

/** Versión corta de la organización, para mostrarla dentro de una sede. */
export default class OrganizacionResumenTransformer extends BaseTransformer<Organizacion> {
  toObject() {
    return this.pick(this.resource, ['id', 'nombre', 'nombreCorto'])
  }
}