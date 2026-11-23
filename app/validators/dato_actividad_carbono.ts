import vine from '@vinejs/vine'

const ESTADOS = ['REGISTRADO', 'VALIDADO', 'RECHAZADO'] as const
const cantidad = () =>
  vine
    .string()
    .trim()
    .regex(/^(?:0|[1-9]\d{0,15})(?:\.\d{1,8})?$/)
/** Densidad o poder calorífico: decimal positivo DECIMAL(24,12) como texto. */
const parametroDecimal = () =>
  vine
    .string()
    .trim()
    .regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,12})?$/)
const fecha = () =>
  vine
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)

export const listDatoActividadCarbonoValidator = vine.create({
  organizacionId: vine.number().positive(),
  periodoId: vine.number().positive().optional(),
})

export const opcionesDatoActividadCarbonoValidator = vine.create({
  organizacionId: vine.number().positive(),
})

export const createDatoActividadCarbonoValidator = vine.create({
  actividadId: vine.number().positive(),
  periodoId: vine.number().positive(),
  fuenteEmisionId: vine.number().positive(),
  alcanceId: vine.number().positive(),
  actividadEmisionId: vine.number().positive(),
  subcategoriaEmisionId: vine.number().positive().nullable().optional(),
  unidadId: vine.number().positive(),
  cantidad: cantidad(),
  fechaDato: fecha().nullable().optional(),
  fuenteDato: vine.string().trim().maxLength(255).nullable().optional(),
  observacion: vine.string().trim().maxLength(2000).nullable().optional(),
  parametrosCalculo: vine
    .object({
      consumoEspecifico: vine
        .string()
        .trim()
        .regex(/^(?:0|[1-9]\d{0,15})(?:\.\d{1,12})?$/)
        .optional(),
      unidadConsumoId: vine.number().positive().optional(),
      unidadDistanciaId: vine.number().positive().optional(),
      densidad: parametroDecimal().optional(),
      unidadDensidadId: vine.number().positive().optional(),
      poderCalorifico: parametroDecimal().optional(),
      unidadPoderCalorificoId: vine.number().positive().optional(),
    })
    .optional(),
})

export const updateDatoActividadCarbonoValidator = vine.create({
  actividadId: vine.number().positive().optional(),
  periodoId: vine.number().positive().optional(),
  fuenteEmisionId: vine.number().positive().optional(),
  alcanceId: vine.number().positive().optional(),
  actividadEmisionId: vine.number().positive().optional(),
  subcategoriaEmisionId: vine.number().positive().nullable().optional(),
  unidadId: vine.number().positive().optional(),
  cantidad: cantidad().optional(),
  fechaDato: fecha().nullable().optional(),
  fuenteDato: vine.string().trim().maxLength(255).nullable().optional(),
  observacion: vine.string().trim().maxLength(2000).nullable().optional(),
  parametrosCalculo: vine
    .object({
      consumoEspecifico: vine
        .string()
        .trim()
        .regex(/^(?:0|[1-9]\d{0,15})(?:\.\d{1,12})?$/)
        .optional(),
      unidadConsumoId: vine.number().positive().optional(),
      unidadDistanciaId: vine.number().positive().optional(),
      densidad: parametroDecimal().optional(),
      unidadDensidadId: vine.number().positive().optional(),
      poderCalorifico: parametroDecimal().optional(),
      unidadPoderCalorificoId: vine.number().positive().optional(),
    })
    .optional(),
  estadoRegistro: vine.enum(ESTADOS).optional(),
})
