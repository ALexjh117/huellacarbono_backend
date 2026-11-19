import CalculoCarbonoService, { periodoVisible } from '#services/calculo_carbono_service'
import CalculoCarbonoTransformer from '#transformers/calculo_carbono_transformer'
import {
  createCalculoCarbonoValidator,
  guardarReduccionValidator,
  listCalculoCarbonoValidator,
  opcionesCalculoCarbonoValidator,
} from '#validators/calculo_carbono'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

function resourceId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) {
    throw new Exception('El cálculo de carbono no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  return id
}

export default class CalculosCarbonoController {
  async index({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(listCalculoCarbonoValidator, {
      data: { organizacionId: request.input('organizacionId') },
    })
    const calculos = await new CalculoCarbonoService().list(query.organizacionId)
    return serialize(CalculoCarbonoTransformer.transform(calculos))
  }

  async opciones({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(opcionesCalculoCarbonoValidator, {
      data: { organizacionId: request.input('organizacionId') },
    })
    const { periodos, versiones } = await new CalculoCarbonoService().opciones(query.organizacionId)
    return serialize({
      periodos: periodos.map(periodoVisible),
      versiones: versiones.map((version) => ({
        id: version.id,
        numeroVersion: version.numeroVersion,
        metodologiaId: version.metodologiaId,
        metodologiaNombre: version.metodologia.nombre,
        fechaInicioVigencia: version.fechaInicioVigencia.toISODate(),
        fechaFinVigencia: version.fechaFinVigencia?.toISODate() ?? null,
      })),
    })
  }

  async show({ params, serialize }: HttpContext) {
    const calculo = await new CalculoCarbonoService().show(resourceId(params.id))
    return serialize(CalculoCarbonoTransformer.transform(calculo))
  }

  async resumen({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(opcionesCalculoCarbonoValidator, {
      data: { organizacionId: request.input('organizacionId') },
    })
    return serialize(await new CalculoCarbonoService().resumen(query.organizacionId))
  }

  async informe({ params, serialize }: HttpContext) {
    return serialize(await new CalculoCarbonoService().informe(resourceId(params.id)))
  }

  async reduccion({ params, serialize }: HttpContext) {
    const acciones = await new CalculoCarbonoService().listarReduccion(resourceId(params.id))
    return serialize({ acciones })
  }

  async guardarReduccion({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(guardarReduccionValidator)
    const acciones = await new CalculoCarbonoService().guardarReduccion(
      resourceId(params.id),
      payload.acciones
    )
    return serialize({ acciones })
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createCalculoCarbonoValidator)
    const calculo = await new CalculoCarbonoService().crear(auth.getUserOrFail().id, payload)
    return serialize(CalculoCarbonoTransformer.transform(calculo))
  }
}
