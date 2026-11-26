import FactorEmision from '#models/factor_emision'
import db from '@adonisjs/lucid/services/db'
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
import UnidadMedida from '#models/unidad_medida'
import MetodologiaVersion from '#models/metodologia_version'
import { resolverMetodologia } from '#services/emissions/calculation_methodologies'
import { validarEspecieGas } from '#services/emissions/gas_validation'

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
  gas?: 'CO2' | 'CH4' | 'N2O' | 'CO2E' | 'OTRO'
  gasEspecifico?: string | null
  institucionResponsable?: string | null
  anioPublicacion?: number | null
  anioAplicacion?: number | null
  sectorCategoria?: string | null
  origen?: string | null
  estadoAprobacion?: 'BORRADOR' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
}

const USO = [{ tabla: 'calculo_carbono_factor', columna: 'id_factor_emision' }]

function conRelaciones() {
  return FactorEmision.query()
    .preload('fuenteEmision')
    .preload('unidadEntrada')
    .preload('unidadSalida')
    .preload('version', (version) => {
      version.preload('metodologia').preload('gwpSet')
    })
    .preload('importacion')
}

function normalizarDimensional(value: string | null | undefined) {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export default class FactorEmisionService {
  async fuentesSinFactor() {
    return db
      .from('fuente_emision as fuente')
      .leftJoin(
        'actividad_emision_fuente as vinculo',
        'vinculo.id_fuente_emision',
        'fuente.id_fuente_emision'
      )
      .leftJoin(
        'actividad_emision as actividad',
        'actividad.id_actividad_emision',
        'vinculo.id_actividad_emision'
      )
      .leftJoin(
        'subcategoria_emision as subcategoria',
        'subcategoria.id_subcategoria',
        'vinculo.id_subcategoria_emision'
      )
      .where('fuente.estado', true)
      .whereNotExists((query) => {
        query
          .from('factor_emision as factor')
          .whereColumn('factor.id_fuente_emision', 'fuente.id_fuente_emision')
          .where('factor.estado', true)
          .where('factor.estado_aprobacion', 'APROBADO')
          .whereRaw('factor.fecha_inicio_vigencia <= CURRENT_DATE')
          .where((anio) =>
            anio
              .whereNull('factor.anio_aplicacion')
              .orWhereRaw('factor.anio_aplicacion = EXTRACT(YEAR FROM CURRENT_DATE)::int')
          )
          .where((vigente) => {
            vigente
              .whereNull('factor.fecha_fin_vigencia')
              .orWhere('factor.fecha_fin_vigencia', '>=', new Date().toISOString().slice(0, 10))
          })
      })
      .select(
        'fuente.id_fuente_emision as fuenteEmisionId',
        'fuente.codigo as fuenteCodigo',
        'fuente.nombre as fuenteNombre',
        'actividad.codigo as actividadCodigo',
        'subcategoria.codigo as subcategoriaCodigo'
      )
      .orderBy('fuente.codigo')
  }

  async list(includeInactive: boolean, versionId?: number, fuenteEmisionId?: number) {
    const factores = conRelaciones().orderBy('nombre', 'asc')
    if (versionId) factores.where('versionId', versionId)
    if (fuenteEmisionId) factores.where('fuenteEmisionId', fuenteEmisionId)
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
    const datos = await this.validarNuevo(payload)
    try {
      const factor = await FactorEmision.create(datos)
      return this.show(factor.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el factor de emisión')
    }
  }

  /**
   * Aplica todas las reglas del alta (relaciones activas, vigencia, año,
   * código único y no solapamiento) y devuelve los atributos normalizados
   * del nuevo factor, siempre en estado PENDIENTE. No escribe nada; lo usan
   * el alta individual y la importación por lotes.
   */
  async validarNuevo(payload: Payload) {
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
    this.assertAnioAplicacion(payload.anioAplicacion ?? null, inicio, fin)
    await this.assertUnico(payload.versionId!, codigo, inicio)
    const gas = payload.gas ?? 'CO2E'
    const gasEspecifico = validarEspecieGas(gas, payload.gasEspecifico)
    await this.assertNoOverlap({
      versionId: payload.versionId!,
      fuenteEmisionId: payload.fuenteEmisionId!,
      unidadEntradaId: payload.unidadEntradaId!,
      gas,
      gasEspecifico,
      region: limpiar(payload.region) ?? null,
      sectorCategoria: limpiar(payload.sectorCategoria) ?? null,
      anioAplicacion: payload.anioAplicacion ?? null,
      inicio,
      fin,
    })

    return {
      versionId: payload.versionId!,
      fuenteEmisionId: payload.fuenteEmisionId!,
      unidadEntradaId: payload.unidadEntradaId!,
      unidadSalidaId: payload.unidadSalidaId!,
      codigo,
      nombre: payload.nombre!.trim(),
      valor: payload.valor!,
      gas,
      gasEspecifico,
      estadoAprobacion: 'PENDIENTE' as const,
      fuente: limpiar(payload.fuente) ?? null,
      region: limpiar(payload.region) ?? null,
      institucionResponsable: limpiar(payload.institucionResponsable) ?? null,
      anioPublicacion: payload.anioPublicacion ?? null,
      anioAplicacion: payload.anioAplicacion ?? null,
      sectorCategoria: limpiar(payload.sectorCategoria) ?? null,
      origen: limpiar(payload.origen) ?? null,
      fechaInicioVigencia: inicio,
      fechaFinVigencia: fin,
      estado: true,
    }
  }

  async update(id: number, payload: Payload) {
    const factor = await FactorEmision.find(id)
    if (!factor) {
      throw new Exception('El factor de emisión no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const used = await estaEnUso(factor.id, USO)
    const changesCalculationTerms =
      payload.versionId !== undefined ||
      payload.fuenteEmisionId !== undefined ||
      payload.unidadEntradaId !== undefined ||
      payload.unidadSalidaId !== undefined ||
      payload.codigo !== undefined ||
      payload.nombre !== undefined ||
      payload.valor !== undefined ||
      payload.fuente !== undefined ||
      payload.region !== undefined ||
      payload.fechaInicioVigencia !== undefined ||
      payload.fechaFinVigencia !== undefined ||
      payload.gas !== undefined ||
      payload.gasEspecifico !== undefined ||
      payload.institucionResponsable !== undefined ||
      payload.anioPublicacion !== undefined ||
      payload.anioAplicacion !== undefined ||
      payload.sectorCategoria !== undefined ||
      payload.origen !== undefined ||
      payload.estadoAprobacion !== undefined
    if (used && changesCalculationTerms) {
      throw new Exception(
        'Este factor ya está trazado en cálculos; crea una nueva versión en lugar de modificarlo',
        {
          status: 409,
          code: 'E_CONFLICT',
        }
      )
    }

    if (payload.active === false && !factor.estado) {
      throw new Exception('El factor de emisión ya está inactivo', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    if (payload.active === false && (await estaEnUso(factor.id, USO))) {
      throw new Exception('Este factor ya se aplicó en un cálculo', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    const versionId = payload.versionId ?? factor.versionId
    const fuenteEmisionId = payload.fuenteEmisionId ?? factor.fuenteEmisionId
    const unidadEntradaId = payload.unidadEntradaId ?? factor.unidadEntradaId
    const unidadSalidaId = payload.unidadSalidaId ?? factor.unidadSalidaId
    const reactiva = payload.active === true && !factor.estado

    if (
      payload.versionId !== undefined ||
      payload.fuenteEmisionId !== undefined ||
      payload.unidadEntradaId !== undefined ||
      payload.unidadSalidaId !== undefined ||
      reactiva
    ) {
      await this.exigirRelaciones(versionId, fuenteEmisionId, unidadEntradaId, unidadSalidaId)
    }

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
    const anioAplicacion =
      payload.anioAplicacion !== undefined ? payload.anioAplicacion : factor.anioAplicacion
    this.assertAnioAplicacion(anioAplicacion, inicio, fin)
    const gas = payload.gas ?? factor.gas
    const gasEspecificoEntrada =
      payload.gasEspecifico !== undefined ? payload.gasEspecifico : factor.gasEspecifico
    const gasEspecifico = validarEspecieGas(gas, gasEspecificoEntrada)
    const region = payload.region !== undefined ? (limpiar(payload.region) ?? null) : factor.region
    const sectorCategoria =
      payload.sectorCategoria !== undefined
        ? (limpiar(payload.sectorCategoria) ?? null)
        : factor.sectorCategoria

    if (
      payload.codigo !== undefined ||
      payload.fechaInicioVigencia !== undefined ||
      payload.versionId !== undefined
    ) {
      await this.assertUnico(versionId, codigo, inicio, factor.id)
    }
    if (
      payload.versionId !== undefined ||
      payload.fuenteEmisionId !== undefined ||
      payload.unidadEntradaId !== undefined ||
      payload.gas !== undefined ||
      payload.gasEspecifico !== undefined ||
      payload.region !== undefined ||
      payload.fechaInicioVigencia !== undefined ||
      payload.fechaFinVigencia !== undefined ||
      payload.anioAplicacion !== undefined ||
      payload.sectorCategoria !== undefined
    ) {
      await this.assertNoOverlap({
        versionId,
        fuenteEmisionId,
        unidadEntradaId,
        gas,
        gasEspecifico: gasEspecifico ?? null,
        region,
        sectorCategoria,
        anioAplicacion: anioAplicacion ?? null,
        inicio,
        fin,
        exceptId: factor.id,
      })
    }

    const estadoAprobacion = payload.estadoAprobacion ?? factor.estadoAprobacion
    if (estadoAprobacion === 'APROBADO') {
      const fuente = payload.fuente !== undefined ? payload.fuente : factor.fuente
      const institucion =
        payload.institucionResponsable !== undefined
          ? payload.institucionResponsable
          : factor.institucionResponsable
      const anio =
        payload.anioPublicacion !== undefined ? payload.anioPublicacion : factor.anioPublicacion
      if (!fuente?.trim() || !institucion?.trim() || !anio || !anioAplicacion) {
        throw new Exception(
          'Para aprobar un factor se requieren referencia bibliográfica, institución, año de publicación y año de aplicación',
          {
            status: 422,
            code: 'E_VALIDATION',
          }
        )
      }
    }

    factor.merge({
      versionId,
      fuenteEmisionId,
      unidadEntradaId,
      unidadSalidaId,
      codigo,
      nombre: payload.nombre !== undefined ? payload.nombre.trim() : factor.nombre,
      valor: payload.valor ?? factor.valor,
      gas,
      gasEspecifico: gasEspecifico ?? null,
      fuente: payload.fuente !== undefined ? (limpiar(payload.fuente) ?? null) : factor.fuente,
      region,
      institucionResponsable:
        payload.institucionResponsable !== undefined
          ? (limpiar(payload.institucionResponsable) ?? null)
          : factor.institucionResponsable,
      anioPublicacion:
        payload.anioPublicacion !== undefined ? payload.anioPublicacion : factor.anioPublicacion,
      anioAplicacion:
        payload.anioAplicacion !== undefined ? payload.anioAplicacion : factor.anioAplicacion,
      sectorCategoria:
        payload.sectorCategoria !== undefined
          ? (limpiar(payload.sectorCategoria) ?? null)
          : factor.sectorCategoria,
      origen: payload.origen !== undefined ? (limpiar(payload.origen) ?? null) : factor.origen,
      estadoAprobacion,
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
    const version = await MetodologiaVersion.query()
      .where('id', versionId)
      .preload('metodologia')
      .firstOrFail()
    if (version.metodologia.tipo !== 'CARBONO') {
      throw new Exception('El factor de emisión debe usar una versión metodológica de carbono', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    const unidadSalida = await UnidadMedida.findOrFail(unidadSalidaId)
    if (
      unidadSalida.magnitud
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase() !== 'masa'
    ) {
      throw new Exception('La unidad de salida del factor debe representar masa', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }

    const unidadEntrada = await UnidadMedida.findOrFail(unidadEntradaId)
    const vinculos = await db
      .from('actividad_emision_fuente as vinculo')
      .join(
        'actividad_emision as actividad',
        'actividad.id_actividad_emision',
        'vinculo.id_actividad_emision'
      )
      .where('vinculo.id_fuente_emision', fuenteEmisionId)
      .where('actividad.estado', true)
      .select('actividad.codigo')
    if (!vinculos.length) {
      throw new Exception('La fuente no está vinculada a una actividad de emisión activa', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    const magnitudEntrada = unidadEntrada.magnitud
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
    const compatible = vinculos.some((vinculo) => {
      try {
        const metodologia = resolverMetodologia(vinculo.codigo)
        return metodologia.magnitudes.includes(magnitudEntrada)
      } catch {
        return false
      }
    })
    if (!compatible) {
      throw new Exception(
        'La unidad de entrada del factor no es compatible con la metodología de la fuente vinculada',
        { status: 422, code: 'E_VALIDATION' }
      )
    }
  }

  private async assertUnico(
    versionId: number,
    codigo: string,
    inicio: DateTime,
    exceptoId?: number
  ) {
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

  private assertAnioAplicacion(
    anio: number | null | undefined,
    inicio: DateTime,
    fin: DateTime | null
  ) {
    if (anio === null || anio === undefined) return
    if (anio < inicio.year || (fin && anio > fin.year)) {
      throw new Exception('El año de aplicación debe estar comprendido en la vigencia del factor', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
  }

  private async assertNoOverlap(input: {
    versionId: number
    fuenteEmisionId: number
    unidadEntradaId: number
    gas: string
    gasEspecifico: string | null
    region: string | null
    sectorCategoria: string | null
    anioAplicacion: number | null
    inicio: DateTime
    fin: DateTime | null
    exceptId?: number
  }) {
    const query = FactorEmision.query()
      .where('versionId', input.versionId)
      .where('fuenteEmisionId', input.fuenteEmisionId)
      .where('unidadEntradaId', input.unidadEntradaId)
      .where('gas', input.gas)
      .whereRaw("COALESCE(gas_especifico, '') = ?", [input.gasEspecifico ?? ''])
      .whereRaw("lower(regexp_replace(btrim(COALESCE(region, '')), '\\s+', ' ', 'g')) = ?", [
        normalizarDimensional(input.region),
      ])
      .whereRaw(
        "lower(regexp_replace(btrim(COALESCE(sector_categoria, '')), '\\s+', ' ', 'g')) = ?",
        [normalizarDimensional(input.sectorCategoria)]
      )

    if (input.anioAplicacion === null) {
      query.whereNull('anio_aplicacion')
    } else {
      query.where('anio_aplicacion', input.anioAplicacion)
    }

    query
      .where('fechaInicioVigencia', '<=', input.fin?.toISODate() ?? '9999-12-31')
      .where((builder) => {
        builder
          .whereNull('fechaFinVigencia')
          .orWhere('fechaFinVigencia', '>=', input.inicio.toISODate()!)
      })
    if (input.exceptId) query.whereNot('id', input.exceptId)
    if (await query.first()) {
      throw new Exception(
        'Ya existe un factor para las mismas condiciones y con vigencia superpuesta',
        {
          status: 409,
          code: 'E_DUPLICATE',
        }
      )
    }
  }
}
