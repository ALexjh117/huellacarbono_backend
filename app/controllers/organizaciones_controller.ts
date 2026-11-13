import type { HttpContext } from '@adonisjs/core/http'
import OrganizacionService from '#services/organizacion_service'
import OrganizacionTransformer from '#transformers/organizacion_transformer'
import {
  actualizarOrganizacionValidator,
  crearOrganizacionValidator,
  listarOrganizacionValidator,
} from '#validators/organizacion'

export default class OrganizacionesController {
  private service = new OrganizacionService()

  async index({ request, serialize }: HttpContext) {
    const filtros = await request.validateUsing(listarOrganizacionValidator)
    const organizaciones = await this.service.listar(filtros)
    return serialize(OrganizacionTransformer.transform(organizaciones))
  }

  async show({ params, serialize }: HttpContext) {
    const organizacion = await this.service.obtener(Number(params.id))
    return serialize(OrganizacionTransformer.transform(organizacion))
  }

  async store({ request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(crearOrganizacionValidator)
    const organizacion = await this.service.crear(payload)
    response.created()
    return serialize(OrganizacionTransformer.transform(organizacion))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(actualizarOrganizacionValidator)
    const organizacion = await this.service.actualizar(Number(params.id), payload)
    return serialize(OrganizacionTransformer.transform(organizacion))
  }

  async destroy({ params, response }: HttpContext) {
    await this.service.eliminar(Number(params.id))
    return response.noContent()
  }
}