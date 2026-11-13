import vine from '@vinejs/vine'

export const TIPOS_ORGANIZACION = ['INSTITUCION_EDUCATIVA', 'EMPRESA'] as const

const texto = (max: number) => vine.string().trim().maxLength(max).nullable().optional()
const correo = () => vine.string().trim().email().maxLength(150).nullable().optional()

const camposComunes = {
  nombreCorto: texto(50),
  nit: texto(20),
  sectorEconomico: texto(120),
  direccion: texto(200),
  municipioId: vine.number().positive().nullable().optional(),
  correo: correo(),
  telefono: texto(30),
  representanteNombre: texto(150),
  representanteTipoDocumento: texto(20),
  representanteNumeroDocumento: texto(30),
  representanteCorreo: correo(),
  representanteTelefono: texto(30),
}

export const listarOrganizacionValidator = vine.compile(
  vine.object({
    search: vine.string().trim().optional(),
    estado: vine.boolean().optional(),
    tipo: vine.enum(TIPOS_ORGANIZACION).optional(),
  })
)

export const crearOrganizacionValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(200),
    tipo: vine.enum(TIPOS_ORGANIZACION),
    ...camposComunes,
  })
)

export const actualizarOrganizacionValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(200).optional(),
    tipo: vine.enum(TIPOS_ORGANIZACION).optional(),
    estado: vine.boolean().optional(),
    ...camposComunes,
  })
)