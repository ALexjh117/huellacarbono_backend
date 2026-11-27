import { decimalTexto, fechaTexto } from '#services/catalogo_reglas'
import { rethrowDatabaseError } from '#services/database_error'
import {
  exigirAccesoOrganizacion,
  obtenerOrganizacionesAutorizadas,
} from '#services/access_control'
import AccionReduccion from '#models/accion_reduccion'
import CalculoCarbono from '#models/calculo_carbono'
import type { FilaOmitida } from '#models/calculo_carbono'
import DatoActividadCarbono from '#models/dato_actividad_carbono'
import FactorEmision from '#models/factor_emision'
import MetodologiaVersion from '#models/metodologia_version'
import Organizacion from '#models/organizacion'
import PeriodoMedicion from '#models/periodo_medicion'
import ResultadoCarbono from '#models/resultado_carbono'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { createHash } from 'node:crypto'
import ReglaCalculo from '#models/regla_calculo'
import GwpValue from '#models/gwp_value'
import UnidadMedida from '#models/unidad_medida'
import UnitConversionService, {
  parametrosConversionDesde,
  type ParametrosConversion,
} from '#services/emissions/unit_conversion_service'
import {
  CODIGO_UNIDAD_RESULTADO,
  etiquetaUnidadCo2e,
  seleccionarUnidadResultado,
} from '#services/emissions/unidad_resultado'
import { agruparCandidatosPorGas } from '#services/emissions/factor_candidates'
import { normalizarEspecieGas } from '#services/emissions/gas_validation'
import { crearSnapshotGwp, resolverGwpAplicable } from '#services/emissions/gwp_selection'
import {
  actividadParaFactor,
  resolverMetodologia,
} from '#services/emissions/calculation_methodologies'

type CrearPayload = {
  organizacionId: number
  periodoId: number
  versionId: number
  observacion?: string | null
  unidadesProducidas?: string | null
  unidadFuncional?: string | null
}

type AccionPayload = {
  fuenteEmisionId?: number | null
  estrategia: string
  indicador: string
  meta: string
}

export type GrupoEmision = {
  nombre: string
  valorCo2e: string
  porcentaje: number
}

type LineaCalculada = {
  dato: DatoActividadCarbono
  factor: FactorEmision
  regla: ReglaCalculo | null
  metodologia: { codigo: string; nombre: string }
  cantidadConvertida: string
  /** Densidad o poder calorífico con los que se convirtió la cantidad. */
  parametrosUsados: ParametrosConversion
  cantidadEmision: string
  valorCo2e: string
  unidadResultadoId: number
  gwp: GwpValue | null
}

const ESCALA_CANTIDAD = 8
const ESCALA_FACTOR = 12
const ESCALA_RESULTADO = 8

export function aEntero(valor: string, escala: number): bigint {
  if (typeof valor !== 'string' || !Number.isInteger(escala) || escala < 0) {
    throw new Exception('El valor debe ser un decimal válido', {
      status: 422,
      code: 'E_VALIDATION',
    })
  }
  const normalizado = valor.trim()
  const coincidencia = /^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/.exec(normalizado)
  if (!coincidencia) {
    throw new Exception('El valor debe ser un decimal válido', {
      status: 422,
      code: 'E_VALIDATION',
    })
  }
  const [, signo, entero, fraccion = ''] = coincidencia
  if (entero.length > 24 - escala || fraccion.length > escala) {
    throw new Exception('El valor excede la precisión admitida', {
      status: 422,
      code: 'E_VALIDATION',
    })
  }
  const resultado = BigInt(`${entero}${fraccion.padEnd(escala, '0')}`)
  return signo === '-' ? -resultado : resultado
}

function desdeEntero(numero: bigint, escala: number): string {
  const negativo = numero < 0n
  const absoluto = (negativo ? -numero : numero).toString().padStart(escala + 1, '0')
  const corte = absoluto.length - escala
  const entero = absoluto.slice(0, corte).replace(/^0+(?=\d)/, '')
  const frac = absoluto.slice(corte).replace(/0+$/, '')
  const cuerpo = frac ? `${entero}.${frac}` : entero
  return negativo && cuerpo !== '0' ? `-${cuerpo}` : cuerpo
}

export function multiplicarEmision(cantidad: string, factor: string): string {
  const producto = aEntero(cantidad, ESCALA_CANTIDAD) * aEntero(factor, ESCALA_FACTOR)
  const quitar = ESCALA_CANTIDAD + ESCALA_FACTOR - ESCALA_RESULTADO
  const divisor = 10n ** BigInt(quitar)
  const mitad = divisor / 2n
  const ajustado = producto >= 0n ? (producto + mitad) / divisor : (producto - mitad) / divisor
  return desdeEntero(ajustado, ESCALA_RESULTADO)
}

/** Convert one gas emission to CO2e with a documented GWP value.
 * A factor already expressed as CO2e must bypass GWP entirely.
 */
export function convertirAGwp(cantidadEmision: string, gas: string, valorGwp?: string | null) {
  if (gas === 'CO2E') return cantidadEmision
  if (!valorGwp || !/^\d+(?:\.\d+)?$/.test(valorGwp)) {
    throw new Exception('Se requiere un GWP documentado para convertir el gas a CO2e', {
      status: 422,
      code: 'E_VALIDATION',
    })
  }
  return multiplicarEmision(cantidadEmision, valorGwp)
}

export function dividirEmision(numerador: string, divisor: string): string {
  const n = aEntero(numerador, ESCALA_RESULTADO)
  const d = aEntero(divisor, ESCALA_RESULTADO)
  if (d <= 0n) {
    throw new Exception('La cantidad de unidades tiene que ser mayor que cero', {
      status: 422,
      code: 'E_VALIDATION',
    })
  }
  const escala = 10n ** BigInt(ESCALA_RESULTADO)
  const producto = n * escala
  const mitad = d / 2n
  const ajustado = producto >= 0n ? (producto + mitad) / d : (producto - mitad) / d
  return desdeEntero(ajustado, ESCALA_RESULTADO)
}

export function toneladasDesdeKg(totalKg: string): string {
  return dividirEmision(totalKg, '1000')
}

export function intensidadDesde(totalKg: string, unidades: string): string {
  return dividirEmision(totalKg, unidades)
}

function sumarEmision(valores: string[]): string {
  const total = valores.reduce(
    (acumulado, valor) => acumulado + aEntero(valor, ESCALA_RESULTADO),
    0n
  )
  return desdeEntero(total, ESCALA_RESULTADO)
}

