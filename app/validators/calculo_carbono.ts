import vine from '@vinejs/vine'

export const listCalculoCarbonoValidator = vine.create({
  organizacionId: vine.number().positive().optional(),
})

export const opcionesCalculoCarbonoValidator = vine.create({
  organizacionId: vine.number().positive(),
})

const fecha = () => vine.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/)

/** Intervalo que la pantalla de datos de actividad consulta antes de guardar. */
export const coberturaFactoresValidator = vine.create({
  versionId: vine.number().positive(),
  desde: fecha(),
  hasta: fecha(),
  organizacionId: vine.number().positive().optional(),
})

const cantidad = () => vine.string().trim().regex(/^(?:0|[1-9]\d{0,15})(?:\.\d{1,8})?$/)

export const createCalculoCarbonoValidator = vine.create({
  organizacionId: vine.number().positive(),
  periodoId: vine.number().positive(),
  versionId: vine.number().positive(),
  observacion: vine.string().trim().maxLength(2000).nullable().optional(),
  unidadesProducidas: cantidad().nullable().optional(),
  unidadFuncional: vine.string().trim().maxLength(80).nullable().optional(),
})

export const guardarReduccionValidator = vine.create({
  acciones: vine
    .array(
      vine.object({
        fuenteEmisionId: vine.number().positive().nullable().optional(),
        estrategia: vine.string().trim().minLength(1).maxLength(255),
        indicador: vine.string().trim().minLength(1).maxLength(150),
        meta: vine.string().trim().minLength(1).maxLength(255),
      })
    )
    .maxLength(30),
})
