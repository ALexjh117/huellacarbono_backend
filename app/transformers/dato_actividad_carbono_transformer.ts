import type DatoActividadCarbono from '#models/dato_actividad_carbono'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * DECIMAL(24, 8) llega desde PostgreSQL como «100.00000000». Se recortan
 * sólo los ceros finales para devolver la cantidad tal como se escribió
 * («100», «4000.5») sin convertirla a Number, que perdería precisión.
 */
function decimalOriginal(valor: string): string {
  if (!valor.includes('.')) {
    return valor
  }
  return valor.replace(/0+$/, '').replace(/\.$/, '')
}

/**
 * Contrato en inglés del módulo de datos de actividad. La BD guarda
 * nombres en español y el transformer los traduce (mismo criterio que el
 * resto de la plataforma). No incluye factor ni resultado CO2e: el módulo
 * no calcula emisiones.
 */
export default class DatoActividadCarbonoTransformer extends BaseTransformer<DatoActividadCarbono> {
  toObject() {
    const registro = this.resource

    return {
      id: registro.id,
      projectId: registro.periodo?.idOrganizacion ?? null,
      activityId: registro.actividad?.id ?? registro.idActividad,
      activityName: registro.actividad?.nombre ?? '',
      processName: registro.actividad?.proceso?.nombre ?? null,
      periodId: registro.periodo?.id ?? registro.idPeriodo,
      periodName: registro.periodo?.nombre ?? '',
      emissionSourceId: registro.fuenteEmision?.id ?? registro.idFuenteEmision,
      emissionSourceName: registro.fuenteEmision?.nombre ?? '',
      scopeId: registro.alcance?.id ?? registro.idAlcance,
      scopeCode: registro.alcance?.codigo ?? '',
      scopeName: registro.alcance?.nombre ?? '',
      unitId: registro.unidadMedida?.id ?? registro.idUnidad,
      unitSymbol: registro.unidadMedida?.simbolo ?? '',
      unitName: registro.unidadMedida?.nombre ?? '',
      /** Cantidad original del documento, sin factor ni CO2e. */
      quantity: decimalOriginal(registro.cantidad),
      whatToCopy: registro.queSeCopia ?? '',
      document: registro.fuenteDato ?? '',
      status: registro.estadoRegistro,
      dataDate: registro.fechaDato?.toISODate() ?? null,
      registeredBy: registro.usuario
        ? { id: registro.usuario.id, name: registro.usuario.fullName }
        : null,
      createdAt: registro.fechaRegistro?.toISO() ?? null,
      updatedAt: registro.fechaActualizacion?.toISO() ?? null,
    }
  }
}
