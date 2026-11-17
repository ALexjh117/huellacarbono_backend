import vine from '@vinejs/vine'

const correo = () => vine.string().trim().toLowerCase().email().maxLength(150).nullable().optional()
const texto = (max: number) => vine.string().trim().maxLength(max).nullable().optional()

export const listSedesValidator = vine.create({
  includeInactive: vine.boolean().optional(),
})

export const createSedeValidator = vine.create({
  nombre: vine.string().trim().minLength(2).maxLength(150),
  codigo: texto(30),
  direccion: texto(200),
  telefono: texto(30),
  correo: correo(),
  responsableNombre: texto(150),
  responsableCargo: texto(100),
  responsableCorreo: correo(),
  responsableTelefono: texto(30),
})

export const updateSedeValidator = vine.create({
  nombre: vine.string().trim().minLength(2).maxLength(150).optional(),
  codigo: texto(30),
  direccion: texto(200),
  telefono: texto(30),
  correo: correo(),
  responsableNombre: texto(150),
  responsableCargo: texto(100),
  responsableCorreo: correo(),
  responsableTelefono: texto(30),
  active: vine.boolean().optional(),
})

export const syncUsuariosSedeValidator = vine.create({
  userIds: vine.array(vine.number().positive()),
})
