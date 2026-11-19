import vine from '@vinejs/vine'

const ESTADOS = ['REGISTRADO', 'VALIDADO', 'RECHAZADO'] as const
const cantidad = () => vine.string().trim().regex(/^(?:0|[1-9]\d{0,15})(?:\.\d{1,8})?$/)
const fecha = () => vine.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/)

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
  unidadId: vine.number().positive(),
  cantidad: cantidad(),
  fechaDato: fecha().nullable().optional(),
  fuenteDato: vine.string().trim().maxLength(255).nullable().optional(),
  observacion: vine.string().trim().maxLength(2000).nullable().optional(),
})

export const updateDatoActividadCarbonoValidator = vine.create({
  actividadId: vine.number().positive().optional(),
  periodoId: vine.number().positive().optional(),
  fuenteEmisionId: vine.number().positive().optional(),
  alcanceId: vine.number().positive().optional(),
  unidadId: vine.number().positive().optional(),
  cantidad: cantidad().optional(),
  fechaDato: fecha().nullable().optional(),
  fuenteDato: vine.string().trim().maxLength(255).nullable().optional(),
  observacion: vine.string().trim().maxLength(2000).nullable().optional(),
  estadoRegistro: vine.enum(ESTADOS).optional(),
})
