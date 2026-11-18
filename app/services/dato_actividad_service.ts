import Actividad from '#models/actividad'
import AlcanceEmision from '#models/alcance_emision'
import DatoActividadCarbono from '#models/dato_actividad_carbono'
import FuenteEmision from '#models/fuente_emision'
import Organizacion from '#models/organizacion'
import PeriodoMedicion from '#models/periodo_medicion'
import UnidadMedida from '#models/unidad_medida'
import { rethrowDatabaseError } from '#services/database_error'
import { Exception } from '@adonisjs/core/exceptions'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

export type ListFilters = {
  projectId: number
  periodId?: number
  activityId?: number
  emissionSourceId?: number
  scopeId?: number
}

export type CreateDatoPayload = {
  projectId: number
  activityId: number
  periodId: number
  emissionSourceId: number
  scopeId: number
  unitId: number
  /** DECIMAL(24, 8): siempre cadena para conservar la precisión original. */
  quantity: string
  whatToCopy: string
  document: string
}

export type UpdateDatoPayload = Partial<CreateDatoPayload>

/** Excepción 422 reutilizable para toda validación de pertenencia. */
function invalido(mensaje: string): never {
  throw new Exception(mensaje, { status: 422, code: 'E_VALIDATION_ERROR' })
}

/** Precarga el grafo completo que consume el transformer (una sola consulta por relación). */
function conRelaciones(query: ModelQueryBuilderContract<typeof DatoActividadCarbono>) {
  return query
    .preload('actividad', (actividad) => actividad.preload('proceso'))
    .preload('periodo')
    .preload('fuenteEmision')
    .preload('alcance')
    .preload('unidadMedida')
    .preload('usuario')
}

/**
 * Servicio de datos de actividad.
 *
 * Reglas de negocio aplicadas aquí (no en el controller):
 *
 *  - El registro pertenece a un proyecto (= `organizacion`). Se deriva por la
 *    actividad (actividad → proceso → sede → organizacion) y por el periodo
 *    (periodo → organizacion); ambos deben apuntar al mismo proyecto.
 *  - Actividad y periodo de una actualización sólo pueden cambiar dentro del
 *    proyecto original del registro.
 *  - Las fuentes, alcances y unidades son catálogos globales: sólo se exige
 *    que existan y estén activos.
 *  - No se calcula ninguna emisión: sólo se guarda la cantidad original.
 *
 * Cada operación escribe una sola fila y la integridad de relaciones la
 * garantizan las claves foráneas (`ON DELETE RESTRICT`), por lo que no se
 * requieren transacciones.
 */
export default class DatoActividadService {
  async list(filters: ListFilters) {
    const query = DatoActividadCarbono.query()
      .whereHas('actividad', (actividad) =>
        actividad
          .where('estado', true)
          .whereHas('proceso', (proceso) =>
            proceso.whereHas('sede', (sede) => sede.where('organizacionId', filters.projectId))
          )
      )
      .orderBy('fecha_registro', 'desc')
      .orderBy('id', 'desc')

    if (filters.periodId !== undefined) {
      query.where('idPeriodo', filters.periodId)
    }
    if (filters.activityId !== undefined) {
      query.where('idActividad', filters.activityId)
    }
    if (filters.emissionSourceId !== undefined) {
      query.where('idFuenteEmision', filters.emissionSourceId)
    }
    if (filters.scopeId !== undefined) {
      query.where('idAlcance', filters.scopeId)
    }

    return conRelaciones(query)
  }

