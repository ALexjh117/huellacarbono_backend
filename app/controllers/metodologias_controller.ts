import { bandera, resourceId } from '#controllers/catalogos_controller'
import MetodologiaService from '#services/metodologia_service'
import MetodologiaVersionService from '#services/metodologia_version_service'
import MetodologiaTransformer from '#transformers/metodologia_transformer'
import MetodologiaVersionTransformer from '#transformers/metodologia_version_transformer'
import {
  createMetodologiaValidator,
  createVersionValidator,
  listCatalogoValidator,
  updateMetodologiaValidator,
  updateVersionValidator,
} from '#validators/catalogo'
import type { HttpContext } from '@adonisjs/core/http'

export default class MetodologiasController {
  async index({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(listCatalogoValidator, {
      data: { includeInactive: bandera(request.input('includeInactive')) },
    })
    const metodologias = await new MetodologiaService().list(query.includeInactive ?? false)
    return serialize(MetodologiaTransformer.transform(metodologias))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createMetodologiaValidator)
    const metodologia = await new MetodologiaService().create(payload)
    return serialize(MetodologiaTransformer.transform(metodologia))
  }

  async show({ params, serialize }: HttpContext) {
    const metodologia = await new MetodologiaService().show(
      resourceId(params.id, 'La metodología no existe')
    )
    return serialize(MetodologiaTransformer.transform(metodologia))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateMetodologiaValidator)
    const metodologia = await new MetodologiaService().update(
      resourceId(params.id, 'La metodología no existe'),
      payload
    )
    return serialize(MetodologiaTransformer.transform(metodologia))
  }

  async versiones({ params, request, serialize }: HttpContext) {
    const query = await request.validateUsing(listCatalogoValidator, {
      data: { includeInactive: bandera(request.input('includeInactive')) },
    })
    const versiones = await new MetodologiaVersionService().list(
      resourceId(params.id, 'La metodología no existe'),
      query.includeInactive ?? false
    )
    return serialize(MetodologiaVersionTransformer.transform(versiones))
  }

  async crearVersion({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createVersionValidator)
    const version = await new MetodologiaVersionService().create(
      resourceId(params.id, 'La metodología no existe'),
      payload
    )
    return serialize(MetodologiaVersionTransformer.transform(version))
  }

  async actualizarVersion({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateVersionValidator)
    const version = await new MetodologiaVersionService().update(
      resourceId(params.versionId, 'La versión no existe'),
      payload
    )
    return serialize(MetodologiaVersionTransformer.transform(version))
  }
}
