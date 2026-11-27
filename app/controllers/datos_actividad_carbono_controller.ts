import type UnidadMedida from '#models/unidad_medida'
import DatoActividadCarbonoService from '#services/dato_actividad_carbono_service'
import { fechaTexto } from '#services/catalogo_reglas'
import {
  fichaConCatalogo,
  requisitosCalculoFuente,
} from '#services/emissions/calculation_methodologies'
import DatoActividadCarbonoTransformer from '#transformers/dato_actividad_carbono_transformer'
import {
  createDatoActividadCarbonoValidator,
  listDatoActividadCarbonoValidator,
  opcionesDatoActividadCarbonoValidator,
  updateDatoActividadCarbonoValidator,
} from '#validators/dato_actividad_carbono'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

function unidadSugeridaDe(
  resumen: { unidadEntradaIds: number[] } | null,
  unidades: UnidadMedida[]
) {
  if (!resumen || resumen.unidadEntradaIds.length !== 1) return null
  const unidad = unidades.find((item) => item.id === resumen.unidadEntradaIds[0])
  if (!unidad) return null
  return { id: unidad.id, simbolo: unidad.simbolo, nombre: unidad.nombre }
}

function resourceId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) {
    throw new Exception('El papel de carbono no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  return id
}

export default class DatosActividadCarbonoController {
  async index({ auth, request, serialize }: HttpContext) {
    const query = await request.validateUsing(listDatoActividadCarbonoValidator, {
      data: {
        organizacionId: request.input('organizacionId'),
        periodoId: request.input('periodoId'),
      },
    })
    const datos = await new DatoActividadCarbonoService().list(
      auth.getUserOrFail().id,
      query.organizacionId,
      query.periodoId
    )
    return serialize(DatoActividadCarbonoTransformer.transform(datos))
  }

  async opciones({ auth, request, serialize }: HttpContext) {
    const query = await request.validateUsing(opcionesDatoActividadCarbonoValidator, {
      data: { organizacionId: request.input('organizacionId') },
    })
    const opciones = await new DatoActividadCarbonoService().opciones(
      auth.getUserOrFail().id,
      query.organizacionId
    )
    const codigoPorActividad = new Map(
      opciones.actividadesEmision.map((actividad) => [Number(actividad.id), actividad.codigo])
    )
    const resumenPorFuente = new Map(
      opciones.resumenFactores.map((fila) => [fila.fuenteEmisionId, fila])
    )
    const actividadesPorFuente = new Map<number, string[]>()
    for (const vinculo of opciones.vinculosFuente) {
      const codigo = codigoPorActividad.get(Number(vinculo.actividadEmisionId))
      if (!codigo) continue
      const fuenteId = Number(vinculo.fuenteEmisionId)
      const codigos = actividadesPorFuente.get(fuenteId) ?? []
      if (!codigos.includes(codigo)) codigos.push(codigo)
      actividadesPorFuente.set(fuenteId, codigos)
    }
    return serialize({
      periodos: opciones.periodos.map((periodo) => ({
        id: periodo.id,
        nombre: periodo.nombre,
        fechaInicio: fechaTexto(periodo.fechaInicio),
        fechaFin: fechaTexto(periodo.fechaFin),
        estado: periodo.estado,
      })),
      actividades: opciones.actividades.map((actividad) => ({
        id: actividad.id,
        nombre: actividad.nombre,
        procesoNombre: actividad.proceso.nombre,
      })),
      fuentes: opciones.fuentes.map((fuente) => {
        const resumen = resumenPorFuente.get(fuente.id) ?? null
        const ficha = fichaConCatalogo(
          requisitosCalculoFuente(actividadesPorFuente.get(fuente.id) ?? []),
          resumen
        )
        return {
          id: fuente.id,
          codigo: fuente.codigo,
          nombre: fuente.nombre,
          requisitosCalculo: ficha.requisitos,
          camposParametros: ficha.camposParametros,
          unidadSugerida: unidadSugeridaDe(resumen, opciones.unidades),
        }
      }),
      alcances: opciones.alcances.map((alcance) => ({
        id: alcance.id,
        codigo: alcance.codigo,
        nombre: alcance.nombre,
      })),
      unidades: opciones.unidades.map((unidad) => ({
        id: unidad.id,
        simbolo: unidad.simbolo,
        nombre: unidad.nombre,
      })),
      actividadesEmision: opciones.actividadesEmision.map((actividad) => ({
        id: actividad.id,
        codigo: actividad.codigo,
        nombre: actividad.nombre,
        alcanceId: actividad.alcanceId,
        alcanceCodigo: actividad.alcance.codigo,
      })),
      subcategoriasEmision: opciones.subcategorias.map((subcategoria) => ({
        id: subcategoria.id,
        codigo: subcategoria.codigo,
        nombre: subcategoria.nombre,
        actividadEmisionId: subcategoria.actividadEmisionId,
      })),
      fuentesPorActividadEmision: opciones.vinculosFuente,
    })
  }

  async show({ auth, params, serialize }: HttpContext) {
    const dato = await new DatoActividadCarbonoService().show(
      resourceId(params.id),
      auth.getUserOrFail().id
    )
    return serialize(DatoActividadCarbonoTransformer.transform(dato))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createDatoActividadCarbonoValidator)
    const dato = await new DatoActividadCarbonoService().crear(auth.getUserOrFail().id, payload)
    return serialize(DatoActividadCarbonoTransformer.transform(dato))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateDatoActividadCarbonoValidator)
    const dato = await new DatoActividadCarbonoService().actualizar(
      resourceId(params.id),
      auth.getUserOrFail().id,
      payload
    )
    return serialize(DatoActividadCarbonoTransformer.transform(dato))
  }
}
