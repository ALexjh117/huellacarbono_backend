import DatoActividadService from '#services/dato_actividad_service'
import DatoActividadCarbonoTransformer from '#transformers/dato_actividad_carbono_transformer'
import {
  createDatoActividadValidator,
  listQueryValidator,
  updateDatoActividadValidator,
} from '#validators/dato_actividad'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

function resourceId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) {
    throw new Exception('El dato de actividad no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  return id
}

/** Parámetro de consulta numérico: vacío o ausente → `undefined` (filtro sin aplicar). */
function numero(value: unknown): number | undefined {
  return value === undefined || value === null || value === '' ? undefined : Number(value)
}

/**
 * HTTP del módulo de datos de actividad. Toda la regla de negocio
 * (pertenencia al proyecto, catálogos activos, cantidad > 0) vive en
 * `DatoActividadService`; aquí sólo se traduce la petición y la respuesta.
 */
export default class DatoActividadController {
  /** Listado filtrado por proyecto (obligatorio) y, opcionalmente, por periodo, actividad, fuente o alcance. */
  async index({ request, serialize }: HttpContext) {
    const data = {
      projectId: numero(request.input('projectId')),
      periodId: numero(request.input('periodId')),
      activityId: numero(request.input('activityId')),
      emissionSourceId: numero(request.input('emissionSourceId')),
      scopeId: numero(request.input('scopeId')),
    }

    const query = await request.validateUsing(listQueryValidator, { data })
    const registros = await new DatoActividadService().list(query)
    return serialize(DatoActividadCarbonoTransformer.transform(registros))
  }

  async show({ params, serialize }: HttpContext) {
    const registro = await new DatoActividadService().show(resourceId(params.id))
    return serialize(DatoActividadCarbonoTransformer.transform(registro))
  }

  /** Alta. `quantity` viaja como cadena y se guarda sin factor ni CO2e. */
  async store({ request, auth, serialize }: HttpContext) {
    const payload = await request.validateUsing(createDatoActividadValidator)
    const usuario = auth.getUserOrFail()
    const registro = await new DatoActividadService().create(payload, usuario.id)
    return serialize(DatoActividadCarbonoTransformer.transform(registro))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateDatoActividadValidator)
    const registro = await new DatoActividadService().update(resourceId(params.id), payload)
    return serialize(DatoActividadCarbonoTransformer.transform(registro))
  }

  async destroy({ params, serialize }: HttpContext) {
    const registro = await new DatoActividadService().delete(resourceId(params.id))
    return serialize(DatoActividadCarbonoTransformer.transform(registro))
  }
}
