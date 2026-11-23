import { createHash } from 'node:crypto'
import FactorEmision from '#models/factor_emision'
import FuenteEmision from '#models/fuente_emision'
import ImportacionFactor from '#models/importacion_factor'
import ImportacionFactorDetalle, {
  type AccionImportacion,
} from '#models/importacion_factor_detalle'
import UnidadMedida from '#models/unidad_medida'
import { rethrowDatabaseError } from '#services/database_error'
import FactorEmisionService from '#services/factor_emision_service'
import { filaImportacionValidator } from '#validators/importacion_factor'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { errors as vineErrors } from '@vinejs/vine'
import { DateTime } from 'luxon'

type Encabezado = {
  versionId: number
  origen: string
  referencia: string
  archivo?: string | null
  filas: Record<string, unknown>[]
}

type FactorNuevo = Awaited<ReturnType<FactorEmisionService['validarNuevo']>>

type FilaEvaluada = {
  fila: number
  datos: Record<string, unknown>
  accion: Exclude<AccionImportacion, 'ACTUALIZAR'>
  mensaje: string | null
  codigo: string | null
  fuenteEmisionId: number | null
  factor: FactorNuevo | null
}

/** Datos mínimos para comparar dos filas del mismo archivo. */
export type FilaComparable = {
  fila: number
  versionId: number
  fuenteEmisionId: number
  unidadEntradaId: number
  codigo: string
  gas: string
  gasEspecifico: string | null
  region: string | null
  sectorCategoria: string | null
  anioAplicacion: number | null
  inicio: string
  fin: string | null
}

