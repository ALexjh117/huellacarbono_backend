import { bandera, resourceId } from '#controllers/catalogos_controller'
import FactorEmisionService from '#services/factor_emision_service'
import ReferenciaService from '#services/referencia_service'
import FactorEmisionTransformer from '#transformers/factor_emision_transformer'
import {
  createFactorValidator,
  listVigenciaValidator,
  updateFactorValidator,
} from '#validators/catalogo'
import type { HttpContext } from '@adonisjs/core/http'

export default class FactoresEmisionController {
  async opciones({ serialize }: HttpContext) {
    const referencias = new ReferenciaService()
    const fuentes = await referencias.fuentes()
    const unidades = await referencias.unidades()
    return serialize({ fuentes, unidades })
  }

  async index({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(listVigenciaValidator, {
      data: {
        includeInactive: bandera(request.input('includeInactive')),
        versionId: request.input('versionId'),
      },
    })
    const factores = await new FactorEmisionService().list(
      query.includeInactive ?? false,
      query.versionId
    )
    return serialize(FactorEmisionTransformer.transform(factores))
  }

  async show({ params, serialize }: HttpContext) {
    const factor = await new FactorEmisionService().show(
      resourceId(params.id, 'El factor de emisión no existe')
    )
    return serialize(FactorEmisionTransformer.transform(factor))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createFactorValidator)
    const factor = await new FactorEmisionService().create(payload)
    return serialize(FactorEmisionTransformer.transform(factor))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateFactorValidator)
    const factor = await new FactorEmisionService().update(
      resourceId(params.id, 'El factor de emisión no existe'),
      payload
    )
    return serialize(FactorEmisionTransformer.transform(factor))
  }
}
