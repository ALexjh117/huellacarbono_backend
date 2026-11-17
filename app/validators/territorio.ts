import vine from '@vinejs/vine'

export const municipiosQueryValidator = vine.create({
  departamentoId: vine.number().positive(),
})
