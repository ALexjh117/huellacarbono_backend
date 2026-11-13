import vine from '@vinejs/vine'

const texto = (max: number) => vine.string().trim().maxLength(max).nullable().optional()
const correo = () => vine.string().trim().email().maxLength(150).nullable().optional()

const camposComunes = {
  codigo: vine.string().trim().toUpperCase().maxLength(30).nullable().optional(),
  direccion: texto(200),
  telefono: texto(30),
  correo: correo(),
  responsableNombre: texto(150),
  responsableCargo: texto(100),
  responsableCorreo: correo(),
  responsableTelefono: texto(30),
}

export const listarSedeValidator = vine.compile(
  vine.object({
    organizacionId: vine.number().positive().optional(),
    search: vine.string().trim().optional(),
    estado: vine.boolean().optional(),
  })
)

export const crearSedeValidator = vine.compile(
  vine.object({
    organizacionId: vine.number().positive(),
    nombre: vine.string().trim().minLength(1).maxLength(150),
    ...camposComunes,
  })
)

// La sede no se puede mover de organización: organizacionId no se acepta al actualizar.
export const actualizarSedeValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(150).optional(),
    estado: vine.boolean().optional(),
    ...camposComunes,
  })
)