const normalizarDimension = (valor: string | null | undefined) =>
  (valor ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase()

/** Vigencias inclusivas; una fecha final nula significa «sin fin». */
export function vigenciasSeSolapan(
  inicioA: string,
  finA: string | null,
  inicioB: string,
  finB: string | null
) {
  return inicioA <= (finB ?? '9999-12-31') && inicioB <= (finA ?? '9999-12-31')
}

/**
 * Detecta, dentro del mismo archivo, las filas que repiten código y fecha de
 * inicio o que duplican las dimensiones de otra con vigencia superpuesta.
 * Usa la misma equivalencia que el servicio y el trigger de PostgreSQL. La
 * primera aparición se conserva; las siguientes se informan como duplicadas.
 */
export function conflictosInternos(filas: FilaComparable[]) {
  const conflictos = new Map<number, string>()
  const aceptadas: FilaComparable[] = []
  for (const actual of filas) {
    const previa = aceptadas.find((otra) => {
      const mismoCodigo =
        otra.versionId === actual.versionId &&
        otra.codigo.toUpperCase() === actual.codigo.toUpperCase() &&
        otra.inicio === actual.inicio
      const mismasDimensiones =
        otra.versionId === actual.versionId &&
        otra.fuenteEmisionId === actual.fuenteEmisionId &&
        otra.unidadEntradaId === actual.unidadEntradaId &&
        otra.gas === actual.gas &&
        (otra.gasEspecifico ?? '') === (actual.gasEspecifico ?? '') &&
        normalizarDimension(otra.region) === normalizarDimension(actual.region) &&
        normalizarDimension(otra.sectorCategoria) === normalizarDimension(actual.sectorCategoria) &&
        (otra.anioAplicacion ?? null) === (actual.anioAplicacion ?? null) &&
        vigenciasSeSolapan(otra.inicio, otra.fin, actual.inicio, actual.fin)
      return mismoCodigo || mismasDimensiones
    })
    if (previa) {
      conflictos.set(
        actual.fila,
        `Duplica la fila ${previa.fila} del mismo archivo (mismo código y fecha de inicio, o mismas condiciones con vigencia superpuesta)`
      )
    } else {
      aceptadas.push(actual)
    }
  }
  return conflictos
}

/** JSON con claves ordenadas: el mismo contenido produce siempre el mismo hash. */
function jsonEstable(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(jsonEstable).join(',')}]`
  if (valor && typeof valor === 'object') {
    return `{${Object.keys(valor as Record<string, unknown>)
      .sort()
      .map(
        (clave) =>
          `${JSON.stringify(clave)}:${jsonEstable((valor as Record<string, unknown>)[clave])}`
      )
      .join(',')}}`
  }
  return JSON.stringify(valor ?? null)
}

function mensajeDe(error: unknown) {
  if (error instanceof vineErrors.E_VALIDATION_ERROR) {
    const mensajes = (error.messages as { field: string; message: string }[]).map(
      (item) => `${item.field}: ${item.message}`
    )
    return mensajes.join('; ')
  }
  return error instanceof Error ? error.message : 'Fila inválida'
}

/**
 * Importación de factores en dos pasos: previsualizar (no crea factores) y
 * aplicar (crea todos los válidos en una sola transacción, en estado
 * PENDIENTE). Nunca aprueba factores ni sobrescribe factores existentes.
 */
export default class ImportacionFactorService {
  private readonly factores = new FactorEmisionService()

  async previsualizar(usuarioId: number, encabezado: Encabezado) {
    const hash = createHash('sha256')
      .update(jsonEstable({ versionId: encabezado.versionId, filas: encabezado.filas }))
      .digest('hex')
    const previa = await ImportacionFactor.findBy('hash', hash)
    if (previa) {
      throw new Exception(
        `Este mismo contenido ya se cargó en la importación ${previa.id} (estado ${previa.estado})`,
        { status: 409, code: 'E_DUPLICATE' }
      )
    }

    const evaluadas = await this.evaluar(encabezado)
    const porInsertar = evaluadas.filter((fila) => fila.accion === 'INSERTAR').length
    const duplicados = evaluadas.filter((fila) => fila.accion === 'DUPLICADO').length
    const rechazados = evaluadas.filter((fila) => fila.accion === 'RECHAZADO').length

    try {
      const importacion = await db.transaction(async (trx) => {
        const creada = await ImportacionFactor.create(
          {
            usuarioId,
            origen: encabezado.origen.trim(),
            referencia: encabezado.referencia.trim(),
            archivo: encabezado.archivo?.trim() || null,
            hash,
            estado: 'PREVISUALIZADA',
            totalFilas: evaluadas.length,
            insertados: 0,
            actualizados: 0,
            duplicados,
            rechazados,
            resumen: { versionId: encabezado.versionId, porInsertar, duplicados, rechazados },
            errores: null,
          },
          { client: trx }
        )
        for (const fila of evaluadas) {
          await ImportacionFactorDetalle.create(
            {
              importacionId: creada.id,
              fila: fila.fila,
              accion: fila.accion,
              codigo: fila.codigo,
              fuenteEmisionId: fila.fuenteEmisionId,
              factorEmisionId: null,
              mensaje: fila.mensaje,
              datos: fila.datos,
            },
            { client: trx }
          )
        }
        return creada
      })
      return this.show(importacion.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo registrar la previsualización de la importación')
    }
  }

  async aplicar(id: number) {
    const importacion = await this.show(id)
    if (importacion.estado !== 'PREVISUALIZADA') {
      throw new Exception(`La importación está ${importacion.estado} y no se puede aplicar`, {
        status: 409,
        code: 'E_CONFLICT',
      })
    }
    const versionId = Number(importacion.resumen?.versionId)
    const pendientes = importacion.detalles.filter((detalle) => detalle.accion === 'INSERTAR')
    if (!pendientes.length) {
      throw new Exception('La importación no tiene filas válidas para insertar', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }

    // Revalida contra el estado actual de la base: pudo cambiar desde la previsualización.
    const revalidadas = await this.evaluar(
      {
        versionId,
        origen: importacion.origen,
        referencia: importacion.referencia ?? '',
        filas: pendientes.map((detalle) => detalle.datos ?? {}),
      },
      pendientes.map((detalle) => detalle.fila)
    )
    const fallidas = revalidadas.filter((fila) => fila.accion !== 'INSERTAR')
    if (fallidas.length) {
      throw new Exception(
        `No se aplicó nada: ${fallidas.length} fila(s) ya no son válidas (${fallidas
          .map((fila) => `fila ${fila.fila}: ${fila.mensaje}`)
          .join(' | ')}). Previsualice de nuevo.`,
        { status: 409, code: 'E_CONFLICT' }
      )
    }

    // Todo o nada: si cualquier inserción falla (p. ej. el trigger de
    // solapamiento detecta una carga concurrente), se revierte la operación
    // completa y la importación sigue PREVISUALIZADA.
    try {
      await db.transaction(async (trx) => {
        const bloqueada = await this.bloquearPrevisualizada(trx, importacion.id, 'aplicar')
        for (const fila of revalidadas) {
          const factor = await FactorEmision.create(
            { ...fila.factor!, importacionId: importacion.id },
            { client: trx }
          )
          await ImportacionFactorDetalle.query({ client: trx })
            .where('importacionId', importacion.id)
            .where('fila', fila.fila)
            .update({ id_factor_emision: factor.id })
        }
        // PARCIAL: el archivo traía filas descartadas desde la previsualización.
        bloqueada.estado = bloqueada.duplicados + bloqueada.rechazados > 0 ? 'PARCIAL' : 'APLICADA'
        bloqueada.insertados = revalidadas.length
        bloqueada.fechaAplicacion = DateTime.utc()
        await bloqueada.save()
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo aplicar la importación; no se creó ningún factor')
    }
    return this.show(importacion.id)
  }

  async rechazar(id: number) {
    await this.show(id)
    await db.transaction(async (trx) => {
      const bloqueada = await this.bloquearPrevisualizada(trx, id, 'rechazar')
      bloqueada.estado = 'RECHAZADA'
      await bloqueada.save()
    })
    return this.show(id)
  }

  /**
   * Bloquea la fila de la importación hasta el fin de la transacción y exige
   * que siga PREVISUALIZADA. Dos solicitudes simultáneas sobre la misma
   * importación se ejecutan una detrás de otra; la segunda recibe 409.
   */
  private async bloquearPrevisualizada(
    trx: TransactionClientContract,
    id: number,
    operacion: 'aplicar' | 'rechazar'
  ) {
    const importacion = await ImportacionFactor.query({ client: trx })
      .where('id', id)
      .forUpdate()
      .firstOrFail()
    if (importacion.estado !== 'PREVISUALIZADA') {
      throw new Exception(`La importación está ${importacion.estado} y no se puede ${operacion}`, {
        status: 409,
        code: 'E_CONFLICT',
      })
    }
    return importacion
  }

  async list(versionId?: number) {
    const consulta = ImportacionFactor.query().orderBy('id', 'desc')
    if (versionId) consulta.whereRaw("(resumen->>'versionId')::bigint = ?", [versionId])
    return consulta
  }

  async show(id: number) {
    const importacion = await ImportacionFactor.query()
      .where('id', id)
      .preload('detalles', (detalles) => detalles.orderBy('fila', 'asc'))
      .first()
    if (!importacion) {
      throw new Exception('La importación no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return importacion
  }

  /**
   * Evalúa cada fila sin escribir: formato, códigos de catálogo, reglas del
   * alta de factores (relaciones, vigencia, unicidad, no solapamiento contra
   * la base) y duplicados dentro del propio archivo.
   */
  private async evaluar(encabezado: Encabezado, numeros?: number[]) {
    const crudas = encabezado.filas.map((datos) => datos ?? {})
    const codigos = (campo: string) => [
      ...new Set(crudas.map((fila) => String(fila[campo] ?? '').trim()).filter((codigo) => codigo)),
    ]
    const [fuentes, unidades] = await Promise.all([
      FuenteEmision.query().whereIn('codigo', codigos('fuenteEmisionCodigo')),
      UnidadMedida.query().whereIn('codigo', [
        ...codigos('unidadEntradaCodigo'),
        ...codigos('unidadSalidaCodigo'),
      ]),
    ])
    const fuentePorCodigo = new Map(fuentes.map((fuente) => [fuente.codigo, fuente]))
    const unidadPorCodigo = new Map(unidades.map((unidad) => [unidad.codigo, unidad]))

    const evaluadas: FilaEvaluada[] = []
    for (const [indice, datos] of crudas.entries()) {
      const numero = numeros?.[indice] ?? indice + 1
      const base = {
        fila: numero,
        datos,
        codigo: typeof datos.codigo === 'string' ? datos.codigo.trim().toUpperCase() : null,
        fuenteEmisionId: null as number | null,
        factor: null,
      }
      try {
        const fila = await filaImportacionValidator.validate(datos)
        const fuente = fuentePorCodigo.get(fila.fuenteEmisionCodigo)
        const entrada = unidadPorCodigo.get(fila.unidadEntradaCodigo)
        const salida = unidadPorCodigo.get(fila.unidadSalidaCodigo)
        const faltantes = [
          !fuente && `la fuente ${fila.fuenteEmisionCodigo}`,
          !entrada && `la unidad de entrada ${fila.unidadEntradaCodigo}`,
          !salida && `la unidad de salida ${fila.unidadSalidaCodigo}`,
        ].filter(Boolean)
        if (faltantes.length) {
          throw new Exception(`No existe en el catálogo: ${faltantes.join(', ')}`, {
            status: 422,
            code: 'E_VALIDATION',
          })
        }
        const factor = await this.factores.validarNuevo({
          versionId: encabezado.versionId,
          fuenteEmisionId: fuente!.id,
          unidadEntradaId: entrada!.id,
          unidadSalidaId: salida!.id,
          codigo: fila.codigo,
          nombre: fila.nombre,
          valor: fila.valor,
          gas: fila.gas,
          gasEspecifico: fila.gasEspecifico ?? null,
          region: fila.region ?? null,
          sectorCategoria: fila.sectorCategoria ?? null,
          fuente: fila.fuente,
          institucionResponsable: fila.institucionResponsable,
          anioPublicacion: fila.anioPublicacion,
          anioAplicacion: fila.anioAplicacion,
          fechaInicioVigencia: fila.fechaInicioVigencia,
          fechaFinVigencia: fila.fechaFinVigencia ?? null,
          origen: encabezado.origen,
        })
        evaluadas.push({
          ...base,
          fuenteEmisionId: fuente!.id,
          accion: 'INSERTAR',
          mensaje: null,
          factor,
        })
      } catch (error) {
        if (!(error instanceof Exception) && !(error instanceof vineErrors.E_VALIDATION_ERROR)) {
          throw error
        }
        const duplicado = error instanceof Exception && error.code === 'E_DUPLICATE'
        evaluadas.push({
          ...base,
          accion: duplicado ? 'DUPLICADO' : 'RECHAZADO',
          mensaje: mensajeDe(error),
        })
      }
    }

    const internos = conflictosInternos(
      evaluadas
        .filter((fila) => fila.accion === 'INSERTAR')
        .map((fila) => ({
          fila: fila.fila,
          versionId: fila.factor!.versionId,
          fuenteEmisionId: fila.factor!.fuenteEmisionId,
          unidadEntradaId: fila.factor!.unidadEntradaId,
          codigo: fila.factor!.codigo,
          gas: fila.factor!.gas,
          gasEspecifico: fila.factor!.gasEspecifico,
          region: fila.factor!.region,
          sectorCategoria: fila.factor!.sectorCategoria,
          anioAplicacion: fila.factor!.anioAplicacion,
          inicio: fila.factor!.fechaInicioVigencia.toISODate()!,
          fin: fila.factor!.fechaFinVigencia?.toISODate() ?? null,
        }))
    )
    for (const fila of evaluadas) {
      const conflicto = internos.get(fila.fila)
      if (conflicto) {
        fila.accion = 'DUPLICADO'
        fila.mensaje = conflicto
        fila.factor = null
      }
    }
    return evaluadas
  }
}
