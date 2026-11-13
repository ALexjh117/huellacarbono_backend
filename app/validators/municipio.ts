import vine from '@vinejs/vine'

export const listMunicipiosValidator = vine.create({
  page: vine.number().min(1).optional(),
  perPage: vine.number().min(1).max(100).optional(),
  includeInactive: vine.boolean().optional(),
  idDepartamento: vine.number().withoutDecimals().positive().optional(),
})

export const optionsQueryValidator = vine.create({
  idDepartamento: vine.number().withoutDecimals().positive().optional(),
})
