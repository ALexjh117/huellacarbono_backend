import SedeService from '#services/sede_service'
import SedeTransformer from '#transformers/sede_transformer'
import {
  createSedeValidator,
  listSedesValidator,
  syncUsuariosSedeValidator,
  updateSedeValidator,
} from '#validators/sede'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

function resourceId(value: string, mensaje: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) {
    throw new Exception(mensaje, { status: 404, code: 'E_NOT_FOUND' })
  }
  return id
}

export default class SedesController {
  async index({ params, request, serialize }: HttpContext) {
    const query = await request.validateUsing(listSedesValidator, {
      data: { includeInactive: bandera(request.input('includeInactive')) },
    })
    const sedes = await new SedeService().list(
      resourceId(params.id, 'La organización no existe'),
      query.includeInactive ?? false
    )
    return serialize(SedeTransformer.transform(sedes))
  }

  async store({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createSedeValidator)
    const sede = await new SedeService().create(
      resourceId(params.id, 'La organización no existe'),
      payload
    )
    return serialize(SedeTransformer.transform(sede))
  }

  async show({ params, serialize }: HttpContext) {
    const sede = await new SedeService().show(resourceId(params.id, 'La sede no existe'))
    return serialize(SedeTransformer.transform(sede))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateSedeValidator)
    const sede = await new SedeService().update(resourceId(params.id, 'La sede no existe'), payload)
    return serialize(SedeTransformer.transform(sede))
  }

  async syncUsuarios({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(syncUsuariosSedeValidator)
    const sede = await new SedeService().syncUsuarios(
      resourceId(params.id, 'La sede no existe'),
      payload.userIds
    )
    return serialize(SedeTransformer.transform(sede))
  }
}

function bandera(valor: unknown) {
  if (valor === undefined || valor === '') return undefined
  if (valor === true || valor === 'true') return true
  if (valor === false || valor === 'false') return false
  return valor
}
