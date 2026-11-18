import UnidadMedidaService from '#services/unidad_medida_service'
import UnidadMedidaTransformer from '#transformers/unidad_medida_transformer'
import { listQueryValidator } from '#validators/usuario'
import {
  createMeasurementUnitValidator,
  updateMeasurementUnitValidator,
} from '#validators/unidad_medida'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

function resourceId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) {
    throw new Exception('La unidad de medida no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  return id
}

function includeInactive(request: HttpContext['request']) {
  const value = request.input('includeInactive')
  return {
    includeInactive:
      value === undefined || value === ''
        ? undefined
        : value === true || value === 'true'
          ? true
          : value === false || value === 'false'
            ? false
            : value,
  }
}

export default class UnidadesMedidaController {
  async index({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(listQueryValidator, {
      data: includeInactive(request),
    })
    const units = await new UnidadMedidaService().list(query.includeInactive ?? false)
    return serialize(UnidadMedidaTransformer.transform(units))
  }

  async show({ params, serialize }: HttpContext) {
    const unit = await new UnidadMedidaService().show(resourceId(params.id))
    return serialize(UnidadMedidaTransformer.transform(unit))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createMeasurementUnitValidator)
    const unit = await new UnidadMedidaService().create(payload)
    return serialize(UnidadMedidaTransformer.transform(unit))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateMeasurementUnitValidator)
    const unit = await new UnidadMedidaService().update(resourceId(params.id), payload)
    return serialize(UnidadMedidaTransformer.transform(unit))
  }

  async destroy({ params, serialize }: HttpContext) {
    const unit = await new UnidadMedidaService().delete(resourceId(params.id))
    return serialize(UnidadMedidaTransformer.transform(unit))
  }
}
