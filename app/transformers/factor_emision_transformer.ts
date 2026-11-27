import type FactorEmision from '#models/factor_emision'
import { decimalTexto, fechaTexto } from '#services/catalogo_reglas'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { normalizarEspecieGas } from '#services/emissions/gas_validation'

export default class FactorEmisionTransformer extends BaseTransformer<FactorEmision> {
  toObject() {
    const version = this.resource.version
    const metodologia = version?.metodologia
    const fuente = this.resource.fuenteEmision
    const entrada = this.resource.unidadEntrada
    const salida = this.resource.unidadSalida

    return {
      id: this.resource.id,
      versionId: this.resource.versionId,
      metodologiaId: version?.metodologiaId ?? null,
      metodologiaNombre: metodologia?.nombre ?? null,
      numeroVersion: version?.numeroVersion ?? null,
      fuenteEmisionId: this.resource.fuenteEmisionId,
      fuenteEmisionNombre: fuente?.nombre ?? null,
      unidadEntradaId: this.resource.unidadEntradaId,
      unidadEntradaSimbolo: entrada?.simbolo ?? null,
      unidadSalidaId: this.resource.unidadSalidaId,
      unidadSalidaSimbolo: salida?.simbolo ?? null,
      codigo: this.resource.codigo,
      nombre: this.resource.nombre,
      valor: decimalTexto(this.resource.valor),
      gas: this.resource.gas,
      gasEspecifico: normalizarEspecieGas(this.resource.gasEspecifico),
      variante: this.resource.variante,
      estadoAprobacion: this.resource.estadoAprobacion,
      fuente: this.resource.fuente,
      region: this.resource.region,
      institucionResponsable: this.resource.institucionResponsable,
      anioPublicacion: this.resource.anioPublicacion,
      anioAplicacion: this.resource.anioAplicacion,
      origen: this.resource.origen,
      importacionId: this.resource.importacionId,
      sectorCategoria: this.resource.sectorCategoria,
      fechaInicioVigencia: fechaTexto(this.resource.fechaInicioVigencia),
      fechaFinVigencia: fechaTexto(this.resource.fechaFinVigencia),
      active: this.resource.estado,
      createdAt: this.resource.fechaCreacion?.toISO() ?? null,
    }
  }
}
