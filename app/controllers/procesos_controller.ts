import ProcesoService from '#services/proceso_service'
import ProcesoTransformer from '#transformers/proceso_transformer'
import {
  createProcesoValidator,
  listHijosValidator,
  updateProcesoValidator,
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

export default class ProcesosController {
  async index({ auth, params, request, serialize }: HttpContext) {
    const query = await request.validateUsing(listHijosValidator, {
      data: { includeInactive: bandera(request.input('includeInactive')) },
    })
    const procesos = await new ProcesoService().list(
      auth.getUserOrFail().id,
      resourceId(params.id, 'La sede no existe'),
      query.includeInactive ?? false
    )
    return serialize(ProcesoTransformer.transform(procesos))
  }

  async store({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createProcesoValidator)
    const proceso = await new ProcesoService().create(
      auth.getUserOrFail().id,
      resourceId(params.id, 'La sede no existe'),
      payload
    )
    return serialize(ProcesoTransformer.transform(proceso))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const proceso = await new ProcesoService().show(
      resourceId(params.id, 'El proceso no existe'),
      auth.getUserOrFail().id
    )
    return serialize(ProcesoTransformer.transform(proceso))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateProcesoValidator)
    const proceso = await new ProcesoService().update(
      resourceId(params.id, 'El proceso no existe'),
      auth.getUserOrFail().id,
      payload
    )
    return serialize(ProcesoTransformer.transform(proceso))
  }
}
