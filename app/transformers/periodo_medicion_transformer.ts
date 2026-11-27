import { fechaTexto } from '#services/catalogo_reglas'
import type PeriodoMedicion from '#models/periodo_medicion'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class PeriodoMedicionTransformer extends BaseTransformer<PeriodoMedicion> {
  toObject() {
    return {
      id: this.resource.id,
      organizacionId: this.resource.organizacionId,
      nombre: this.resource.nombre,
      fechaInicio: fechaTexto(this.resource.fechaInicio),
      fechaFin: fechaTexto(this.resource.fechaFin),
      estado: this.resource.estado,
      createdAt: this.resource.fechaCreacion?.toISO() ?? null,
    }
  }
}
