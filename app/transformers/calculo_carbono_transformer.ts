import type CalculoCarbono from '#models/calculo_carbono'
import { decimalTexto, fechaTexto } from '#services/catalogo_reglas'
import {
  agruparResultadosPorNombre,
  agruparResultadosPorGas,
  intensidadDesde,
  toneladasDesdeKg,
} from '#services/calculo_carbono_service'
import { etiquetaUnidadCo2e } from '#services/emissions/unidad_resultado'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { normalizarEspecieGas } from '#services/emissions/gas_validation'

export default class CalculoCarbonoTransformer extends BaseTransformer<CalculoCarbono> {
  toObject() {
    const version = this.resource.version
    const metodologia = version?.metodologia
    const unidad = this.resource.unidadResultado
    const resultados = this.resource.resultados ?? []
    const total = this.resource.totalCo2e ?? '0'
    const porAlcance = agruparResultadosPorNombre(
      resultados.map((resultado) => ({
        nombre: resultado.alcance?.nombre ?? 'Sin alcance',
        valorCo2e: resultado.valorCo2e,
      })),
      total
    )
    const porFuente = agruparResultadosPorNombre(
      resultados.map((resultado) => ({
        nombre: resultado.fuenteEmision?.nombre ?? 'Sin fuente',
        valorCo2e: resultado.valorCo2e,
      })),
      total
    )
    const porActividad = agruparResultadosPorNombre(
      resultados.map((resultado) => ({
        nombre:
          [resultado.actividadEmision?.codigo, resultado.actividadEmision?.nombre]
            .filter(Boolean)
            .join(' ') || 'Sin actividad de emisión',
        valorCo2e: resultado.valorCo2e,
      })),
      total
    )
    const porSubcategoria = agruparResultadosPorNombre(
      resultados.map((resultado) => ({
        nombre:
          [resultado.subcategoriaEmision?.codigo, resultado.subcategoriaEmision?.nombre]
            .filter(Boolean)
            .join(' ') || 'Sin subcategoría',
        valorCo2e: resultado.valorCo2e,
      })),
      total
    )

    return {
      id: this.resource.id,
      organizacionId: this.resource.organizacionId,
      organizacionNombre: this.resource.organizacion?.nombre ?? null,
      periodoId: this.resource.periodoId,
      periodoNombre: this.resource.periodo?.nombre ?? null,
      versionId: this.resource.versionId,
      numeroVersion: version?.numeroVersion ?? null,
      versionMotor: this.resource.versionMotor,
      baseGases: this.resource.baseGases,
      gwpSetId: this.resource.gwpSetId,
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
      unidadResultado: etiquetaUnidadCo2e(unidad?.simbolo),
      porAlcance,
      porFuente,
      porActividad,
      porSubcategoria,
      porGas: agruparResultadosPorGas(resultados, total),
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
        actividadEmisionId: resultado.actividadEmisionId,
        actividadEmisionCodigo: resultado.actividadEmision?.codigo ?? null,
        actividadEmisionNombre: resultado.actividadEmision?.nombre ?? null,
        subcategoriaEmisionId: resultado.subcategoriaEmisionId,
        subcategoriaEmisionCodigo: resultado.subcategoriaEmision?.codigo ?? null,
        subcategoriaEmisionNombre: resultado.subcategoriaEmision?.nombre ?? null,
        valorCo2e: decimalTexto(resultado.valorCo2e),
        unidad: resultado.unidad?.simbolo ?? null,
        datoActividadId: resultado.datoCarbonoId,
        factorId: resultado.factorEmisionId,
        reglaCalculoId: resultado.reglaCalculoId,
        factorCodigo: resultado.factorCodigo,
        factorFuente: resultado.factorFuente,
        factorAnioAplicacion: resultado.factorAnioAplicacion,
        factorAnioPublicacion: resultado.factorAnioPublicacion,
        factorInstitucionResponsable: resultado.factorInstitucionResponsable,
        factorOrigen: resultado.factorOrigen,
        factorValor: resultado.valorFactor,
        factorVersion: resultado.factorVersion,
        cantidadOriginal: resultado.cantidadOriginal,
        unidadOriginalId: resultado.unidadOriginalId,
        cantidadConvertida: resultado.cantidadConvertida,
        unidadFactorId: resultado.unidadUtilizadaId,
        densidadValor: resultado.densidadValor,
        unidadDensidadId: resultado.unidadDensidadId,
        poderCalorificoValor: resultado.poderCalorificoValor,
        unidadPoderCalorificoId: resultado.unidadPoderCalorificoId,
        fechaCalculo: resultado.fechaCalculo?.toISO() ?? null,
        metodologia: resultado.metodologia,
        gwpValueId: resultado.gwpValueId,
        gwpGasCodigo: resultado.gwp?.gasCodigo ?? null,
        gasCalculado: resultado.gasCalculado,
        gasEspecifico: normalizarEspecieGas(resultado.gasEspecifico),
        cantidadEmision: resultado.cantidadEmision,
        unidadEmisionId: resultado.unidadEmisionId,
        valorGwp: resultado.valorGwp,
        gwpHorizonteAnios: resultado.gwpHorizonteAnios,
        gwpVersion: resultado.gwpVersion,
        gwpSetCodigo: resultado.gwp?.set?.codigo ?? null,
        gwpFuenteCientifica: resultado.gwp?.set?.fuenteCientifica ?? null,
        gwpReferencia: resultado.gwp?.set?.referencia ?? null,
        versionMotor: resultado.versionMotor,
      })),
      omitidos: this.resource.omitidos,
    }
  }
}
