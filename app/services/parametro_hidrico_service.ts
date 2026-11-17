import ParametroHidrico from '#models/parametro_hidrico'
import { rethrowDatabaseError } from '#services/database_error'
import {
  aFecha,
  assertVigencia,
  estaEnUso,
  exigirActivo,
  fechaTexto,
  limpiar,
  normalizarCodigo,
} from '#services/catalogo_reglas'
import { Exception } from '@adonisjs/core/exceptions'
import type { DateTime } from 'luxon'

type Payload = {
  versionId?: number
  unidadId?: number | null
  codigo?: string
  nombre?: string
  valor?: string
  fuente?: string | null
  fechaInicioVigencia?: string
  fechaFinVigencia?: string | null
  active?: boolean
}

const USO = [{ tabla: 'calculo_hidrico_parametro', columna: 'id_parametro_hidrico' }]

function conRelaciones() {
  return ParametroHidrico.query()
    .preload('unidad')
    .preload('version', (version) => {
      version.preload('metodologia')
    })
}

export default class ParametroHidricoService {
  async list(includeInactive: boolean, versionId?: number) {
    const parametros = conRelaciones().orderBy('nombre', 'asc')
    if (versionId) parametros.where('versionId', versionId)
    if (!includeInactive) parametros.where('estado', true)
    return parametros
  }

  async show(id: number) {
    const parametro = await conRelaciones().where('id', id).first()
    if (!parametro) {
      throw new Exception('El parámetro hídrico no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return parametro
  }

  async create(payload: Payload) {
    await this.exigirVersion(payload.versionId!)
    if (payload.unidadId) await this.exigirUnidad(payload.unidadId)
    const codigo = normalizarCodigo(payload.codigo!)
    const inicio = aFecha(payload.fechaInicioVigencia!)
    const fin = payload.fechaFinVigencia ? aFecha(payload.fechaFinVigencia) : null
    assertVigencia(inicio, fin)
    await this.assertUnico(payload.versionId!, codigo, inicio)

    try {
      const parametro = await ParametroHidrico.create({
        versionId: payload.versionId!,
        unidadId: payload.unidadId ?? null,
        codigo,
        nombre: payload.nombre!.trim(),
        valor: payload.valor!,
        fuente: limpiar(payload.fuente) ?? null,
        fechaInicioVigencia: inicio,
        fechaFinVigencia: fin,
        estado: true,
      })
      return this.show(parametro.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el parámetro hídrico')
    }
  }

  async update(id: number, payload: Payload) {
    const parametro = await ParametroHidrico.find(id)
    if (!parametro) {
      throw new Exception('El parámetro hídrico no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    if (payload.active === false && !parametro.estado) {
      throw new Exception('El parámetro hídrico ya está inactivo', { status: 409, code: 'E_CONFLICT' })
    }

    if (payload.active === false && (await estaEnUso(parametro.id, USO))) {
      throw new Exception('Este parámetro ya se aplicó en un cálculo', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    const versionId = payload.versionId ?? parametro.versionId
    const unidadId = payload.unidadId !== undefined ? payload.unidadId : parametro.unidadId
    const reactiva = payload.active === true && !parametro.estado

    if (payload.versionId !== undefined || reactiva) await this.exigirVersion(versionId)
    if ((payload.unidadId || reactiva) && unidadId) await this.exigirUnidad(unidadId)

    const codigo = payload.codigo !== undefined ? normalizarCodigo(payload.codigo) : parametro.codigo
    const inicio =
      payload.fechaInicioVigencia !== undefined
        ? aFecha(payload.fechaInicioVigencia)
        : parametro.fechaInicioVigencia
    const fin =
      payload.fechaFinVigencia !== undefined
        ? payload.fechaFinVigencia
          ? aFecha(payload.fechaFinVigencia)
          : null
        : parametro.fechaFinVigencia
    assertVigencia(inicio, fin)

    if (
      payload.codigo !== undefined ||
      payload.fechaInicioVigencia !== undefined ||
      payload.versionId !== undefined
    ) {
      await this.assertUnico(versionId, codigo, inicio, parametro.id)
    }

    parametro.merge({
      versionId,
      unidadId,
      codigo,
      nombre: payload.nombre !== undefined ? payload.nombre.trim() : parametro.nombre,
      valor: payload.valor ?? parametro.valor,
      fuente: payload.fuente !== undefined ? (limpiar(payload.fuente) ?? null) : parametro.fuente,
      fechaInicioVigencia: inicio,
      fechaFinVigencia: fin,
      estado: payload.active ?? parametro.estado,
    })

    try {
      await parametro.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el parámetro hídrico')
    }

    return this.show(parametro.id)
  }

  private async exigirVersion(id: number) {
    await exigirActivo(
      'metodologia_version',
      'id_version',
      id,
      'La versión no existe',
      'La versión está inactiva'
    )
  }

  private async exigirUnidad(id: number) {
    await exigirActivo(
      'unidad_medida',
      'id_unidad',
      id,
      'La unidad de medida no existe',
      'La unidad de medida está inactiva'
    )
  }

  private async assertUnico(versionId: number, codigo: string, inicio: DateTime, exceptoId?: number) {
    const dia = fechaTexto(inicio)
    if (!dia) {
      throw new Exception('Usa una fecha válida con el formato AAAA-MM-DD', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    const consulta = ParametroHidrico.query()
      .where('versionId', versionId)
      .whereRaw('lower(codigo) = lower(?)', [codigo])
      .whereRaw('fecha_inicio_vigencia = ?', [dia])
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception('Ya existe ese parámetro para la misma versión y fecha de inicio', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }
}
