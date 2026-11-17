import vine from '@vinejs/vine'

const descripcion = () => vine.string().trim().maxLength(2000).nullable().optional()

export const listHijosValidator = vine.create({
  includeInactive: vine.boolean().optional(),
})

export const createProcesoValidator = vine.create({
  nombre: vine.string().trim().minLength(2).maxLength(150),
  descripcion: descripcion(),
})

export const updateProcesoValidator = vine.create({
  nombre: vine.string().trim().minLength(2).maxLength(150).optional(),
  descripcion: descripcion(),
  active: vine.boolean().optional(),
})

export const createActividadValidator = vine.create({
  nombre: vine.string().trim().minLength(2).maxLength(150),
  descripcion: descripcion(),
})

export const updateActividadValidator = vine.create({
  nombre: vine.string().trim().minLength(2).maxLength(150).optional(),
  descripcion: descripcion(),
  active: vine.boolean().optional(),
})
