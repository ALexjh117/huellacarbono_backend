import vine from '@vinejs/vine'

const TIPOS = ['EMPRESA', 'ENTIDAD_PUBLICA', 'INSTITUCION_EDUCATIVA', 'ONG', 'OTRA'] as const
const DOCUMENTOS = ['CC', 'CE', 'PASAPORTE'] as const
const SECTORES_ECONOMICOS = [
  'Agricultura y Cultivos Agrícolas',
  'Ganadería y Producción Pecuaria',
  'Silvicultura y Extracción Forestal',
  'Pesca y Acuicultura',
  'Minería y Extracción de Hidrocarburos',
  'Industria de Alimentos, Bebidas y Tabaco',
  'Textil, Confección, Cuero y Calzado',
  'Industria Química, Petroquímica y Farmacéutica',
  'Materiales de Construcción y Minerales no Metálicos',
  'Metalmecánica y Fabricación de Maquinaria',
  'Construcción y Obras Civiles',
  'Comercio Mayorista y Minorista',
  'Transporte, Almacenamiento y Logística',
  'Hotelería, Turismo y Gastronomía',
  'Sector Financiero, Asegurador e Inmobiliario',
  'Servicios Públicos Domiciliarios',
  'Servicios Sociales, Salud y Educación',
  'Tecnologías de la Información y las Comunicaciones (TIC)',
  'Investigación Científica y Desarrollo Tecnológico (I+D+i)',
  'Servicios Profesionales, Científicos y Técnicos',
  'Administración Pública, Defensa y Justicia',
  'Industrias Creativas y Economía Naranja',
  'Organizaciones No Gubernamentales y Voluntariado',
] as const

const correo = () => vine.string().trim().toLowerCase().email().maxLength(150).nullable().optional()
const texto = (max: number) => vine.string().trim().maxLength(max).nullable().optional()

export const listOrganizacionesValidator = vine.create({
  page: vine.number().min(1).optional(),
  perPage: vine.number().min(1).max(100).optional(),
  includeInactive: vine.boolean().optional(),
  departamentoId: vine.number().positive().optional(),
  municipioId: vine.number().positive().optional(),
  q: vine.string().trim().maxLength(100).optional(),
})

export const createOrganizacionValidator = vine.create({
  municipioId: vine.number().positive(),
  nombre: vine.string().trim().minLength(2).maxLength(200),
  nombreCorto: texto(50),
  nit: vine.string().trim().minLength(1).maxLength(20),
  tipo: vine.enum(TIPOS),
  sectorEconomico: vine.enum(SECTORES_ECONOMICOS).nullable().optional(),
  correo: correo(),
  telefono: texto(30),
  direccion: texto(200),
  representanteNombre: texto(150),
  representanteTipoDocumento: vine.enum(DOCUMENTOS).nullable().optional(),
  representanteNumeroDocumento: texto(30),
  representanteCorreo: correo(),
  representanteTelefono: texto(30),
})

export const updateOrganizacionValidator = vine.create({
  municipioId: vine.number().positive().optional(),
  nombre: vine.string().trim().minLength(2).maxLength(200).optional(),
  nombreCorto: texto(50),
  nit: vine.string().trim().minLength(1).maxLength(20).optional(),
  tipo: vine.enum(TIPOS).optional(),
  sectorEconomico: vine.enum(SECTORES_ECONOMICOS).nullable().optional(),
  correo: correo(),
  telefono: texto(30),
  direccion: texto(200),
  representanteNombre: texto(150),
  representanteTipoDocumento: vine.enum(DOCUMENTOS).nullable().optional(),
  representanteNumeroDocumento: texto(30),
  representanteCorreo: correo(),
  representanteTelefono: texto(30),
  active: vine.boolean().optional(),
})
