import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Fila de catálogo ya proyectada por el servicio al contrato en inglés
 * (no es un modelo de Lucid, por eso no hay un transformer por entidad).
 */
export type FilaCatalogo = Record<string, unknown>

/**
 * Envoltorio de colección para los catálogos de datos de actividad.
 *
 * `serialize()` sólo añade la cabecera `{ data: … }` a `Item`, `Collection`,
 * `Paginator` y objetos simples: un array plano se devuelve tal cual y el
 * cliente no encontraría `.data`. `CatalogoTransformer.transform(filas)`
 * crea la `Collection` que sí se envuelve, sin alterar las filas.
 */
export default class CatalogoTransformer extends BaseTransformer<FilaCatalogo> {
  toObject() {
    return { ...this.resource }
  }
}
