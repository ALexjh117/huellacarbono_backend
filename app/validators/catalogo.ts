import vine from '@vinejs/vine'

function codigo(max: number) {
  return vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(max)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)
}

function nombre(max: number) {
  return vine.string().trim().minLength(2).maxLength(max)
}

const descripcion = () => vine.string().trim().maxLength(2000).nullable().optional()
const fecha = () =>
  vine
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
const valorNoNegativo = () =>
  vine
    .string()
    .trim()
    .regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,12})?$/)
const valorParametro = () =>
  vine
    .string()
    .trim()
    .regex(/^-?(?:0|[1-9]\d{0,13})(?:\.\d{1,10})?$/)

export const listCatalogoValidator = vine.create({
  includeInactive: vine.boolean().optional(),
})

export function validadoresCatalogo(codigoMax: number, nombreMax = 100) {
  return {
    create: vine.create({
      codigo: codigo(codigoMax),
      nombre: nombre(nombreMax),
      descripcion: descripcion(),
    }),
    update: vine.create({
      codigo: codigo(codigoMax).optional(),
      nombre: nombre(nombreMax).optional(),
      descripcion: descripcion(),
      active: vine.boolean().optional(),
    }),
  }
}

export const tipoAguaValidators = validadoresCatalogo(30)
export const componenteHidricoValidators = validadoresCatalogo(30)
export const alcanceEmisionValidators = validadoresCatalogo(20)

const TIPOS = ['HIDRICA', 'CARBONO'] as const

export const createMetodologiaValidator = vine.create({
  codigo: codigo(50),
  nombre: nombre(150),
  tipo: vine.enum(TIPOS),
  descripcion: descripcion(),
  entidadFuente: vine.string().trim().maxLength(150).nullable().optional(),
})

export const updateMetodologiaValidator = vine.create({
  codigo: codigo(50).optional(),
  nombre: nombre(150).optional(),
  tipo: vine.enum(TIPOS).optional(),
  descripcion: descripcion(),
  entidadFuente: vine.string().trim().maxLength(150).nullable().optional(),
  active: vine.boolean().optional(),
})

export const createVersionValidator = vine.create({
  numeroVersion: vine.string().trim().minLength(1).maxLength(30),
  fechaInicioVigencia: fecha(),
  fechaFinVigencia: fecha().nullable().optional(),
  descripcion: descripcion(),
  referenciaDocumental: vine.string().trim().maxLength(2000).nullable().optional(),
  gwpSetId: vine.number().positive().nullable().optional(),
})

export const updateVersionValidator = vine.create({
  numeroVersion: vine.string().trim().minLength(1).maxLength(30).optional(),
  fechaInicioVigencia: fecha().optional(),
  fechaFinVigencia: fecha().nullable().optional(),
  descripcion: descripcion(),
  referenciaDocumental: vine.string().trim().maxLength(2000).nullable().optional(),
  active: vine.boolean().optional(),
  gwpSetId: vine.number().positive().nullable().optional(),
})

export const listVigenciaValidator = vine.create({
  includeInactive: vine.boolean().optional(),
  versionId: vine.number().positive().optional(),
  fuenteEmisionId: vine.number().positive().optional(),
})

export const createFactorValidator = vine.create({
  versionId: vine.number().positive(),
  fuenteEmisionId: vine.number().positive(),
  unidadEntradaId: vine.number().positive(),
  unidadSalidaId: vine.number().positive(),
  codigo: codigo(80),
  nombre: nombre(150),
  valor: valorNoNegativo(),
  fuente: vine.string().trim().maxLength(255).nullable().optional(),
  region: vine.string().trim().maxLength(100).nullable().optional(),
  fechaInicioVigencia: fecha(),
  fechaFinVigencia: fecha().nullable().optional(),
  gas: vine.enum(['CO2', 'CH4', 'N2O', 'CO2E', 'OTRO'] as const).optional(),
  gasEspecifico: vine.string().trim().maxLength(80).nullable().optional(),
  institucionResponsable: vine.string().trim().maxLength(200).nullable().optional(),
  anioPublicacion: vine.number().min(1800).max(2200).nullable().optional(),
  anioAplicacion: vine.number().min(1800).max(2200).nullable().optional(),
  sectorCategoria: vine.string().trim().maxLength(150).nullable().optional(),
  origen: vine.string().trim().maxLength(50).nullable().optional(),
})

export const updateFactorValidator = vine.create({
  versionId: vine.number().positive().optional(),
  fuenteEmisionId: vine.number().positive().optional(),
  unidadEntradaId: vine.number().positive().optional(),
  unidadSalidaId: vine.number().positive().optional(),
  codigo: codigo(80).optional(),
  nombre: nombre(150).optional(),
  valor: valorNoNegativo().optional(),
  fuente: vine.string().trim().maxLength(255).nullable().optional(),
  region: vine.string().trim().maxLength(100).nullable().optional(),
  fechaInicioVigencia: fecha().optional(),
  fechaFinVigencia: fecha().nullable().optional(),
  active: vine.boolean().optional(),
  gas: vine.enum(['CO2', 'CH4', 'N2O', 'CO2E', 'OTRO'] as const).optional(),
  gasEspecifico: vine.string().trim().maxLength(80).nullable().optional(),
  institucionResponsable: vine.string().trim().maxLength(200).nullable().optional(),
  anioPublicacion: vine.number().min(1800).max(2200).nullable().optional(),
  anioAplicacion: vine.number().min(1800).max(2200).nullable().optional(),
  sectorCategoria: vine.string().trim().maxLength(150).nullable().optional(),
  origen: vine.string().trim().maxLength(50).nullable().optional(),
  estadoAprobacion: vine
    .enum(['BORRADOR', 'PENDIENTE', 'APROBADO', 'RECHAZADO'] as const)
    .optional(),
})

export const createParametroValidator = vine.create({
  versionId: vine.number().positive(),
  unidadId: vine.number().positive().nullable().optional(),
  codigo: codigo(50),
  nombre: nombre(150),
  valor: valorParametro(),
  fuente: vine.string().trim().maxLength(255).nullable().optional(),
  fechaInicioVigencia: fecha(),
  fechaFinVigencia: fecha().nullable().optional(),
})

export const updateParametroValidator = vine.create({
  versionId: vine.number().positive().optional(),
  unidadId: vine.number().positive().nullable().optional(),
  codigo: codigo(50).optional(),
  nombre: nombre(150).optional(),
  valor: valorParametro().optional(),
  fuente: vine.string().trim().maxLength(255).nullable().optional(),
  fechaInicioVigencia: fecha().optional(),
  fechaFinVigencia: fecha().nullable().optional(),
  active: vine.boolean().optional(),
})
