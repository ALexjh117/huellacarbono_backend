import vine from '@vinejs/vine'

const codigo = (max: number) => vine.string().trim().minLength(1).maxLength(max)
const nombre = (max: number) => vine.string().trim().minLength(1).maxLength(max)

export const listCentrosValidator = vine.create({
  includeInactive: vine.boolean().optional(),
  regionalId: vine.number().positive().optional(),
})

export const createRegionalValidator = vine.create({
  codigo: codigo(10),
  nombre: nombre(150),
})

export const updateRegionalValidator = vine.create({
  codigo: codigo(10).optional(),
  nombre: nombre(150).optional(),
  active: vine.boolean().optional(),
})

export const createCentroValidator = vine.create({
  regionalId: vine.number().positive(),
  codigo: codigo(20),
  nombre: nombre(200),
})

export const updateCentroValidator = vine.create({
  regionalId: vine.number().positive().optional(),
  codigo: codigo(20).optional(),
  nombre: nombre(200).optional(),
  active: vine.boolean().optional(),
})
