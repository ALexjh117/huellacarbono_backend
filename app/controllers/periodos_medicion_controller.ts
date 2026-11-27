import PeriodoMedicionService from '#services/periodo_medicion_service'
import PeriodoMedicionTransformer from '#transformers/periodo_medicion_transformer'
import { createPeriodoValidator, updatePeriodoValidator } from '#validators/periodo_medicion'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

function resourceId(value: string, mensaje: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) {
    throw new Exception(mensaje, { status: 404, code: 'E_NOT_FOUND' })
  }
  return id
}

export default class PeriodosMedicionController {
  async index({ auth, params, serialize }: HttpContext) {
    const periodos = await new PeriodoMedicionService().list(
      auth.getUserOrFail().id,
      resourceId(params.id, 'La organización no existe')
    )
    return serialize(PeriodoMedicionTransformer.transform(periodos))
  }

  async store({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createPeriodoValidator)
    const periodo = await new PeriodoMedicionService().create(
      auth.getUserOrFail().id,
      resourceId(params.id, 'La organización no existe'),
      payload
    )
    return serialize(PeriodoMedicionTransformer.transform(periodo))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updatePeriodoValidator)
    const periodo = await new PeriodoMedicionService().update(
      auth.getUserOrFail().id,
      resourceId(params.id, 'El periodo no existe'),
      payload
    )
    return serialize(PeriodoMedicionTransformer.transform(periodo))
  }
}
