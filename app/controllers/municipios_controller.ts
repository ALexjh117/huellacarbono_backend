import MunicipioService from '#services/municipio_service'
import MunicipioTransformer from '#transformers/municipio_transformer'
import { listMunicipiosValidator, optionsQueryValidator } from '#validators/municipio'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

function resourceId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) {
    throw new Exception('El municipio no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  return id
}

function departamentoId(request: HttpContext['request']) {
  const value = request.input('idDepartamento')
  return {
    idDepartamento: value === undefined || value === '' ? undefined : Number(value),
  }
}

function listQuery(request: HttpContext['request']) {
  const page = request.input('page')
  const perPage = request.input('perPage')
  const includeInactive = request.input('includeInactive')

  return {
    page: page === undefined || page === '' ? undefined : Number(page),
    perPage: perPage === undefined || perPage === '' ? undefined : Number(perPage),
    includeInactive:
      includeInactive === undefined || includeInactive === ''
        ? undefined
        : includeInactive === true || includeInactive === 'true'
          ? true
          : includeInactive === false || includeInactive === 'false'
            ? false
            : includeInactive,
    ...departamentoId(request),
  }
}

export default class MunicipiosController {
  async options({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(optionsQueryValidator, {
      data: departamentoId(request),
    })
    const municipios = await new MunicipioService().options(query.idDepartamento)
    return serialize({ municipios })
  }

  async index({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(listMunicipiosValidator, { data: listQuery(request) })
    const municipios = await new MunicipioService().list({
      page: query.page ?? 1,
      perPage: query.perPage ?? 20,
      includeInactive: query.includeInactive ?? false,
      idDepartamento: query.idDepartamento,
    })

    return serialize(MunicipioTransformer.paginate(municipios.all(), municipios.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    const municipio = await new MunicipioService().show(resourceId(params.id))
    return serialize(MunicipioTransformer.transform(municipio))
  }
}
