import vine from '@vinejs/vine'

const email = () => vine.string().trim().toLowerCase().email().maxLength(150)

export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})
