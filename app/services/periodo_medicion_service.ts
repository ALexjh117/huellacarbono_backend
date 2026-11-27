import DatoActividadCarbono from '#models/dato_actividad_carbono'
import Organizacion from '#models/organizacion'
import PeriodoMedicion from '#models/periodo_medicion'
import { exigirAccesoOrganizacion } from '#services/access_control'
import { aFecha } from '#services/catalogo_reglas'
import { rethrowDatabaseError } from '#services/database_error'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

type Payload = {
  nombre?: string
  fechaInicio?: string
  fechaFin?: string
  estado?: string
}

export default class PeriodoMedicionService {
  async list(usuarioId: number, organizacionId: number) {
    await this.exigirOrganizacion(usuarioId, organizacionId)
    return PeriodoMedicion.query().where('organizacionId', organizacionId).orderBy('fechaInicio', 'desc')
  }

  async create(usuarioId: number, organizacionId: number, payload: Payload) {
    await this.exigirOrganizacion(usuarioId, organizacionId, true)
    const nombre = payload.nombre!.trim()
    const fechaInicio = aFecha(payload.fechaInicio!)
    const fechaFin = aFecha(payload.fechaFin!)
    this.assertRango(fechaInicio, fechaFin)
    await this.assertNombreLibre(organizacionId, nombre)
    await this.assertSinCruce(organizacionId, fechaInicio, fechaFin)

    try {
      return await PeriodoMedicion.create({
        organizacionId,
        nombre,
        fechaInicio,
        fechaFin,
        estado: 'ABIERTO',
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el periodo')
    }
  }

  async update(usuarioId: number, id: number, payload: Payload) {
    const periodo = await PeriodoMedicion.find(id)
    if (!periodo) {
      throw new Exception('El periodo no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    await exigirAccesoOrganizacion(usuarioId, periodo.organizacionId)
    if (periodo.estado === 'BLOQUEADO' && payload.estado !== undefined && payload.estado !== 'BLOQUEADO') {
      throw new Exception('Un periodo bloqueado no se puede reabrir', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    const nombre = payload.nombre?.trim() ?? periodo.nombre
    const fechaInicio = payload.fechaInicio ? aFecha(payload.fechaInicio) : periodo.fechaInicio
    const fechaFin = payload.fechaFin ? aFecha(payload.fechaFin) : periodo.fechaFin
    this.assertRango(fechaInicio, fechaFin)

    if (payload.nombre !== undefined) {
      await this.assertNombreLibre(periodo.organizacionId, nombre, periodo.id)
    }
    if (payload.fechaInicio !== undefined || payload.fechaFin !== undefined) {
      await this.assertSinCruce(periodo.organizacionId, fechaInicio, fechaFin, periodo.id)
      await this.assertDatosDentro(periodo.id, fechaInicio, fechaFin)
    }

    periodo.nombre = nombre
    periodo.fechaInicio = fechaInicio
    periodo.fechaFin = fechaFin
    if (payload.estado !== undefined) periodo.estado = payload.estado

    try {
      await periodo.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el periodo')
    }

    return periodo
  }

  private async exigirOrganizacion(usuarioId: number, organizacionId: number, activa = false) {
    await exigirAccesoOrganizacion(usuarioId, organizacionId)
    const organizacion = await Organizacion.find(organizacionId)
    if (!organizacion) {
      throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    if (activa && !organizacion.estado) {
      throw new Exception('La organización está inactiva', { status: 409, code: 'E_CONFLICT' })
    }
  }

  private assertRango(inicio: DateTime, fin: DateTime) {
    const desde = inicio.toISODate()
    const hasta = fin.toISODate()
    if (!desde || !hasta || hasta < desde) {
      throw new Exception('La fecha fin no puede ser anterior a la fecha de inicio', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }
  }

  private async assertNombreLibre(organizacionId: number, nombre: string, exceptoId?: number) {
    const consulta = PeriodoMedicion.query()
      .where('organizacionId', organizacionId)
      .whereRaw('lower(nombre) = lower(?)', [nombre])
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception('Esa organización ya tiene un periodo con ese nombre', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }

  private async assertSinCruce(
    organizacionId: number,
    inicio: DateTime,
    fin: DateTime,
    exceptoId?: number
  ) {
    const consulta = PeriodoMedicion.query()
      .where('organizacionId', organizacionId)
      .where('fechaInicio', '<=', fin.toISODate()!)
      .where('fechaFin', '>=', inicio.toISODate()!)
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception('Ese periodo se cruza con otro de la misma organización', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }
  }

  private async assertDatosDentro(periodoId: number, inicio: DateTime, fin: DateTime) {
    const desde = inicio.toISODate()
    const hasta = fin.toISODate()
    const carbono = await DatoActividadCarbono.query()
      .where('periodoId', periodoId)
      .whereNotNull('fechaDato')
      .where((filtro) => {
        filtro.where('fechaDato', '<', desde!).orWhere('fechaDato', '>', hasta!)
      })
      .first()
    const hidrico = await db
      .from('dato_hidrico')
      .where('id_periodo', periodoId)
      .whereNotNull('fecha_dato')
      .where((filtro) => {
        filtro.where('fecha_dato', '<', desde!).orWhere('fecha_dato', '>', hasta!)
      })
      .first()

    if (carbono || hidrico) {
      throw new Exception('Hay consumos con fecha fuera del nuevo rango del periodo', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }
  }
}