function porcentaje(parte: string, total: string): number {
  const base = Number(total)
  if (!base) return 0
  return Math.round((Number(parte) / base) * 1000) / 10
}

function textoPlano(valor: string) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function plantillaReduccion(nombre: string, categoria: string | null) {
  const texto = textoPlano(`${nombre} ${categoria ?? ''}`)
  if (/electr|energia|kwh|luz/.test(texto)) {
    return {
      estrategia: 'Iluminación LED y equipos eficientes',
      indicador: 'kWh/mes',
      meta: 'Reducir el consumo eléctrico 10%.',
    }
  }
  if (/residu|organic|compost/.test(texto)) {
    return {
      estrategia: 'Implementar compostaje y separar los residuos',
      indicador: 'kg aprovechados',
      meta: 'Aprovechar 70% de los residuos.',
    }
  }
  if (/gasolina|diesel|combust/.test(texto)) {
    return {
      estrategia: 'Optimizar recorridos y mantenimiento vehicular',
      indicador: 'Litros/km',
      meta: 'Reducir el combustible 8%.',
    }
  }
  if (/gas natural|caldera/.test(texto)) {
    return {
      estrategia: 'Ajustar la caldera y revisar fugas de gas',
      indicador: 'm³/mes',
      meta: 'Reducir el consumo de gas 10%.',
    }
  }
  if (/transport|logistic/.test(texto)) {
    return {
      estrategia: 'Optimizar rutas y cargas',
      indicador: 'kg CO2e por t·km',
      meta: 'Bajar el transporte del periodo.',
    }
  }
  if (/carton|material|empaque/.test(texto)) {
    return {
      estrategia: 'Reducir el peso del material e incorporar reciclado',
      indicador: 'kg de material por unidad',
      meta: 'Bajar el material por unidad.',
    }
  }
  return {
    estrategia: `Medir y reducir ${nombre}`,
    indicador: 'kg CO2e',
    meta: `Reducir la emisión de ${nombre}.`,
  }
}

export function proponerReduccion(
  lineas: {
    fuenteEmisionId: number
    fuenteNombre: string
    categoria: string | null
    valorCo2e: string
  }[]
): AccionPayload[] {
  if (!lineas.length) return []
  const total = sumarEmision(lineas.map((linea) => linea.valorCo2e))
  const mapa = new Map<number, { nombre: string; categoria: string | null; valores: string[] }>()
  for (const linea of lineas) {
    const actual = mapa.get(linea.fuenteEmisionId) ?? {
      nombre: linea.fuenteNombre,
      categoria: linea.categoria,
      valores: [],
    }
    actual.valores.push(linea.valorCo2e)
    mapa.set(linea.fuenteEmisionId, actual)
  }

  return [...mapa.entries()]
    .map(([fuenteEmisionId, grupo]) => {
      const valor = sumarEmision(grupo.valores)
      const plantilla = plantillaReduccion(grupo.nombre, grupo.categoria)
      const aporte = `Aporta ${decimalTexto(valor)} kg CO2e (${porcentaje(valor, total)}%).`
      return {
        fuenteEmisionId,
        estrategia: plantilla.estrategia,
        indicador: plantilla.indicador,
        meta: `${plantilla.meta} ${aporte}`.slice(0, 255),
        valor,
      }
    })
    .sort((a, b) => Number(b.valor) - Number(a.valor))
    .map(({ valor: _valor, ...accion }) => accion)
}

export function agruparResultadosPorNombre(
  lineas: { nombre: string; valorCo2e: string }[],
  total: string
): GrupoEmision[] {
  const mapa = new Map<string, string[]>()
  for (const linea of lineas) {
    const lista = mapa.get(linea.nombre) ?? []
    lista.push(linea.valorCo2e)
    mapa.set(linea.nombre, lista)
  }
  return [...mapa.entries()].map(([nombre, valores]) => {
    const valorCo2e = sumarEmision(valores)
    return { nombre, valorCo2e, porcentaje: porcentaje(valorCo2e, total) }
  })
}

export function agruparResultadosPorGas(
  lineas: {
    gasCalculado: string | null
    gasEspecifico: string | null
    valorCo2e: string
  }[],
  total: string
): GrupoEmision[] {
  return agruparResultadosPorNombre(
    lineas.map((linea) => ({
      nombre: [
        linea.gasCalculado ?? 'Gas no identificado',
        normalizarEspecieGas(linea.gasEspecifico),
      ]
        .filter(Boolean)
        .join(' — '),
      valorCo2e: linea.valorCo2e,
    })),
    total
  )
}

function conDetalle() {
  return CalculoCarbono.query()
    .preload('organizacion')
    .preload('periodo')
    .preload('unidadResultado')
    .preload('version', (version) => version.preload('metodologia').preload('gwpSet'))
    .preload('resultados', (resultados) => {
      resultados
        .preload('actividad', (actividad) => actividad.preload('proceso'))
        .preload('alcance')
        .preload('fuenteEmision')
        .preload('actividadEmision')
        .preload('subcategoriaEmision')
        .preload('unidad')
        .preload('gwp', (gwp) => gwp.preload('set'))
    })
}

export default class CalculoCarbonoService {
  private opcionFactorDeclarada(
    parametros: Record<string, string | number | boolean | null> | null
  ) {
    const valor = parametros?.opcionFactor
    if (typeof valor !== 'string') return null
    const texto = valor.trim()
    return texto || null
  }

