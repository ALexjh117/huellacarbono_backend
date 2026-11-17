import OrganizacionService from '#services/organizacion_service'
import OrganizacionTransformer from '#transformers/organizacion_transformer'
import {
  createOrganizacionValidator,
  listOrganizacionesValidator,
  updateOrganizacionValidator,
} from '#validators/organizacion'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

function resourceId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) {
    throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  return id
}

function listQuery(request: HttpContext['request']) {
  return {
    page: numero(request.input('page')),
    perPage: numero(request.input('perPage')),
    departamentoId: numero(request.input('departamentoId')),
    municipioId: numero(request.input('municipioId')),
    includeInactive: bandera(request.input('includeInactive')),
    q: request.input('q'),
  }
}

function numero(valor: unknown) {
  if (valor === undefined || valor === '') return undefined
  return Number(valor)
}

function bandera(valor: unknown) {
  if (valor === undefined || valor === '') return undefined
  if (valor === true || valor === 'true') return true
  if (valor === false || valor === 'false') return false
  return valor
}

export default class OrganizacionesController {
  async index({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(listOrganizacionesValidator, {
      data: listQuery(request),
    })
    const organizaciones = await new OrganizacionService().list({
      page: query.page ?? 1,
      perPage: query.perPage ?? 20,
      includeInactive: query.includeInactive ?? false,
      departamentoId: query.departamentoId,
      municipioId: query.municipioId,
      q: query.q,
    })

    return serialize(OrganizacionTransformer.paginate(organizaciones.all(), organizaciones.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    const organizacion = await new OrganizacionService().show(resourceId(params.id))
    return serialize(OrganizacionTransformer.transform(organizacion))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createOrganizacionValidator)
    const organizacion = await new OrganizacionService().create(payload)
    return serialize(OrganizacionTransformer.transform(organizacion))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateOrganizacionValidator)
    const organizacion = await new OrganizacionService().update(resourceId(params.id), payload)
    return serialize(OrganizacionTransformer.transform(organizacion))
  }
}
