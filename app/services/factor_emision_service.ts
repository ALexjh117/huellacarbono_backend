import FactorEmision from '#models/factor_emision'
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
  fuenteEmisionId?: number
  unidadEntradaId?: number
  unidadSalidaId?: number
  codigo?: string
  nombre?: string
  valor?: string
  fuente?: string | null
  region?: string | null
  fechaInicioVigencia?: string
  fechaFinVigencia?: string | null
  active?: boolean
}

const USO = [{ tabla: 'calculo_carbono_factor', columna: 'id_factor_emision' }]

function conRelaciones() {
  return FactorEmision.query()
    .preload('fuenteEmision')
    .preload('unidadEntrada')
    .preload('unidadSalida')
    .preload('version', (version) => {
      version.preload('metodologia')
    })
}

export default class FactorEmisionService {
  async list(includeInactive: boolean, versionId?: number) {
    const factores = conRelaciones().orderBy('nombre', 'asc')
    if (versionId) factores.where('versionId', versionId)
    if (!includeInactive) factores.where('estado', true)
    return factores
  }

  async show(id: number) {
    const factor = await conRelaciones().where('id', id).first()
    if (!factor) {
      throw new Exception('El factor de emisión no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return factor
  }

  async create(payload: Payload) {
    await this.exigirRelaciones(
      payload.versionId!,
      payload.fuenteEmisionId!,
      payload.unidadEntradaId!,
      payload.unidadSalidaId!
    )
    const codigo = normalizarCodigo(payload.codigo!)
    const inicio = aFecha(payload.fechaInicioVigencia!)
    const fin = payload.fechaFinVigencia ? aFecha(payload.fechaFinVigencia) : null
    assertVigencia(inicio, fin)
    await this.assertUnico(payload.versionId!, codigo, inicio)

    try {
      const factor = await FactorEmision.create({
        versionId: payload.versionId!,
        fuenteEmisionId: payload.fuenteEmisionId!,
        unidadEntradaId: payload.unidadEntradaId!,
        unidadSalidaId: payload.unidadSalidaId!,
        codigo,
        nombre: payload.nombre!.trim(),
        valor: payload.valor!,
        fuente: limpiar(payload.fuente) ?? null,
        region: limpiar(payload.region) ?? null,
        fechaInicioVigencia: inicio,
        fechaFinVigencia: fin,
        estado: true,
      })
      return this.show(factor.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el factor de emisión')
    }
  }

  async update(id: number, payload: Payload) {
    const factor = await FactorEmision.find(id)
    if (!factor) {
      throw new Exception('El factor de emisión no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    if (payload.active === false && !factor.estado) {
      throw new Exception('El factor de emisión ya está inactivo', { status: 409, code: 'E_CONFLICT' })
    }

    if (payload.active === false && (await estaEnUso(factor.id, USO))) {
      throw new Exception('Este factor ya se aplicó en un cálculo', { status: 409, code: 'E_CONFLICT' })
    }

    const versionId = payload.versionId ?? factor.versionId
    const fuenteEmisionId = payload.fuenteEmisionId ?? factor.fuenteEmisionId
    const unidadEntradaId = payload.unidadEntradaId ?? factor.unidadEntradaId
    const unidadSalidaId = payload.unidadSalidaId ?? factor.unidadSalidaId
    const reactiva = payload.active === true && !factor.estado

    if (payload.versionId !== undefined || reactiva) {
      await exigirActivo(
        'metodologia_version',
        'id_version',
        versionId,
        'La versión no existe',
        'La versión está inactiva'
      )
    }
    if (payload.fuenteEmisionId !== undefined || reactiva) {
      await exigirActivo(
        'fuente_emision',
        'id_fuente_emision',
        fuenteEmisionId,
        'La fuente de emisión no existe',
        'La fuente de emisión está inactiva'
      )
    }
    if (payload.unidadEntradaId !== undefined || reactiva) {
      await exigirActivo(
        'unidad_medida',
        'id_unidad',
        unidadEntradaId,
        'La unidad de entrada no existe',
        'La unidad de entrada está inactiva'
      )
    }
    if (payload.unidadSalidaId !== undefined || reactiva) {
      await exigirActivo(
        'unidad_medida',
        'id_unidad',
        unidadSalidaId,
        'La unidad de salida no existe',
        'La unidad de salida está inactiva'
      )
    }

    const codigo = payload.codigo !== undefined ? normalizarCodigo(payload.codigo) : factor.codigo
    const inicio =
      payload.fechaInicioVigencia !== undefined
        ? aFecha(payload.fechaInicioVigencia)
        : factor.fechaInicioVigencia
    const fin =
      payload.fechaFinVigencia !== undefined
        ? payload.fechaFinVigencia
          ? aFecha(payload.fechaFinVigencia)
          : null
        : factor.fechaFinVigencia
    assertVigencia(inicio, fin)

    if (
      payload.codigo !== undefined ||
      payload.fechaInicioVigencia !== undefined ||
      payload.versionId !== undefined
    ) {
      await this.assertUnico(versionId, codigo, inicio, factor.id)
    }

    factor.merge({
      versionId,
      fuenteEmisionId,
      unidadEntradaId,
      unidadSalidaId,
      codigo,
      nombre: payload.nombre !== undefined ? payload.nombre.trim() : factor.nombre,
      valor: payload.valor ?? factor.valor,
      fuente: payload.fuente !== undefined ? (limpiar(payload.fuente) ?? null) : factor.fuente,
      region: payload.region !== undefined ? (limpiar(payload.region) ?? null) : factor.region,
      fechaInicioVigencia: inicio,
      fechaFinVigencia: fin,
      estado: payload.active ?? factor.estado,
    })

    try {
      await factor.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el factor de emisión')
    }

    return this.show(factor.id)
  }

  private async exigirRelaciones(
    versionId: number,
    fuenteEmisionId: number,
    unidadEntradaId: number,
    unidadSalidaId: number
  ) {
    await exigirActivo(
      'metodologia_version',
      'id_version',
      versionId,
      'La versión no existe',
      'La versión está inactiva'
    )
    await exigirActivo(
      'fuente_emision',
      'id_fuente_emision',
      fuenteEmisionId,
      'La fuente de emisión no existe',
      'La fuente de emisión está inactiva'
    )
    await exigirActivo(
      'unidad_medida',
      'id_unidad',
      unidadEntradaId,
      'La unidad de entrada no existe',
      'La unidad de entrada está inactiva'
    )
    await exigirActivo(
      'unidad_medida',
      'id_unidad',
      unidadSalidaId,
      'La unidad de salida no existe',
      'La unidad de salida está inactiva'
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
    const consulta = FactorEmision.query()
      .where('versionId', versionId)
      .whereRaw('lower(codigo) = lower(?)', [codigo])
      .whereRaw('fecha_inicio_vigencia = ?', [dia])
    if (exceptoId) consulta.whereNot('id', exceptoId)
    if (await consulta.first()) {
      throw new Exception('Ya existe ese factor para la misma versión y fecha de inicio', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }
}
