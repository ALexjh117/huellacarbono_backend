import vine from '@vinejs/vine'

const email = () => vine.string().trim().toLowerCase().email().maxLength(150)
const password = () => vine.string().minLength(8).maxLength(72)

export const createUserValidator = vine.create({
  nombres: vine.string().trim().minLength(1).maxLength(100),
  apellidos: vine.string().trim().minLength(1).maxLength(100),
  email: email().unique({ table: 'usuario', column: 'correo' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
  roleIds: vine.array(vine.number().positive()).minLength(1),
})

export const updateUserValidator = vine.create({
  nombres: vine.string().trim().minLength(1).maxLength(100).optional(),
  apellidos: vine.string().trim().minLength(1).maxLength(100).optional(),
  email: email().optional(),
  password: password().optional(),
  passwordConfirmation: vine.string().optional(),
  active: vine.boolean().optional(),
})

export const syncRolesValidator = vine.create({
  roleIds: vine.array(vine.number().positive()),
})

export const listQueryValidator = vine.create({
  page: vine.number().min(1).optional(),
  perPage: vine.number().min(1).max(100).optional(),
  includeInactive: vine.boolean().optional(),
})
