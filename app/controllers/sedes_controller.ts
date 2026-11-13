import type { HttpContext } from '@adonisjs/core/http'
import SedeService from '#services/sede_service'
import SedeTransformer from '#transformers/sede_transformer'
import {
  actualizarSedeValidator,
  crearSedeValidator,
  listarSedeValidator,
} from '#validators/sede'

export default class SedesController {
  private service = new SedeService()

  async index({ request, serialize }: HttpContext) {
    const filtros = await request.validateUsing(listarSedeValidator)
    const sedes = await this.service.listar(filtros)
    return serialize(SedeTransformer.transform(sedes))
  }

  async show({ params, serialize }: HttpContext) {
    const sede = await this.service.obtener(Number(params.id))
    return serialize(SedeTransformer.transform(sede))
  }

  async store({ request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(crearSedeValidator)
    const sede = await this.service.crear(payload)
    response.created()
    return serialize(SedeTransformer.transform(sede))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(actualizarSedeValidator)
    const sede = await this.service.actualizar(Number(params.id), payload)
    return serialize(SedeTransformer.transform(sede))
  }

  async destroy({ params, response }: HttpContext) {
    await this.service.eliminar(Number(params.id))
    return response.noContent()
  }
}