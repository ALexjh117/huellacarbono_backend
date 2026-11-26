import vine from '@vinejs/vine'

export const MAX_FILAS_IMPORTACION = 1000

const fecha = () =>
  vine
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)

/**
 * Envoltorio de la importación. Las filas se validan una por una con
 * `filaImportacionValidator` para informar el error de cada fila sin
 * rechazar el archivo completo.
 */
export const previsualizarImportacionValidator = vine.create({
  versionId: vine.number().positive(),
  /** Origen de la carga, p. ej. el nombre corto del documento oficial. */
  origen: vine.string().trim().minLength(2).maxLength(50),
  /** Referencia documental completa (título, edición, URL). */
  referencia: vine.string().trim().minLength(2).maxLength(500),
  archivo: vine.string().trim().maxLength(255).nullable().optional(),
  filas: vine
    .array(vine.object({}).allowUnknownProperties())
    .minLength(1)
    .maxLength(MAX_FILAS_IMPORTACION),
})

/**
 * Una fila de factor. A diferencia del alta individual, exige los datos de
 * trazabilidad que la base pide para poder aprobar el factor más adelante:
 * fuente bibliográfica, institución, año de publicación y año de aplicación.
 * Fuente y unidades se identifican por su código de catálogo.
 */
export const filaImportacionValidator = vine.create({
  codigo: vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(80)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/),
  nombre: vine.string().trim().minLength(2).maxLength(150),
  fuenteEmisionCodigo: vine.string().trim().minLength(1).maxLength(30),
  unidadEntradaCodigo: vine.string().trim().minLength(1).maxLength(30),
  unidadSalidaCodigo: vine.string().trim().minLength(1).maxLength(30),
  valor: vine
    .string()
    .trim()
    .regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,12})?$/),
  gas: vine.enum(['CO2', 'CH4', 'N2O', 'CO2E', 'OTRO'] as const),
  gasEspecifico: vine.string().trim().maxLength(80).nullable().optional(),
  region: vine.string().trim().maxLength(100).nullable().optional(),
  sectorCategoria: vine.string().trim().maxLength(150).nullable().optional(),
  fuente: vine.string().trim().minLength(2).maxLength(255),
  institucionResponsable: vine.string().trim().minLength(2).maxLength(200),
  anioPublicacion: vine.number().withoutDecimals().min(1800).max(2200),
  anioAplicacion: vine.number().withoutDecimals().min(1800).max(2200),
  fechaInicioVigencia: fecha(),
  fechaFinVigencia: fecha().nullable().optional(),
})

export const listImportacionesValidator = vine.create({
  versionId: vine.number().positive().optional(),
})

export const coberturaValidator = vine.create({
  versionId: vine.number().positive(),
})