  /**
   * Si el año del dato no tiene factor vigente, usa el que la persona aceptó
   * para este registro: el último oficial, o un valor propio. No modifica el catálogo.
   */
  private async factoresAceptadosPorRegistro(
    dato: DatoActividadCarbono,
    versionId: number,
    opcionFactor: string | null
  ): Promise<{ factores: FactorEmision[]; error: string | null }> {
    const parametros = dato.parametrosCalculo
    const decision = parametros?.decisionFactor
    if (decision !== 'USAR_ULTIMO' && decision !== 'VALOR_PROPIO') {
      return { factores: [], error: null }
    }
    const factorId = Number(parametros?.factorReferenciaId)
    if (!Number.isInteger(factorId) || factorId < 1) {
      return {
        factores: [],
        error: 'Falta el factor de referencia para usarlo solo en este registro',
      }
    }
    const referencia = await FactorEmision.query()
      .where('id', factorId)
      .where('versionId', versionId)
      .where('fuenteEmisionId', dato.fuenteEmisionId)
      .where('estado', true)
      .where('estadoAprobacion', 'APROBADO')
      .preload('unidadEntrada')
      .preload('unidadSalida')
      .preload('version')
      .first()
    if (!referencia) {
      return {
        factores: [],
        error: 'El factor que elegiste ya no está aprobado para esta fuente',
      }
    }
    if (opcionFactor && referencia.variante !== opcionFactor) {
      return {
        factores: [],
        error: 'El factor elegido no corresponde a la opción de factor declarada',
      }
    }
    if (decision === 'VALOR_PROPIO') {
      const valor = String(parametros?.valorFactorPropio ?? '').trim()
      if (!/^(?:0|[1-9]\d{0,11})(?:\.\d{1,12})?$/.test(valor) || !/[1-9]/.test(valor)) {
        return {
          factores: [],
          error: 'El valor propio del factor debe ser un decimal mayor que cero',
        }
      }
      referencia.valor = valor
      referencia.gas = 'CO2E'
      referencia.gasEspecifico = null
      return { factores: [referencia], error: null }
    }
    const delAnio = FactorEmision.query()
      .where('versionId', versionId)
      .where('fuenteEmisionId', dato.fuenteEmisionId)
      .where('estado', true)
      .where('estadoAprobacion', 'APROBADO')
      .preload('unidadEntrada')
      .preload('unidadSalida')
      .preload('version')
    if (referencia.variante) delAnio.where('variante', referencia.variante)
    if (referencia.anioAplicacion) delAnio.where('anioAplicacion', referencia.anioAplicacion)
    else delAnio.where('fecha_inicio_vigencia', referencia.fechaInicioVigencia.toISODate()!)
    const delAnioAplicables = (await delAnio).filter((factor) => {
      if (!factor.region?.trim()) return true
      return ['CO', 'COLOMBIA'].includes(factor.region.trim().toUpperCase())
    })
    return { factores: delAnioAplicables, error: null }
  }

  private filaOmitida(dato: DatoActividadCarbono, motivo: string): FilaOmitida {
    return {
      datoId: dato.id,
      actividadNombre: dato.actividad?.nombre ?? 'Actividad histórica',
      fuenteNombre: dato.fuenteEmision?.nombre ?? 'Fuente sin nombre',
      cantidad: decimalTexto(dato.cantidad),
      unidadSimbolo: dato.unidad?.simbolo ?? '',
      motivo,
    }
  }

  async list(usuarioId: number, organizacionId?: number) {
    const organizaciones = await obtenerOrganizacionesAutorizadas(usuarioId)
    const consulta = CalculoCarbono.query()
      .preload('organizacion')
      .preload('periodo')
      .preload('unidadResultado')
      .preload('version', (version) => version.preload('metodologia'))
      .orderBy('fechaCalculo', 'desc')
    if (organizacionId !== undefined) {
      await exigirAccesoOrganizacion(usuarioId, organizacionId)
      consulta.where('organizacionId', organizacionId)
    } else if (organizaciones !== null) {
      consulta.whereIn('organizacionId', organizaciones)
    }
    return consulta.limit(100)
  }

