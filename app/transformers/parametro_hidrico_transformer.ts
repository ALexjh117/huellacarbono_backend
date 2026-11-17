import type ParametroHidrico from '#models/parametro_hidrico'
import { decimalTexto, fechaTexto } from '#services/catalogo_reglas'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ParametroHidricoTransformer extends BaseTransformer<ParametroHidrico> {
  toObject() {
    const version = this.resource.version
    const metodologia = version?.metodologia
    const unidad = this.resource.unidad

    return {
      id: this.resource.id,
      versionId: this.resource.versionId,
      metodologiaId: version?.metodologiaId ?? null,
      metodologiaNombre: metodologia?.nombre ?? null,
      numeroVersion: version?.numeroVersion ?? null,
      unidadId: this.resource.unidadId,
      unidadSimbolo: unidad?.simbolo ?? null,
      codigo: this.resource.codigo,
      nombre: this.resource.nombre,
      valor: decimalTexto(this.resource.valor),
      fuente: this.resource.fuente,
      fechaInicioVigencia: fechaTexto(this.resource.fechaInicioVigencia),
      fechaFinVigencia: fechaTexto(this.resource.fechaFinVigencia),
      active: this.resource.estado,
    }
  }
}
