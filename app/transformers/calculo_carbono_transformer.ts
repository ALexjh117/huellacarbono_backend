import type CalculoCarbono from '#models/calculo_carbono'
import { decimalTexto, fechaTexto } from '#services/catalogo_reglas'
import { intensidadDesde, toneladasDesdeKg } from '#services/calculo_carbono_service'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class CalculoCarbonoTransformer extends BaseTransformer<CalculoCarbono> {
  toObject() {
    const version = this.resource.version
    const metodologia = version?.metodologia
    const unidad = this.resource.unidadResultado
    const resultados = this.resource.resultados ?? []

    return {
      id: this.resource.id,
      organizacionId: this.resource.organizacionId,
      organizacionNombre: this.resource.organizacion?.nombre ?? null,
      periodoId: this.resource.periodoId,
      periodoNombre: this.resource.periodo?.nombre ?? null,
      versionId: this.resource.versionId,
      numeroVersion: version?.numeroVersion ?? null,
      metodologiaNombre: metodologia?.nombre ?? null,
      estado: this.resource.estado,
      totalCo2e: this.resource.totalCo2e ? decimalTexto(this.resource.totalCo2e) : null,
      toneladasCo2e: this.resource.totalCo2e
        ? decimalTexto(toneladasDesdeKg(this.resource.totalCo2e))
        : null,
      unidadesProducidas: this.resource.unidadesProducidas
        ? decimalTexto(this.resource.unidadesProducidas)
        : null,
      unidadFuncional: this.resource.unidadFuncional,
      intensidadCo2e:
        this.resource.totalCo2e && this.resource.unidadesProducidas
          ? decimalTexto(intensidadDesde(this.resource.totalCo2e, this.resource.unidadesProducidas))
          : null,
      unidadResultado: unidad?.simbolo ?? null,
      observacion: this.resource.observacion,
      fechaCalculo: this.resource.fechaCalculo?.toISO() ?? null,
      periodo: this.resource.periodo
        ? {
            fechaInicio: fechaTexto(this.resource.periodo.fechaInicio),
            fechaFin: fechaTexto(this.resource.periodo.fechaFin),
          }
        : null,
      lineas: resultados.map((resultado) => ({
        id: resultado.id,
        actividadId: resultado.actividadId,
        actividadNombre: resultado.actividad?.nombre ?? null,
        procesoNombre: resultado.actividad?.proceso?.nombre ?? null,
        alcanceCodigo: resultado.alcance?.codigo ?? null,
        alcanceNombre: resultado.alcance?.nombre ?? null,
        fuenteNombre: resultado.fuenteEmision?.nombre ?? null,
        valorCo2e: decimalTexto(resultado.valorCo2e),
        unidad: resultado.unidad?.simbolo ?? null,
      })),
      omitidos: this.resource.omitidos,
    }
  }
}
