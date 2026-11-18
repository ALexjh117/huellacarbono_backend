import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import AlcanceEmisionService from '#services/alcance_emision_service'
import ComponenteHidricoService from '#services/componente_hidrico_service'
import TipoAguaService from '#services/tipo_agua_service'
import AlcanceEmisionTransformer from '#transformers/alcance_emision_transformer'
import ComponenteHidricoTransformer from '#transformers/componente_hidrico_transformer'
import TipoAguaTransformer from '#transformers/tipo_agua_transformer'
import {
  alcanceEmisionValidators,
  componenteHidricoValidators,
  listCatalogoValidator,
  tipoAguaValidators,
} from '#validators/catalogo'

export function resourceId(value: string, mensaje: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) {
    throw new Exception(mensaje, { status: 404, code: 'E_NOT_FOUND' })
  }
  return id
}

export function bandera(valor: unknown) {
  if (valor === undefined || valor === '') return undefined
  if (valor === true || valor === 'true') return true
  if (valor === false || valor === 'false') return false
  return valor
}

type ServicioCatalogo = {
  list(includeInactive: boolean): Promise<unknown>
  show(id: number): Promise<unknown>
  create(payload: {
    codigo: string
    nombre: string
    descripcion?: string | null
  }): Promise<unknown>
  update(
    id: number,
    payload: {
      codigo?: string
      nombre?: string
      descripcion?: string | null
      active?: boolean
    }
  ): Promise<unknown>
}

type ValidadorCatalogo = {
  create: typeof tipoAguaValidators.create
  update: typeof tipoAguaValidators.update
}

function controladorCatalogo(
  Servicio: new () => ServicioCatalogo,
  transformar: (data: unknown) => unknown,
  validadores: ValidadorCatalogo,
  noExiste: string
) {
  return class {
    async index({ request, serialize }: HttpContext) {
      const query = await request.validateUsing(listCatalogoValidator, {
        data: { includeInactive: bandera(request.input('includeInactive')) },
      })
      const filas = await new Servicio().list(query.includeInactive ?? false)
      return serialize(transformar(filas))
    }

    async show({ params, serialize }: HttpContext) {
      const fila = await new Servicio().show(resourceId(params.id, noExiste))
      return serialize(transformar(fila))
    }

    async store({ request, serialize }: HttpContext) {
      const payload = await request.validateUsing(validadores.create)
      const fila = await new Servicio().create(payload)
      return serialize(transformar(fila))
    }

    async update({ params, request, serialize }: HttpContext) {
      const payload = await request.validateUsing(validadores.update)
      const fila = await new Servicio().update(resourceId(params.id, noExiste), payload)
      return serialize(transformar(fila))
    }
  }
}

function adaptar(transformador: object) {
  const transformar = (
    transformador as { transform: (this: object, data: unknown) => unknown }
  ).transform
  return (data: unknown) => transformar.call(transformador, data)
}

export const TiposAguaController = controladorCatalogo(
  TipoAguaService,
  adaptar(TipoAguaTransformer),
  tipoAguaValidators,
  'El tipo de agua no existe'
)

export const ComponentesHidricosController = controladorCatalogo(
  ComponenteHidricoService,
  adaptar(ComponenteHidricoTransformer),
  componenteHidricoValidators,
  'El componente hídrico no existe'
)

export const AlcancesEmisionController = controladorCatalogo(
  AlcanceEmisionService,
  adaptar(AlcanceEmisionTransformer),
  alcanceEmisionValidators,
  'El alcance de emisión no existe'
)
