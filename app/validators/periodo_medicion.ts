import vine from '@vinejs/vine'

const fecha = () => vine.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/)
const ESTADOS = ['ABIERTO', 'CERRADO', 'BLOQUEADO'] as const

export const createPeriodoValidator = vine.create({
  nombre: vine.string().trim().minLength(1).maxLength(100),
  fechaInicio: fecha(),
  fechaFin: fecha(),
})

export const updatePeriodoValidator = vine.create({
  nombre: vine.string().trim().minLength(1).maxLength(100).optional(),
  fechaInicio: fecha().optional(),
  fechaFin: fecha().optional(),
  estado: vine.enum(ESTADOS).optional(),
})
