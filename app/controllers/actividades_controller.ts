import ActividadService from '#services/actividad_service'
import ActividadTransformer from '#transformers/actividad_transformer'
import {
  createActividadValidator,
  listHijosValidator,
  updateActividadValidator,
} from '#validators/proceso'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

function resourceId(value: string, mensaje: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) {
    throw new Exception(mensaje, { status: 404, code: 'E_NOT_FOUND' })
  }
  return id
}

function bandera(valor: unknown) {
  if (valor === undefined || valor === '') return undefined
  if (valor === true || valor === 'true') return true
  if (valor === false || valor === 'false') return false
  return valor
}

export default class ActividadesController {
  async index({ auth, params, request, serialize }: HttpContext) {
    const query = await request.validateUsing(listHijosValidator, {
      data: { includeInactive: bandera(request.input('includeInactive')) },
    })
    const actividades = await new ActividadService().list(
      auth.getUserOrFail().id,
      resourceId(params.id, 'El proceso no existe'),
      query.includeInactive ?? false
    )
    return serialize(ActividadTransformer.transform(actividades))
  }

  async store({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createActividadValidator)
    const actividad = await new ActividadService().create(
      auth.getUserOrFail().id,
      resourceId(params.id, 'El proceso no existe'),
      payload
    )
    return serialize(ActividadTransformer.transform(actividad))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateActividadValidator)
    const actividad = await new ActividadService().update(
      resourceId(params.id, 'La actividad no existe'),
      auth.getUserOrFail().id,
      payload
    )
    return serialize(ActividadTransformer.transform(actividad))
  }
}
