import { resourceId } from '#controllers/catalogos_controller'
import CoberturaFactoresService from '#services/cobertura_factores_service'
import ImportacionFactorService from '#services/importacion_factor_service'
import ImportacionFactorTransformer from '#transformers/importacion_factor_transformer'
import {
  coberturaValidator,
  listImportacionesValidator,
  previsualizarImportacionValidator,
} from '#validators/importacion_factor'
import type { HttpContext } from '@adonisjs/core/http'

const NO_EXISTE = 'La importación no existe'

export default class ImportacionesFactorController {
  async index({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(listImportacionesValidator, {
      data: { versionId: request.input('versionId') },
    })
    const importaciones = await new ImportacionFactorService().list(query.versionId)
    return serialize(ImportacionFactorTransformer.transform(importaciones))
  }

  async show({ params, serialize }: HttpContext) {
    const importacion = await new ImportacionFactorService().show(resourceId(params.id, NO_EXISTE))
    return serialize(ImportacionFactorTransformer.transform(importacion))
  }

  /** Evalúa el archivo y guarda la previsualización; no crea factores. */
  async previsualizar({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(previsualizarImportacionValidator)
    const importacion = await new ImportacionFactorService().previsualizar(
      auth.getUserOrFail().id,
      payload
    )
    return serialize(ImportacionFactorTransformer.transform(importacion))
  }

  async aplicar({ params, serialize }: HttpContext) {
    const importacion = await new ImportacionFactorService().aplicar(
      resourceId(params.id, NO_EXISTE)
    )
    return serialize(ImportacionFactorTransformer.transform(importacion))
  }

  async rechazar({ params, serialize }: HttpContext) {
    const importacion = await new ImportacionFactorService().rechazar(
      resourceId(params.id, NO_EXISTE)
    )
    return serialize(ImportacionFactorTransformer.transform(importacion))
  }

  async cobertura({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(coberturaValidator, {
      data: { versionId: request.input('versionId') },
    })
    return serialize(await new CoberturaFactoresService().cobertura(query.versionId))
  }
}
