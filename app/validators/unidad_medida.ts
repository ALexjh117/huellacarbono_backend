import vine from '@vinejs/vine'

/**
 * factor_base es DECIMAL(24, 12) en PostgreSQL. El valor viaja siempre como
 * cadena: convertirlo a Number sólo conserva 15 dígitos significativos y
 * perdería precisión antes de almacenarlo.
 */
const DECIMAL_24_12 = /^\d{1,12}(\.\d{1,12})?$/

/**
 * Regla propia: valida el formato DECIMAL(24, 12) y que el valor sea
 * estrictamente mayor que cero, con mensajes diferenciados para cada fallo.
 */
const factorBaseDecimal = vine.createRule((value, _options, field) => {
  if (typeof value !== 'string') {
    return
  }

  if (!DECIMAL_24_12.test(value)) {
    field.report(
      'factorBase debe ser un decimal con máximo 12 dígitos enteros y 12 decimales',
      'factor_base.formato',
      field
    )
    return
  }

  if (!/[1-9]/.test(value)) {
    field.report('factorBase debe ser estrictamente mayor que cero', 'factor_base.positivo', field)
  }
})

export const createMeasurementUnitValidator = vine.create({
  codigo: vine.string().trim().minLength(1).maxLength(30),
  nombre: vine.string().trim().minLength(1).maxLength(100),
  simbolo: vine.string().trim().minLength(1).maxLength(30),
  magnitud: vine.string().trim().minLength(1).maxLength(50),
  factorBase: vine.string().trim().use(factorBaseDecimal()),
})

export const updateMeasurementUnitValidator = vine.create({
  codigo: vine.string().trim().minLength(1).maxLength(30).optional(),
  nombre: vine.string().trim().minLength(1).maxLength(100).optional(),
  simbolo: vine.string().trim().minLength(1).maxLength(30).optional(),
  magnitud: vine.string().trim().minLength(1).maxLength(50).optional(),
  factorBase: vine.string().trim().use(factorBaseDecimal()).optional(),
  active: vine.boolean().optional(),
})
