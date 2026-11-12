import vine from '@vinejs/vine'

export const createRoleValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(50),
  description: vine.string().trim().maxLength(255).optional(),
})

export const updateRoleValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(50).optional(),
  description: vine.string().trim().maxLength(255).optional(),
  active: vine.boolean().optional(),
})

export const syncRolePermissionsValidator = vine.create({
  codes: vine.array(vine.string().trim().minLength(1).maxLength(80)),
})
