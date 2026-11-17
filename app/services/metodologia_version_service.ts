import Metodologia from '#models/metodologia'
import MetodologiaVersion from '#models/metodologia_version'
import { rethrowDatabaseError } from '#services/database_error'
import { aFecha, assertVigencia, estaEnUso, limpiar } from '#services/catalogo_reglas'
import { Exception } from '@adonisjs/core/exceptions'

type Payload = {
  numeroVersion?: string
  fechaInicioVigencia?: string
  fechaFinVigencia?: string | null
  descripcion?: string | null
  active?: boolean
}

const USOS = [
  { tabla: 'factor_emision', columna: 'id_version', soloActivos: true },
  { tabla: 'parametro_hidrico', columna: 'id_version', soloActivos: true },
]

export default class MetodologiaVersionService {
  async list(metodologiaId: number, includeInactive: boolean) {
    await this.assertMetodologia(metodologiaId)
    const versiones = MetodologiaVersion.query()
      .where('metodologiaId', metodologiaId)
      .orderBy('fechaInicioVigencia', 'desc')
    if (!includeInactive) versiones.where('estado', true)
    return versiones
  }

  async create(metodologiaId: number, payload: Payload) {
    const metodologia = await this.assertMetodologia(metodologiaId)
    if (!metodologia.estado) {
      throw new Exception('La metodología está inactiva', { status: 409, code: 'E_CONFLICT' })
    }

    const numeroVersion = payload.numeroVersion!.trim()
    const inicio = aFecha(payload.fechaInicioVigencia!)
    const fin = payload.fechaFinVigencia ? aFecha(payload.fechaFinVigencia) : null
    assertVigencia(inicio, fin)
    await this.assertNumeroLibre(metodologiaId, numeroVersion)

    try {
      return await MetodologiaVersion.create({
        metodologiaId,
        numeroVersion,
        fechaInicioVigencia: inicio,
        fechaFinVigencia: fin,
        descripcion: limpiar(payload.descripcion) ?? null,
        estado: true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la versión')
    }
  }

  async update(id: number, payload: Payload) {
    const version = await MetodologiaVersion.find(id)
    if (!version) throw new Exception('La versión no existe', { status: 404, code: 'E_NOT_FOUND' })

    if (payload.active === false && !version.estado) {
      throw new Exception('La versión ya está inactiva', { status: 409, code: 'E_CONFLICT' })
    }

    if (payload.active === false && (await estaEnUso(version.id, USOS))) {
      throw new Exception('Esta versión tiene factores o parámetros activos', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    if (payload.active === true && !version.estado) {
      const metodologia = await this.assertMetodologia(version.metodologiaId)
      if (!metodologia.estado) {
        throw new Exception('La metodología está inactiva', { status: 409, code: 'E_CONFLICT' })
      }
    }

    const numero = payload.numeroVersion?.trim() ?? version.numeroVersion
    if (payload.numeroVersion !== undefined) {
      await this.assertNumeroLibre(version.metodologiaId, numero, version.id)
      version.numeroVersion = numero
    }

    const inicio =
      payload.fechaInicioVigencia !== undefined
        ? aFecha(payload.fechaInicioVigencia)
        : version.fechaInicioVigencia
    const fin =
      payload.fechaFinVigencia !== undefined
        ? payload.fechaFinVigencia
          ? aFecha(payload.fechaFinVigencia)
          : null
        : version.fechaFinVigencia
    assertVigencia(inicio, fin)
    version.fechaInicioVigencia = inicio
    version.fechaFinVigencia = fin

    if (payload.descripcion !== undefined) version.descripcion = limpiar(payload.descripcion) ?? null
    if (payload.active !== undefined) version.estado = payload.active

    try {
      await version.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la versión')
    }

    return version
  }

  private async assertMetodologia(id: number) {
    const metodologia = await Metodologia.find(id)
    if (!metodologia) {
      throw new Exception('La metodología no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return metodologia
  }

  private async assertNumeroLibre(metodologiaId: number, numero: string, exceptoId?: number) {
    const consulta = MetodologiaVersion.query()
      .where('metodologiaId', metodologiaId)
      .whereRaw('lower(numero_version) = lower(?)', [numero])
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception('Ya existe esa versión en la metodología', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }
}
