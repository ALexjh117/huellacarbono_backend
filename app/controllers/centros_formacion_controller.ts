import CentroFormacionService from '#services/centro_formacion_service'
import RegionalService from '#services/regional_service'
import CentroFormacionTransformer from '#transformers/centro_formacion_transformer'
import RegionalTransformer from '#transformers/regional_transformer'
import {
  createCentroValidator,
  createRegionalValidator,
  listCentrosValidator,
  updateCentroValidator,
  updateRegionalValidator,
} from '#validators/centro_formacion'
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

function numero(valor: unknown) {
  if (valor === undefined || valor === '') return undefined
  return Number(valor)
}

export default class RegionalesController {
  async index({ request, serialize }: HttpContext) {
    const includeInactive = bandera(request.input('includeInactive')) === true
    const regionales = await new RegionalService().list(includeInactive)
    return serialize(RegionalTransformer.transform(regionales))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createRegionalValidator)
    const regional = await new RegionalService().create(payload)
    return serialize(RegionalTransformer.transform(regional))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateRegionalValidator)
    const regional = await new RegionalService().update(
      resourceId(params.id, 'La regional no existe'),
      payload
    )
    return serialize(RegionalTransformer.transform(regional))
  }
}

export class CentrosFormacionController {
  async index({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(listCentrosValidator, {
      data: {
        includeInactive: bandera(request.input('includeInactive')),
        regionalId: numero(request.input('regionalId')),
      },
    })
    const centros = await new CentroFormacionService().list(
      query.includeInactive ?? false,
      query.regionalId
    )
    return serialize(CentroFormacionTransformer.transform(centros))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createCentroValidator)
    const centro = await new CentroFormacionService().create(payload)
    return serialize(CentroFormacionTransformer.transform(centro))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateCentroValidator)
    const centro = await new CentroFormacionService().update(
      resourceId(params.id, 'El centro de formación no existe'),
      payload
    )
    return serialize(CentroFormacionTransformer.transform(centro))
  }
}
