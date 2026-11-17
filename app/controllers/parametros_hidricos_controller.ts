import { bandera, resourceId } from '#controllers/catalogos_controller'
import ParametroHidricoService from '#services/parametro_hidrico_service'
import ReferenciaService from '#services/referencia_service'
import ParametroHidricoTransformer from '#transformers/parametro_hidrico_transformer'
import {
  createParametroValidator,
  listVigenciaValidator,
  updateParametroValidator,
} from '#validators/catalogo'
import type { HttpContext } from '@adonisjs/core/http'

export default class ParametrosHidricosController {
  async opciones({ serialize }: HttpContext) {
    const unidades = await new ReferenciaService().unidades()
    return serialize({ unidades })
  }

  async index({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(listVigenciaValidator, {
      data: {
        includeInactive: bandera(request.input('includeInactive')),
        versionId: request.input('versionId'),
      },
    })
    const parametros = await new ParametroHidricoService().list(
      query.includeInactive ?? false,
      query.versionId
    )
    return serialize(ParametroHidricoTransformer.transform(parametros))
  }

  async show({ params, serialize }: HttpContext) {
    const parametro = await new ParametroHidricoService().show(
      resourceId(params.id, 'El parámetro hídrico no existe')
    )
    return serialize(ParametroHidricoTransformer.transform(parametro))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createParametroValidator)
    const parametro = await new ParametroHidricoService().create(payload)
    return serialize(ParametroHidricoTransformer.transform(parametro))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateParametroValidator)
    const parametro = await new ParametroHidricoService().update(
      resourceId(params.id, 'El parámetro hídrico no existe'),
      payload
    )
    return serialize(ParametroHidricoTransformer.transform(parametro))
  }
}
