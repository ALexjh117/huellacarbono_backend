import type DatoActividadCarbono from '#models/dato_actividad_carbono'
import { decimalTexto, fechaTexto } from '#services/catalogo_reglas'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class DatoActividadCarbonoTransformer extends BaseTransformer<DatoActividadCarbono> {
  toObject() {
    const actividad = this.resource.actividad
    const proceso = actividad?.proceso
    const alcance = this.resource.alcance
    const fuente = this.resource.fuenteEmision
    const unidad = this.resource.unidad

    return {
      id: this.resource.id,
      actividadId: this.resource.actividadId,
      actividadNombre: actividad?.nombre ?? null,
      procesoNombre: proceso?.nombre ?? null,
      periodoId: this.resource.periodoId,
      periodoNombre: this.resource.periodo?.nombre ?? null,
      fuenteEmisionId: this.resource.fuenteEmisionId,
      fuenteNombre: fuente?.nombre ?? null,
      alcanceId: this.resource.alcanceId,
      alcanceCodigo: alcance?.codigo ?? null,
      alcanceNombre: alcance?.nombre ?? null,
      unidadId: this.resource.unidadId,
      unidadSimbolo: unidad?.simbolo ?? null,
      cantidad: decimalTexto(this.resource.cantidad),
      fechaDato: fechaTexto(this.resource.fechaDato),
      fuenteDato: this.resource.fuenteDato,
      observacion: this.resource.observacion,
      estadoRegistro: this.resource.estadoRegistro,
    }
  }
}
