import vine from '@vinejs/vine'

/**
 * cantidad es DECIMAL(24, 8) en PostgreSQL. El valor viaja siempre como
 * cadena: convertirlo a Number sólo conserva 15 dígitos significativos y
 * perdería precisión antes de almacenarlo. Mismo criterio que `factor_base`
 * en el módulo de unidades de medida.
 */
const DECIMAL_24_8 = /^\d{1,16}(\.\d{1,8})?$/

/**
 * Regla propia: valida el formato DECIMAL(24, 8) y que el valor sea
 * estrictamente mayor que cero, con mensajes diferenciados para cada fallo.
 * La base de datos admite `cantidad >= 0`, pero el módulo exige > 0.
 */
const cantidadDecimal = vine.createRule((value, _options, field) => {
  if (typeof value !== 'string') {
    return
  }

  if (!DECIMAL_24_8.test(value)) {
    field.report(
      'quantity debe ser un decimal con máximo 16 dígitos enteros y 8 decimales',
      'quantity.formato',
      field
    )
    return
  }

  if (!/[1-9]/.test(value)) {
    field.report('quantity debe ser estrictamente mayor que cero', 'quantity.positivo', field)
  }
})

/**
 * Identificador de relación (proyecto, actividad, periodo, …): número
 * entero mayor que cero. Vine no ofrece `integer()`, así que la regla
 * propia evita que un valor como 1.5 llegue a la consulta y falle como
 * «registro inexistente» en lugar de como dato inválido.
 */
const idEntero = vine.createRule((value, _options, field) => {
  if (typeof value !== 'number') {
    return
  }

  if (!Number.isInteger(value) || value < 1) {
    field.report('Debe ser un número entero mayor que cero', 'id.positivo', field)
  }
})

/** Fábrica de identificadores: número entero mayor que cero. */
const idRelacion = () => vine.number().use(idEntero())

/**
 * Listado de datos de actividad. `projectId` es obligatorio: cada consulta
 * debe indicar el proyecto para no mezclar datos de distintas organizaciones.
 * El resto de filtros (periodo, actividad, fuente, alcance) es opcional.
 */
export const listQueryValidator = vine.create({
  projectId: idRelacion(),
  periodId: idRelacion().optional(),
  activityId: idRelacion().optional(),
  emissionSourceId: idRelacion().optional(),
  scopeId: idRelacion().optional(),
})

/** Catálogos que dependen del proyecto (actividades y periodos). */
export const projectQueryValidator = vine.create({
  projectId: idRelacion(),
})

export const createDatoActividadValidator = vine.create({
  projectId: idRelacion(),
  activityId: idRelacion(),
  periodId: idRelacion(),
  emissionSourceId: idRelacion(),
  scopeId: idRelacion(),
  unitId: idRelacion(),
  /** Cadena decimal, estrictamente mayor que cero (ver `cantidadDecimal`). */
  quantity: vine.string().trim().use(cantidadDecimal()),
  /** «Qué se copia»: tipo de dato o documento del que se obtuvo la cantidad. */
  whatToCopy: vine.string().trim().minLength(1).maxLength(255),
  /** «Documento»: evidencia de la que se copió la cantidad. */
  document: vine.string().trim().minLength(1).maxLength(255),
})

/**
 * Edición parcial: cada relación presente se valida contra el proyecto al
 * que pertenece el registro (la actividad y el periodo no pueden salirse
 * del proyecto original).
 */
export const updateDatoActividadValidator = vine.create({
  projectId: idRelacion().optional(),
  activityId: idRelacion().optional(),
  periodId: idRelacion().optional(),
  emissionSourceId: idRelacion().optional(),
  scopeId: idRelacion().optional(),
  unitId: idRelacion().optional(),
  quantity: vine.string().trim().use(cantidadDecimal()).optional(),
  whatToCopy: vine.string().trim().minLength(1).maxLength(255).optional(),
  document: vine.string().trim().minLength(1).maxLength(255).optional(),
})
