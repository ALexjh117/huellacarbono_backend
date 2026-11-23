import type MetodologiaVersion from '#models/metodologia_version'
import { fechaTexto } from '#services/catalogo_reglas'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class MetodologiaVersionTransformer extends BaseTransformer<MetodologiaVersion> {
  toObject() {
    return {
      id: this.resource.id,
      metodologiaId: this.resource.metodologiaId,
      numeroVersion: this.resource.numeroVersion,
      descripcion: this.resource.descripcion,
      referenciaDocumental: this.resource.referenciaDocumental,
      fechaInicioVigencia: fechaTexto(this.resource.fechaInicioVigencia),
      fechaFinVigencia: fechaTexto(this.resource.fechaFinVigencia),
      active: this.resource.estado,
      gwpSetId: this.resource.gwpSetId,
      gwpSetCodigo: this.resource.gwpSet?.codigo ?? null,
      gwpSetEstandarVersion: this.resource.gwpSet?.estandarVersion ?? null,
      createdAt: this.resource.fechaCreacion?.toISO() ?? null,
    }
  }
}
