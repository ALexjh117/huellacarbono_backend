import vine from '@vinejs/vine'

/**
 * fuente_emision no tiene el campo alcance: id_alcance pertenece a
 * dato_actividad_carbono y a resultado_carbono. Por eso este validador es
 * propio y no reutiliza los catálogos genéricos.
 */
export const createFuenteEmisionValidator = vine.create({
  codigo: vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(50)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/),
  nombre: vine.string().trim().minLength(2).maxLength(150),
  categoria: vine.string().trim().maxLength(100).nullable().optional(),
  descripcion: vine.string().trim().maxLength(2000).nullable().optional(),
})

export const updateFuenteEmisionValidator = vine.create({
  codigo: vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(50)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)
    .optional(),
  nombre: vine.string().trim().minLength(2).maxLength(150).optional(),
  categoria: vine.string().trim().maxLength(100).nullable().optional(),
  descripcion: vine.string().trim().maxLength(2000).nullable().optional(),
  active: vine.boolean().optional(),
})
