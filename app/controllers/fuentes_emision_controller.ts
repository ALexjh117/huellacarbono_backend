import { bandera, resourceId } from '#controllers/catalogos_controller'
import FuenteEmisionService from '#services/fuente_emision_service'
import FuenteEmisionTransformer from '#transformers/fuente_emision_transformer'
import { listCatalogoValidator } from '#validators/catalogo'
import {
  createFuenteEmisionValidator,
  updateFuenteEmisionValidator,
} from '#validators/fuente_emision'
import type { HttpContext } from '@adonisjs/core/http'

export default class FuentesEmisionController {
  async index({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(listCatalogoValidator, {
      data: { includeInactive: bandera(request.input('includeInactive')) },
    })
    const fuentes = await new FuenteEmisionService().list(query.includeInactive ?? false)
    return serialize(FuenteEmisionTransformer.transform(fuentes))
  }

  async show({ params, serialize }: HttpContext) {
    const fuente = await new FuenteEmisionService().show(
      resourceId(params.id, 'La fuente de emisión no existe')
    )
    return serialize(FuenteEmisionTransformer.transform(fuente))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createFuenteEmisionValidator)
    const fuente = await new FuenteEmisionService().create(payload)
    return serialize(FuenteEmisionTransformer.transform(fuente))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateFuenteEmisionValidator)
    const fuente = await new FuenteEmisionService().update(
      resourceId(params.id, 'La fuente de emisión no existe'),
      payload
    )
    return serialize(FuenteEmisionTransformer.transform(fuente))
  }

  async destroy({ params, serialize }: HttpContext) {
    const fuente = await new FuenteEmisionService().delete(
      resourceId(params.id, 'La fuente de emisión no existe')
    )
    return serialize(FuenteEmisionTransformer.transform(fuente))
  }
}