  async show(id: number) {
    const registro = await conRelaciones(DatoActividadCarbono.query().where('id', id)).first()
    if (!registro) {
      throw new Exception('El dato de actividad no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return registro
  }

  async create(payload: CreateDatoPayload, actorId: number) {
    await this.assertProyecto(payload.projectId)
    await this.assertActividad(payload.activityId, payload.projectId)
    await this.assertPeriodo(payload.periodId, payload.projectId)
    await this.assertFuente(payload.emissionSourceId)
    await this.assertAlcance(payload.scopeId)
    await this.assertUnidad(payload.unitId)

    try {
      const registro = await DatoActividadCarbono.create({
        idActividad: payload.activityId,
        idPeriodo: payload.periodId,
        idFuenteEmision: payload.emissionSourceId,
        idAlcance: payload.scopeId,
        idUnidad: payload.unitId,
        idUsuarioRegistro: actorId,
        cantidad: payload.quantity,
        queSeCopia: payload.whatToCopy,
        fuenteDato: payload.document,
        estadoRegistro: 'REGISTRADO',
      })

      return await this.show(registro.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo registrar el dato de actividad')
    }
  }

  async update(id: number, payload: UpdateDatoPayload) {
    const registro = await this.show(id)
    // El proyecto del registro se deriva de su periodo (FK directa).
    const proyectoActual = registro.periodo.idOrganizacion

    if (payload.projectId !== undefined && payload.projectId !== proyectoActual) {
      invalido('El dato de actividad pertenece a otro proyecto')
    }

    if (payload.activityId !== undefined) {
      await this.assertActividad(payload.activityId, proyectoActual)
    }
    if (payload.periodId !== undefined) {
      await this.assertPeriodo(payload.periodId, proyectoActual)
    }
    if (payload.emissionSourceId !== undefined) {
      await this.assertFuente(payload.emissionSourceId)
    }
    if (payload.scopeId !== undefined) {
      await this.assertAlcance(payload.scopeId)
    }
    if (payload.unitId !== undefined) {
      await this.assertUnidad(payload.unitId)
    }

    if (payload.activityId !== undefined) registro.idActividad = payload.activityId
    if (payload.periodId !== undefined) registro.idPeriodo = payload.periodId
    if (payload.emissionSourceId !== undefined) registro.idFuenteEmision = payload.emissionSourceId
    if (payload.scopeId !== undefined) registro.idAlcance = payload.scopeId
    if (payload.unitId !== undefined) registro.idUnidad = payload.unitId
    if (payload.quantity !== undefined) registro.cantidad = payload.quantity
    if (payload.whatToCopy !== undefined) registro.queSeCopia = payload.whatToCopy
    if (payload.document !== undefined) registro.fuenteDato = payload.document

    try {
      await registro.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el dato de actividad')
    }

    return this.show(registro.id)
  }

  /**
   * Borrado físico (convención del esquema: `ON DELETE RESTRICT`). Si el
   * registro ya fue referenciado por un cálculo, la base de datos lo impide
   * y la API responde 409 `E_RELATION_CONSTRAINT`.
   */
  async delete(id: number) {
    const registro = await this.show(id)

    try {
      await registro.delete()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo eliminar el dato de actividad')
    }

    return registro
  }

  // --------------------------------------------------------------------------
  // Validaciones de pertenencia y de catálogo
  // --------------------------------------------------------------------------

  /** El proyecto (organización) debe existir y estar activo. */
  private async assertProyecto(projectId: number) {
    const proyecto = await Organizacion.query().where('id', projectId).where('estado', true).first()
    if (!proyecto) {
      invalido('El proyecto seleccionado no existe o está inactivo')
    }
  }

  /** La actividad debe estar activa y colgar de una sede del proyecto. */
  private async assertActividad(activityId: number, projectId: number) {
    const actividad = await Actividad.query()
      .where('id', activityId)
      .where('estado', true)
      .whereHas('proceso', (proceso) =>
        proceso.whereHas('sede', (sede) => sede.where('organizacionId', projectId))
      )
      .first()

    if (!actividad) {
      invalido('La actividad no pertenece al proyecto seleccionado o está inactiva')
    }
  }

  /** El periodo debe colgar directamente del proyecto. */
  private async assertPeriodo(periodId: number, projectId: number) {
    const periodo = await PeriodoMedicion.query()
      .where('id', periodId)
      .where('idOrganizacion', projectId)
      .first()

    if (!periodo) {
      invalido('El periodo no pertenece al proyecto seleccionado')
    }
  }

  /** Fuente, alcance y unidad son catálogos globales: sólo existencia + activo. */
  private async assertFuente(emissionSourceId: number) {
    const fuente = await FuenteEmision.query()
      .where('id', emissionSourceId)
      .where('estado', true)
      .first()
    if (!fuente) {
      invalido('La fuente de emisión no existe o está inactiva')
    }
  }

  private async assertAlcance(scopeId: number) {
    const alcance = await AlcanceEmision.query().where('id', scopeId).where('estado', true).first()
    if (!alcance) {
      invalido('El alcance no existe o está inactivo')
    }
  }

  private async assertUnidad(unitId: number) {
    const unidad = await UnidadMedida.query().where('id', unitId).where('estado', true).first()
    if (!unidad) {
      invalido('La unidad de medida no existe o está inactiva')
    }
  }
}