  async show(id: number, usuarioId: number) {
    const organizaciones = await obtenerOrganizacionesAutorizadas(usuarioId)
    const consulta = conDetalle().where('id', id)
    if (organizaciones !== null) consulta.whereIn('organizacionId', organizaciones)
    const calculo = await consulta.first()
    if (!calculo) {
      throw new Exception('El cálculo de carbono no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return calculo
  }

  async opciones(usuarioId: number, organizacionId: number) {
    await exigirAccesoOrganizacion(usuarioId, organizacionId)
    const organizacion = await Organizacion.find(organizacionId)
    if (!organizacion) {
      throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const periodos = await PeriodoMedicion.query()
      .where('organizacionId', organizacionId)
      .whereNot('estado', 'BLOQUEADO')
      .orderBy('fechaInicio', 'desc')

    const versiones = await MetodologiaVersion.query()
      .where('estado', true)
      .whereHas('metodologia', (metodologia) => {
        metodologia.where('tipo', 'CARBONO').where('estado', true)
      })
      .preload('metodologia')
      .preload('gwpSet')
      .orderBy('fechaInicioVigencia', 'desc')

    return { periodos, versiones }
  }

  async crear(usuarioId: number, payload: CrearPayload) {
    await exigirAccesoOrganizacion(usuarioId, payload.organizacionId)
    const periodo = await PeriodoMedicion.query()
      .where('id', payload.periodoId)
      .where('organizacionId', payload.organizacionId)
      .first()
    if (!periodo) {
      throw new Exception('El periodo no pertenece a esa organización', {
        status: 404,
        code: 'E_NOT_FOUND',
      })
    }
    if (periodo.estado === 'BLOQUEADO') {
      throw new Exception('El periodo está bloqueado y no se puede calcular', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    const version = await MetodologiaVersion.query()
      .where('id', payload.versionId)
      .where('estado', true)
      .preload('metodologia')
      .preload('gwpSet')
      .first()
    if (!version || !version.metodologia.estado || version.metodologia.tipo !== 'CARBONO') {
      throw new Exception('La versión de metodología de carbono no existe o está inactiva', {
        status: 404,
        code: 'E_NOT_FOUND',
      })
    }
    if (
      version.fechaInicioVigencia > periodo.fechaFin ||
      (version.fechaFinVigencia && version.fechaFinVigencia < periodo.fechaInicio)
    ) {
      throw new Exception(
        'La versión metodológica no está vigente durante el periodo seleccionado',
        {
          status: 422,
          code: 'E_VALIDATION',
        }
      )
    }

    const datos = await DatoActividadCarbono.query()
      .where('periodoId', periodo.id)
      .whereNot('estadoRegistro', 'RECHAZADO')
      .whereHas('actividad', (actividad) => {
        actividad.whereHas('proceso', (proceso) => {
          proceso.whereHas('sede', (sede) => {
            sede.where('organizacionId', payload.organizacionId)
          })
        })
      })
      .preload('actividad')
      .preload('fuenteEmision')
      .preload('unidad')
      .preload('alcance')
      .preload('actividadEmision')

    if (!datos.length) {
      throw new Exception('Ese periodo no tiene papeles de carbono para calcular', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }

    const conversiones = new UnitConversionService()
    const calculadas: LineaCalculada[] = []
    const omitidos: FilaOmitida[] = []
    const organizacion = await Organizacion.find(payload.organizacionId)

    for (const dato of datos) {
      const fecha = dato.fechaDato ?? periodo.fechaInicio
      if (!dato.actividadEmision) {
        omitidos.push(
          this.filaOmitida(dato, 'El dato histórico no tiene actividad de emisión clasificada')
        )
        continue
      }

      const reglas = await ReglaCalculo.query()
        .where('fuenteEmisionId', dato.fuenteEmisionId)
        .where('estado', true)
        .where((query) => query.whereNull('versionId').orWhere('versionId', version.id))
        .preload('parametros')
      const reglasVersion = reglas.filter((regla) => regla.versionId === version.id)
      const reglasAplicables = reglasVersion.length
        ? reglasVersion
        : reglas.filter((regla) => !regla.versionId)
      if (reglasAplicables.length > 1) {
        omitidos.push(
          this.filaOmitida(
            dato,
            'Hay más de una regla de cálculo aplicable a esta fuente y versión'
          )
        )
        continue
      }
      const regla = reglasAplicables[0] ?? null
      if (regla && !regla.requiereFactor) {
        omitidos.push(
          this.filaOmitida(
            dato,
            'La regla requiere una fórmula sin factor y ese tipo de cálculo no está implementado'
          )
        )
        continue
      }
      if (regla?.formula?.trim()) {
        omitidos.push(
          this.filaOmitida(
            dato,
            'La regla define una fórmula que el motor no interpreta; no se aplicará una multiplicación genérica'
          )
        )
        continue
      }
      const parametrosRequeridos =
        regla?.parametros.filter((parametro) => parametro.requerido) ?? []
      const parametrosDato = dato.parametrosCalculo ?? {}
      const parametrosFaltantes = parametrosRequeridos.filter(
        (parametro) =>
          !Object.prototype.hasOwnProperty.call(parametrosDato, parametro.codigo) ||
          parametrosDato[parametro.codigo] === null ||
          parametrosDato[parametro.codigo] === ''
      )
      if (
        regla?.requiereParametros &&
        (!parametrosRequeridos.length || parametrosFaltantes.length > 0)
      ) {
        omitidos.push(
          this.filaOmitida(
            dato,
            parametrosRequeridos.length
              ? `Faltan parámetros requeridos: ${parametrosFaltantes.map((item) => item.codigo).join(', ')}`
              : 'La regla requiere parámetros pero no define cuáles son; se omite el cálculo'
          )
        )
        continue
      }
      let metodologia: ReturnType<typeof resolverMetodologia>
      try {
        metodologia = resolverMetodologia(dato.actividadEmision.codigo, regla?.tipoCalculo)
      } catch (error) {
        omitidos.push(
          this.filaOmitida(
            dato,
            error instanceof Error ? error.message : 'Metodología no disponible'
          )
        )
        continue
      }

      if (regla?.requiereParametros) {
        const esDistanciaA2 =
          metodologia.codigo === 'COMBUSTION_MOVIL' &&
          dato.unidad.magnitud
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase() === 'distancia'
        const codigosRequeridos = new Set(parametrosRequeridos.map((parametro) => parametro.codigo))
        const parametrosDistancia = ['consumoEspecifico', 'unidadConsumoId', 'unidadDistanciaId']
        if (
          !esDistanciaA2 ||
          parametrosDistancia.some((codigo) => !codigosRequeridos.has(codigo)) ||
          [...codigosRequeridos].some((codigo) => !parametrosDistancia.includes(codigo))
        ) {
          omitidos.push(
            this.filaOmitida(
              dato,
              'La regla requiere parámetros que esta metodología no ejecuta de forma documentada'
            )
          )
          continue
        }
      }

      const factores = await FactorEmision.query()
        .where('versionId', version.id)
        .where('fuenteEmisionId', dato.fuenteEmisionId)
        .where('estado', true)
        .where('estadoAprobacion', 'APROBADO')
        .where('fecha_inicio_vigencia', '<=', fecha.toISODate()!)
        .where((query) => query.whereNull('anioAplicacion').orWhere('anioAplicacion', fecha.year))
        .where((consulta) => {
          consulta
            .whereNull('fecha_fin_vigencia')
            .orWhere('fecha_fin_vigencia', '>=', fecha.toISODate()!)
        })
        .preload('unidadEntrada')
        .preload('unidadSalida')
        .preload('version', (metodologiaVersion) => metodologiaVersion.preload('metodologia'))

      const opcionFactor = this.opcionFactorDeclarada(dato.parametrosCalculo)
      let factoresAplicables = factores.filter((factor) => {
        if (factor.region && !['CO', 'COLOMBIA'].includes(factor.region.trim().toUpperCase()))
          return false
        if (
          factor.sectorCategoria &&
          factor.sectorCategoria.trim().toLocaleLowerCase() !==
            (organizacion?.sectorEconomico ?? '').trim().toLocaleLowerCase()
        )
          return false
        return true
      })
      if (opcionFactor) {
        const deLaOpcion = factoresAplicables.filter((factor) => factor.variante === opcionFactor)
        if (!deLaOpcion.length) {
          omitidos.push(
            this.filaOmitida(
              dato,
              `No hay factor aprobado para la opción ${opcionFactor}`
            )
          )
          continue
        }
        factoresAplicables = deLaOpcion
      }
      if (!factoresAplicables.length) {
        const aceptados = await this.factoresAceptadosPorRegistro(
          dato,
          version.id,
          opcionFactor
        )
        if (aceptados.error) {
          omitidos.push(this.filaOmitida(dato, aceptados.error))
          continue
        }
        if (aceptados.factores.length) {
          factoresAplicables = aceptados.factores
        } else {
          const hayNoAprobados = await FactorEmision.query()
            .where('versionId', version.id)
            .where('fuenteEmisionId', dato.fuenteEmisionId)
            .where('estado', true)
            .whereNot('estadoAprobacion', 'APROBADO')
            .first()
          omitidos.push(
            this.filaOmitida(
              dato,
              hayNoAprobados
                ? 'Hay factores para esta fuente, pero ninguno está aprobado'
                : 'No hay factores aprobados vigentes y regionalmente aplicables para esta fuente'
            )
          )
          continue
        }
      }

      const candidatos: {
        factor: FactorEmision
        cantidad: string
        parametrosUsados: ParametrosConversion
      }[] = []
      // Densidad o poder calorífico registrados con el dato; nunca se suponen.
      const parametrosConversion = parametrosConversionDesde(dato.parametrosCalculo)
      let motivoConversion: string | null = null
      for (const factor of factoresAplicables) {
        try {
          if (regla && factor.gas !== regla.baseGases) continue
          if (regla?.unidadEntradaId && factor.unidadEntradaId !== regla.unidadEntradaId) continue
          if (regla?.unidadResultadoId && factor.unidadSalidaId !== regla.unidadResultadoId)
            continue
          // Registra sólo los parámetros que la conversión usó de verdad.
          const parametrosUsados: ParametrosConversion = {}
          const cantidad = await actividadParaFactor(
            metodologia.codigo,
            dato.cantidad,
            dato.unidad.magnitud,
            factor.unidadEntradaId,
            dato.parametrosCalculo ?? {},
            async (valor, origen, destino) => {
              const detalle = await conversiones.convertirConDetalle(
                valor,
                origen,
                destino,
                parametrosConversion
              )
              Object.assign(parametrosUsados, detalle.parametrosUsados)
              return detalle.valor
            },
            dato.unidadId,
            factor.unidadEntrada.magnitud
          )
          candidatos.push({ factor, cantidad, parametrosUsados })
        } catch (error) {
          if (error instanceof Exception && error.status === 422) {
            motivoConversion = error.message
            continue
          }
          throw error
        }
      }

      const { porGas, error: errorCandidatos } = agruparCandidatosPorGas(
        candidatos.map(({ factor, cantidad, parametrosUsados }) => ({
          factor,
          cantidad,
          parametrosUsados,
          gas: factor.gas,
          gasEspecifico: normalizarEspecieGas(factor.gasEspecifico),
          region: factor.region,
          sectorCategoria: factor.sectorCategoria,
          anioAplicacion: factor.anioAplicacion,
        }))
      )
      if (!porGas.size) {
        omitidos.push(
          this.filaOmitida(
            dato,
            motivoConversion
              ? `No hay factor aprobado con unidad compatible ni parámetros suficientes: ${motivoConversion}`
              : 'No hay factor aprobado con unidad compatible ni parámetros suficientes'
          )
        )
        continue
      }
      if (errorCandidatos) {
        omitidos.push(this.filaOmitida(dato, errorCandidatos))
        continue
      }

      const lineasDato: LineaCalculada[] = []
      let errorGwp: string | null = null
      for (const [gasKey, [candidato]] of porGas) {
        const factor = candidato.factor
        if (
          !factor.unidadSalida ||
          !['masa'].includes(
            factor.unidadSalida.magnitud
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLocaleLowerCase()
          )
        ) {
          errorGwp =
            'La unidad de salida del factor debe ser una unidad de masa para consolidar emisiones'
          break
        }
        const cantidadEmision = multiplicarEmision(candidato.cantidad, factor.valor)
        let gwp: GwpValue | null = null
        let valorCo2e = cantidadEmision
        if (factor.gas !== 'CO2E') {
          const gasEspecifico = normalizarEspecieGas(factor.gasEspecifico)
          if (version.gwpSetId && !version.gwpSet?.estado) {
            errorGwp = 'El conjunto GWP asignado a la metodología está inactivo o no disponible'
            break
          }
          const resolucion = await resolverGwpAplicable(
            factor.gas,
            gasEspecifico,
            version.gwpSetId,
            (setId, gasCodigo) =>
              GwpValue.query().where('gwpSetId', setId).where('gasCodigo', gasCodigo).first()
          )
          if (resolucion.status === 'unsupported_species') {
            errorGwp =
              factor.gas === 'CH4'
                ? 'La especie CH4 no tiene un código GWP AR6 reconocido'
                : `El gas ${factor.gas} no tiene una especie GWP reconocida`
            break
          }
          if (resolucion.status === 'missing_set') {
            errorGwp = 'La versión de metodología no tiene un conjunto GWP explícito asignado'
            break
          }
          if (resolucion.status === 'missing_value') {
            errorGwp = `Falta GWP ${resolucion.code} en el conjunto asignado a la metodología`
            break
          }
          if (resolucion.status !== 'found') {
            errorGwp = 'No se pudo resolver un GWP aplicable para el gas del factor'
            break
          }
          gwp = resolucion.gwp
          valorCo2e = convertirAGwp(cantidadEmision, factor.gas, gwp.valor)
        }
        lineasDato.push({
          dato,
          factor,
          regla,
          metodologia: { codigo: metodologia.codigo, nombre: metodologia.nombre },
          cantidadConvertida: candidato.cantidad,
          parametrosUsados: candidato.parametrosUsados,
          cantidadEmision,
          valorCo2e,
          unidadResultadoId: factor.unidadSalidaId,
          gwp,
        })
        if (!gasKey) continue
      }
      if (errorGwp) {
        omitidos.push(this.filaOmitida(dato, errorGwp))
        continue
      }
      calculadas.push(...lineasDato)
    }

    if (!calculadas.length) {
      throw new Exception(
        'Ningún dato tiene factores aprobados, metodología y unidades suficientes; no se creó un cálculo vacío',
        {
          status: 422,
          code: 'E_VALIDATION',
        }
      )
    }
    // Selección determinista: no depende del orden en que la base devuelva filas.
    const candidatasResultado = await UnidadMedida.query().where((query) => {
      query.where('codigo', CODIGO_UNIDAD_RESULTADO).orWhere((kg) => {
        kg.where('estado', true).whereRaw("lower(trim(simbolo)) like 'kg%'")
      })
    })
    const unidadBase = seleccionarUnidadResultado(candidatasResultado)
    const unidadResultadoId = unidadBase.id
    for (const linea of calculadas) {
      linea.valorCo2e = await conversiones.convert(
        linea.valorCo2e,
        linea.unidadResultadoId,
        unidadResultadoId
      )
      linea.unidadResultadoId = unidadResultadoId
    }
    const total = sumarEmision(calculadas.map((fila) => fila.valorCo2e))
    const notaOmitidos = omitidos.length
      ? omitidos.length === 1
        ? '1 papel no entró en la suma.'
        : `${omitidos.length} papeles no entraron en la suma.`
      : null
    const observacion =
      [payload.observacion?.trim(), notaOmitidos].filter(Boolean).join(' ') || null
    const unidadesProducidas = payload.unidadesProducidas?.trim() || null
    const unidadFuncional = unidadesProducidas
      ? payload.unidadFuncional?.trim() || 'unidades'
      : null
    if (payload.unidadFuncional?.trim() && !unidadesProducidas) {
      throw new Exception('Falta la cantidad de unidades para calcular la intensidad', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    if (unidadesProducidas) intensidadDesde(total, unidadesProducidas)

    const hashEntrada = createHash('sha256')
      .update(
        JSON.stringify({
          versionMotor: '2.0.0',
          organizacionId: payload.organizacionId,
          periodoId: periodo.id,
          versionId: version.id,
          metodologiaCodigo: version.metodologia.codigo,
          metodologiaVersion: version.numeroVersion,
          gwpSetId: version.gwpSetId,
          gwpSetCodigo: version.gwpSet?.codigo ?? null,
          gwpStandardVersion: version.gwpSet?.estandarVersion ?? null,
          gwpHorizon: version.gwpSet?.horizonteAnios ?? null,
          observacion: payload.observacion?.trim() ?? null,
          unidadesProducidas,
          unidadFuncional,
          datos: datos
            .map((dato) => ({
              id: dato.id,
              cantidad: dato.cantidad,
              unidadId: dato.unidadId,
              fechaDato: dato.fechaDato?.toISODate() ?? null,
              fuenteEmisionId: dato.fuenteEmisionId,
              alcanceId: dato.alcanceId,
              actividadEmisionId: dato.actividadEmisionId,
              subcategoriaEmisionId: dato.subcategoriaEmisionId,
              parametros: dato.parametrosCalculo,
            }))
            .sort((a, b) => a.id - b.id),
          factores: calculadas
            .map((linea) => ({
              datoId: linea.dato.id,
              factorId: linea.factor.id,
              valor: linea.factor.valor,
              factorFuente: linea.factor.fuente,
              factorInstitucion: linea.factor.institucionResponsable,
              factorAnioPublicacion: linea.factor.anioPublicacion,
              factorAnioAplicacion: linea.factor.anioAplicacion,
              factorOrigen: linea.factor.origen,
              gas: linea.factor.gas,
              gasEspecifico: normalizarEspecieGas(linea.factor.gasEspecifico),
              reglaId: linea.regla?.id ?? null,
              reglaTipo: linea.regla?.tipoCalculo ?? null,
              reglaBaseGases: linea.regla?.baseGases ?? null,
              reglaUnidadEntradaId: linea.regla?.unidadEntradaId ?? null,
              reglaUnidadResultadoId: linea.regla?.unidadResultadoId ?? null,
              metodologiaCodigo: linea.metodologia.codigo,
              gwpValueId: linea.gwp?.id ?? null,
              gwpValor: linea.gwp?.valor ?? null,
              cantidadConvertida: linea.cantidadConvertida,
              cantidadEmision: linea.cantidadEmision,
              valorCo2e: linea.valorCo2e,
              unidadResultadoId: linea.unidadResultadoId,
            }))
            .sort((a, b) => a.datoId - b.datoId || a.factorId - b.factorId),
        })
      )
      .digest('hex')
    const previo = await CalculoCarbono.query().where('hashEntrada', hashEntrada).first()
    if (previo) {
      const existente = await this.show(previo.id, usuarioId)
      existente.omitidos = omitidos
      return existente
    }

    try {
      const calculo = await db.transaction(async (trx) => {
        const creado = await CalculoCarbono.create(
          {
            organizacionId: payload.organizacionId,
            periodoId: periodo.id,
            versionId: version.id,
            usuarioId,
            unidadResultadoId,
            fechaCalculo: DateTime.utc(),
            estado: 'CALCULADO',
            totalCo2e: total,
            hashEntrada,
            versionMotor: '2.0.0',
            gwpSetId: version.gwpSetId,
            baseGases: calculadas.every((linea) => linea.factor.gas === 'CO2E') ? 'CO2E' : 'MIXTO',
            unidadesProducidas,
            unidadFuncional,
            observacion,
          },
          { client: trx }
        )

        for (const fila of calculadas) {
          const trazaGwp = crearSnapshotGwp(fila.gwp, version.gwpSet ?? null)
          await ResultadoCarbono.create(
            {
              calculoCarbonoId: creado.id,
              actividadId: fila.dato.actividadId,
              alcanceId: fila.dato.alcanceId,
              fuenteEmisionId: fila.dato.fuenteEmisionId,
              actividadEmisionId: fila.dato.actividadEmisionId,
              subcategoriaEmisionId: fila.dato.subcategoriaEmisionId,
              unidadId: fila.unidadResultadoId,
              valorCo2e: fila.valorCo2e,
              datoCarbonoId: fila.dato.id,
              reglaCalculoId: fila.regla?.id ?? null,
              factorEmisionId: fila.factor.id,
              cantidadOriginal: fila.dato.cantidad,
              cantidadConvertida: fila.cantidadConvertida,
              unidadOriginalId: fila.dato.unidadId,
              unidadUtilizadaId: fila.factor.unidadEntradaId,
              valorFactor: fila.factor.valor,
              // Copias: la evidencia no cambia si después se edita el dato.
              densidadValor: fila.parametrosUsados.densidad?.valor ?? null,
              unidadDensidadId: fila.parametrosUsados.densidad?.unidadId ?? null,
              poderCalorificoValor: fila.parametrosUsados.poderCalorifico?.valor ?? null,
              unidadPoderCalorificoId: fila.parametrosUsados.poderCalorifico?.unidadId ?? null,
              parametrosCalculo: { ...(fila.dato.parametrosCalculo ?? {}) },
              factorCodigo: fila.factor.codigo,
              factorFuente: fila.factor.fuente,
              factorAnioAplicacion: fila.factor.anioAplicacion,
              factorAnioPublicacion: fila.factor.anioPublicacion,
              factorInstitucionResponsable: fila.factor.institucionResponsable,
              factorOrigen: fila.factor.origen,
              factorVersion: fila.factor.version.numeroVersion,
              metodologia: fila.metodologia.nombre,
              baseGases: fila.factor.gas,
              fechaCalculo: DateTime.utc(),
              gasCalculado: fila.factor.gas,
              gasEspecifico: normalizarEspecieGas(fila.factor.gasEspecifico),
              cantidadEmision: fila.cantidadEmision,
              unidadEmisionId: fila.factor.unidadSalidaId,
              gwpValueId: trazaGwp.gwpValueId,
              valorGwp: trazaGwp.valorGwp,
              gwpHorizonteAnios: trazaGwp.gwpHorizonteAnios,
              gwpVersion: trazaGwp.gwpVersion,
              versionMotor: '2.0.0',
            },
            { client: trx }
          )
        }

        for (const datoId of new Set(calculadas.map((fila) => fila.dato.id))) {
          await trx.table('calculo_carbono_dato').insert({
            id_calculo_carbono: creado.id,
            id_dato_carbono: datoId,
          })
        }

        const factoresUsados = new Map<number, string>()
        for (const fila of calculadas) factoresUsados.set(fila.factor.id, fila.factor.valor)
        for (const [factorId, valor] of factoresUsados) {
          await trx.table('calculo_carbono_factor').insert({
            id_calculo_carbono: creado.id,
            id_factor_emision: factorId,
            valor_aplicado: valor,
          })
        }

        const propuestas = proponerReduccion(
          calculadas.map((fila) => ({
            fuenteEmisionId: fila.dato.fuenteEmisionId,
            fuenteNombre: fila.dato.fuenteEmision.nombre,
            categoria: fila.dato.fuenteEmision.categoria,
            valorCo2e: fila.valorCo2e,
          }))
        )
        for (const accion of propuestas) {
          await AccionReduccion.create(
            {
              calculoCarbonoId: creado.id,
              fuenteEmisionId: accion.fuenteEmisionId ?? null,
              estrategia: accion.estrategia,
              indicador: accion.indicador,
              meta: accion.meta,
            },
            { client: trx }
          )
        }

        return creado
      })

      const completo = await this.show(calculo.id, usuarioId)
      completo.omitidos = omitidos
      return completo
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        const duplicado = await CalculoCarbono.query().where('hashEntrada', hashEntrada).first()
        if (duplicado) return this.show(duplicado.id, usuarioId)
      }
      rethrowDatabaseError(error, 'No se pudo guardar el cálculo de carbono')
    }
  }

  async resumen(usuarioId: number, organizacionId: number) {
    await exigirAccesoOrganizacion(usuarioId, organizacionId)
    const organizacion = await Organizacion.find(organizacionId)
    if (!organizacion) {
      throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const calculos = await CalculoCarbono.query()
      .where('organizacionId', organizacionId)
      .whereNotNull('totalCo2e')
      .preload('periodo')
      .preload('unidadResultado')
      .preload('resultados', (resultados) => {
        resultados
          .preload('alcance')
          .preload('fuenteEmision')
          .preload('actividadEmision')
          .preload('subcategoriaEmision')
      })
      .orderBy('fechaCalculo', 'desc')

    const vistos = new Set<number>()
    const unicos: CalculoCarbono[] = []
    for (const calculo of calculos) {
      if (vistos.has(calculo.periodoId)) continue
      vistos.add(calculo.periodoId)
      unicos.push(calculo)
    }

    const periodos = unicos
      .slice()
      .sort((a, b) => a.periodo.fechaInicio.toMillis() - b.periodo.fechaInicio.toMillis())
      .map((calculo) => this.ficha(calculo))

    return {
      organizacionId: organizacion.id,
      organizacionNombre: organizacion.nombre,
      ultimo: unicos[0] ? this.ficha(unicos[0]) : null,
      periodos,
    }
  }

  async informe(id: number, usuarioId: number) {
    const organizaciones = await obtenerOrganizacionesAutorizadas(usuarioId)
    const consulta = CalculoCarbono.query().where('id', id)
    if (organizaciones !== null) consulta.whereIn('organizacionId', organizaciones)
    const calculo = await consulta
      .preload('organizacion')
      .preload('periodo')
      .preload('unidadResultado')
      .preload('version', (version) => version.preload('metodologia'))
      .preload('resultados', (resultados) => {
        resultados
          .preload('actividad', (actividad) => {
            actividad.preload('proceso', (proceso) => proceso.preload('sede'))
          })
          .preload('alcance')
          .preload('fuenteEmision')
          .preload('actividadEmision')
          .preload('subcategoriaEmision')
          .preload('unidad')
      })
      .first()
    if (!calculo) {
      throw new Exception('El cálculo de carbono no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const puentes = await db
      .from('calculo_carbono_dato')
      .where('id_calculo_carbono', id)
      .select('id_dato_carbono')
    const datoIds = puentes.map((fila) => Number(fila.id_dato_carbono))
    const papeles = datoIds.length
      ? await DatoActividadCarbono.query()
          .whereIn('id', datoIds)
          .preload('actividad', (actividad) => actividad.preload('proceso'))
          .preload('unidad')
          .preload('alcance')
      : []

    const factores = await db
      .from('calculo_carbono_factor as puente')
      .join('factor_emision as factor', 'factor.id_factor_emision', 'puente.id_factor_emision')
      .join('fuente_emision as fuente', 'fuente.id_fuente_emision', 'factor.id_fuente_emision')
      .join('unidad_medida as entrada', 'entrada.id_unidad', 'factor.id_unidad_entrada')
      .where('puente.id_calculo_carbono', id)
      .select(
        'fuente.nombre as fuente',
        'puente.valor_aplicado as valor',
        'entrada.simbolo as unidad',
        'factor.fuente as documento'
      )

    const ficha = calculo.totalCo2e ? this.ficha(calculo) : null
    const sedes = [
      ...new Set(
        calculo.resultados
          .map((linea) => linea.actividad?.proceso?.sede?.nombre)
          .filter((nombre): nombre is string => Boolean(nombre))
      ),
    ]
    const accionesReduccion = await this.listarReduccion(id, usuarioId)

    return {
      titulo: 'Informe de huella de carbono',
      organizacionNombre: calculo.organizacion.nombre,
      nit: calculo.organizacion.nit,
      sector: calculo.organizacion.sectorEconomico,
      sedes,
      periodoNombre: calculo.periodo.nombre,
      fechaInicio: fechaTexto(calculo.periodo.fechaInicio),
      fechaFin: fechaTexto(calculo.periodo.fechaFin),
      metodologiaNombre: calculo.version.metodologia.nombre,
      numeroVersion: calculo.version.numeroVersion,
      totalCo2e: ficha?.totalCo2e ?? null,
      toneladasCo2e: ficha?.toneladasCo2e ?? null,
      unidadResultado: ficha?.unidadResultado ?? null,
      unidadesProducidas: ficha?.unidadesProducidas ?? null,
      unidadFuncional: ficha?.unidadFuncional ?? null,
      intensidadCo2e: ficha?.intensidadCo2e ?? null,
      observacion: calculo.observacion,
      papeles: papeles.map((papel) => ({
        actividad: papel.actividad.nombre,
        proceso: papel.actividad.proceso.nombre,
        cantidad: decimalTexto(papel.cantidad),
        unidad: papel.unidad.simbolo,
        documento: papel.fuenteDato,
        alcance: papel.alcance.nombre,
      })),
      factores: factores.map((factor) => ({
        fuente: String(factor.fuente),
        valor: decimalTexto(String(factor.valor)),
        unidad: String(factor.unidad),
        documento: factor.documento ? String(factor.documento) : null,
      })),
      porAlcance: ficha?.porAlcance ?? [],
      porFuente: ficha?.porFuente ?? [],
      porActividad: ficha?.porActividad ?? [],
      porSubcategoria: ficha?.porSubcategoria ?? [],
      porGas: ficha?.porGas ?? [],
      lineas: calculo.resultados.map((linea) => ({
        actividad: linea.actividad?.nombre ?? '',
        actividadEmision: linea.actividadEmision?.nombre ?? null,
        subcategoriaEmision: linea.subcategoriaEmision?.nombre ?? null,
        proceso: linea.actividad?.proceso?.nombre ?? '',
        alcance: linea.alcance?.nombre ?? '',
        fuente: linea.fuenteEmision?.nombre ?? '',
        gas: linea.gasCalculado,
        especieGas: linea.gasEspecifico,
        cantidadEmision: linea.cantidadEmision,
        valorGwp: linea.valorGwp,
        gwpHorizonteAnios: linea.gwpHorizonteAnios,
        gwpVersion: linea.gwpVersion,
        valorCo2e: decimalTexto(linea.valorCo2e),
        unidad: linea.unidad?.simbolo ?? '',
      })),
      acciones: accionesReduccion.map((accion) => ({
        fuente: accion.fuenteNombre,
        estrategia: accion.estrategia,
        indicador: accion.indicador,
        meta: accion.meta,
      })),
    }
  }

  async listarReduccion(id: number, usuarioId: number) {
    await this.show(id, usuarioId)
    let acciones = await AccionReduccion.query()
      .where('calculoCarbonoId', id)
      .preload('fuenteEmision')
      .orderBy('id', 'asc')

    if (!acciones.length) {
      const completo = await conDetalle().where('id', id).first()
      const propuestas = proponerReduccion(
        (completo?.resultados ?? []).map((linea) => ({
          fuenteEmisionId: linea.fuenteEmisionId,
          fuenteNombre: linea.fuenteEmision?.nombre ?? 'Fuente',
          categoria: linea.fuenteEmision?.categoria ?? null,
          valorCo2e: linea.valorCo2e,
        }))
      )
      if (propuestas.length) {
        await db.transaction(async (trx) => {
          for (const accion of propuestas) {
            await AccionReduccion.create(
              {
                calculoCarbonoId: id,
                fuenteEmisionId: accion.fuenteEmisionId ?? null,
                estrategia: accion.estrategia,
                indicador: accion.indicador,
                meta: accion.meta,
              },
              { client: trx }
            )
          }
        })
        acciones = await AccionReduccion.query()
          .where('calculoCarbonoId', id)
          .preload('fuenteEmision')
          .orderBy('id', 'asc')
      }
    }

    return acciones.map((accion) => ({
      id: accion.id,
      fuenteEmisionId: accion.fuenteEmisionId,
      fuenteNombre: accion.fuenteEmision?.nombre ?? null,
      estrategia: accion.estrategia,
      indicador: accion.indicador,
      meta: accion.meta,
    }))
  }

  async guardarReduccion(id: number, usuarioId: number, acciones: AccionPayload[]) {
    const calculo = await this.show(id, usuarioId)
    const fuentes = new Set(calculo.resultados.map((linea) => linea.fuenteEmisionId))
    for (const accion of acciones) {
      if (accion.fuenteEmisionId && !fuentes.has(accion.fuenteEmisionId)) {
        throw new Exception('Esa fuente no está en el cálculo', {
          status: 422,
          code: 'E_VALIDATION',
        })
      }
    }

    try {
      await db.transaction(async (trx) => {
        await AccionReduccion.query({ client: trx }).where('calculoCarbonoId', id).delete()
        for (const accion of acciones) {
          await AccionReduccion.create(
            {
              calculoCarbonoId: id,
              fuenteEmisionId: accion.fuenteEmisionId ?? null,
              estrategia: accion.estrategia.trim(),
              indicador: accion.indicador.trim(),
              meta: accion.meta.trim(),
            },
            { client: trx }
          )
        }
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo guardar el plan de reducción')
    }

    return this.listarReduccion(id, usuarioId)
  }

  private ficha(calculo: CalculoCarbono) {
    const total = calculo.totalCo2e ?? '0'
    const porAlcance = agruparResultadosPorNombre(
      calculo.resultados.map((linea) => ({
        nombre: linea.alcance?.nombre ?? 'Sin alcance',
        valorCo2e: linea.valorCo2e,
      })),
      total
    )
    const porFuente = agruparResultadosPorNombre(
      calculo.resultados.map((linea) => ({
        nombre: linea.fuenteEmision?.nombre ?? 'Sin fuente',
        valorCo2e: linea.valorCo2e,
      })),
      total
    )
    return {
      id: calculo.id,
      periodoId: calculo.periodoId,
      periodoNombre: calculo.periodo.nombre,
      fechaInicio: fechaTexto(calculo.periodo.fechaInicio),
      totalCo2e: decimalTexto(total),
      toneladasCo2e: decimalTexto(toneladasDesdeKg(total)),
      intensidadCo2e: calculo.unidadesProducidas
        ? decimalTexto(intensidadDesde(total, calculo.unidadesProducidas))
        : null,
      unidadesProducidas: calculo.unidadesProducidas
        ? decimalTexto(calculo.unidadesProducidas)
        : null,
      unidadFuncional: calculo.unidadFuncional,
      unidadResultado: etiquetaUnidadCo2e(calculo.unidadResultado?.simbolo),
      porAlcance,
      porFuente,
      porGas: agruparResultadosPorGas(calculo.resultados, total),
      porActividad: agruparResultadosPorNombre(
        calculo.resultados.map((linea) => ({
          nombre:
            [linea.actividadEmision?.codigo, linea.actividadEmision?.nombre]
              .filter(Boolean)
              .join(' ') || 'Sin actividad de emisión',
          valorCo2e: linea.valorCo2e,
        })),
        total
      ),
      porSubcategoria: agruparResultadosPorNombre(
        calculo.resultados.map((linea) => ({
          nombre:
            [linea.subcategoriaEmision?.codigo, linea.subcategoriaEmision?.nombre]
              .filter(Boolean)
              .join(' ') || 'Sin subcategoría',
          valorCo2e: linea.valorCo2e,
        })),
        total
      ),
    }
  }
}

export function periodoVisible(periodo: PeriodoMedicion) {
  return {
    id: periodo.id,
    nombre: periodo.nombre,
    fechaInicio: fechaTexto(periodo.fechaInicio),
    fechaFin: fechaTexto(periodo.fechaFin),
    estado: periodo.estado,
  }
}
