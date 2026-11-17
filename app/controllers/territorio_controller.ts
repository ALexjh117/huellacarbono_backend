import TerritorioService from '#services/territorio_service'
import DepartamentoTransformer from '#transformers/departamento_transformer'
import MunicipioTransformer from '#transformers/municipio_transformer'
import { municipiosQueryValidator } from '#validators/territorio'
import type { HttpContext } from '@adonisjs/core/http'

export default class TerritorioController {
  async departamentos({ serialize }: HttpContext) {
    const departamentos = await new TerritorioService().departamentos()
    return serialize(DepartamentoTransformer.transform(departamentos))
  }

  async municipios({ request, serialize }: HttpContext) {
    const { departamentoId } = await request.validateUsing(municipiosQueryValidator, {
      data: { departamentoId: numero(request.input('departamentoId')) },
    })
    const municipios = await new TerritorioService().municipios(departamentoId)
    return serialize(MunicipioTransformer.transform(municipios))
  }
}

function numero(valor: unknown) {
  if (valor === undefined || valor === '') return undefined
  return Number(valor)
}
