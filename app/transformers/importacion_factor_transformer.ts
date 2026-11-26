import type ImportacionFactor from '#models/importacion_factor'
import { BaseTransformer } from '@adonisjs/core/transformers'

/** Importación de factores; incluye las filas sólo si se cargaron sus detalles. */
export default class ImportacionFactorTransformer extends BaseTransformer<ImportacionFactor> {
  toObject() {
    const importacion = this.resource
    const detalles = importacion.$preloaded.detalles ? importacion.detalles : null
    return {
      id: importacion.id,
      usuarioId: importacion.usuarioId,
      origen: importacion.origen,
      referencia: importacion.referencia,
      archivo: importacion.archivo,
      hash: importacion.hash,
      estado: importacion.estado,
      versionId: importacion.resumen?.versionId ?? null,
      totalFilas: importacion.totalFilas,
      porInsertar: importacion.resumen?.porInsertar ?? null,
      insertados: importacion.insertados,
      duplicados: importacion.duplicados,
      rechazados: importacion.rechazados,
      fechaCreacion: importacion.fechaCreacion?.toISO() ?? null,
      fechaAplicacion: importacion.fechaAplicacion?.toISO() ?? null,
      filas: detalles
        ? detalles.map((detalle) => ({
            fila: detalle.fila,
            accion: detalle.accion,
            codigo: detalle.codigo,
            fuenteEmisionId: detalle.fuenteEmisionId,
            factorEmisionId: detalle.factorEmisionId,
            mensaje: detalle.mensaje,
            datos: detalle.datos,
          }))
        : null,
    }
  }
}
