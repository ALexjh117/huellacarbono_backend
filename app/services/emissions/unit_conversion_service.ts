import UnidadMedida from '#models/unidad_medida'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'

/** Escala de cantidades: coincide con DECIMAL(24, 8) de datos y resultados. */
const SCALE = 8
/** Escala de factores base, factores directos y parámetros: DECIMAL(24, 12). */
const FACTOR_SCALE = 12
const QUANTITY_INTEGER_DIGITS = 16
const FACTOR_INTEGER_DIGITS = 12

type UnidadConvertible = Pick<
  UnidadMedida,
  'id' | 'codigo' | 'magnitud' | 'factorBase' | 'estado'
> & {
  simbolo?: string
}
type ConversionDirecta = {
  tipo: string
  factor: string | number
  parametro_codigo: string | null
}

/** Valor y unidad de un parámetro físico aportado por quien registra el dato. */
export type ParametroFisico = { valor: string; unidadId: number }

/**
 * Parámetros físicos que algunas conversiones necesitan. El servicio nunca
 * supone valores por defecto: si la conversión los requiere y faltan, falla.
 */
export type ParametrosConversion = {
  densidad?: ParametroFisico
  poderCalorifico?: ParametroFisico
}

type UnitConversionDependencies = {
  findUnit: (id: number) => Promise<UnidadConvertible | null>
  findConversion: (sourceId: number, targetId: number) => Promise<ConversionDirecta | null>
}

const defaultDependencies: UnitConversionDependencies = {
  findUnit: (id) => UnidadMedida.find(id),
  findConversion: async (sourceId, targetId) =>
    db
      .from('conversion_unidad')
      .where('id_unidad_origen', sourceId)
      .where('id_unidad_destino', targetId)
      .where('estado', true)
      .first(),
}

/** Magnitudes canónicas (minúsculas, sin tildes) usadas por el catálogo. */
export const MAGNITUDES = {
  MASA: 'masa',
  VOLUMEN: 'volumen',
  ENERGIA: 'energia',
  DENSIDAD: 'densidad',
  PODER_CALORIFICO_MASICO: 'poder calorifico masico',
  PODER_CALORIFICO_VOLUMETRICO: 'poder calorifico volumetrico',
} as const

type RelacionFisica = {
  parametro: keyof ParametrosConversion
  nombreParametro: string
  magnitudParametro: string
  operacion: 'MULTIPLICAR' | 'DIVIDIR'
}

/**
 * Relaciones físicas exactas entre magnitudes distintas. Sólo definen la
 * operación; el valor del parámetro siempre lo aporta el usuario.
 *
 * Las unidades base son coherentes entre sí (kg, L, MJ, kg/L, MJ/kg, MJ/L), de
 * modo que, expresado todo en base: masa = volumen × densidad,
 * energía = masa × PC másico y energía = volumen × PC volumétrico.
 */
const RELACIONES_FISICAS: Record<string, RelacionFisica> = {
  'volumen>masa': {
    parametro: 'densidad',
    nombreParametro: 'densidad',
    magnitudParametro: MAGNITUDES.DENSIDAD,
    operacion: 'MULTIPLICAR',
  },
  'masa>volumen': {
    parametro: 'densidad',
    nombreParametro: 'densidad',
    magnitudParametro: MAGNITUDES.DENSIDAD,
    operacion: 'DIVIDIR',
  },
  'masa>energia': {
    parametro: 'poderCalorifico',
    nombreParametro: 'poder calorífico másico',
    magnitudParametro: MAGNITUDES.PODER_CALORIFICO_MASICO,
    operacion: 'MULTIPLICAR',
  },
  'energia>masa': {
    parametro: 'poderCalorifico',
    nombreParametro: 'poder calorífico másico',
    magnitudParametro: MAGNITUDES.PODER_CALORIFICO_MASICO,
    operacion: 'DIVIDIR',
  },
  'volumen>energia': {
    parametro: 'poderCalorifico',
    nombreParametro: 'poder calorífico volumétrico',
    magnitudParametro: MAGNITUDES.PODER_CALORIFICO_VOLUMETRICO,
    operacion: 'MULTIPLICAR',
  },
  'energia>volumen': {
    parametro: 'poderCalorifico',
    nombreParametro: 'poder calorífico volumétrico',
    magnitudParametro: MAGNITUDES.PODER_CALORIFICO_VOLUMETRICO,
    operacion: 'DIVIDIR',
  },
}

export function normalizarMagnitud(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

const DECIMAL_POSITIVO = /^(?:0|[1-9]\d*)(?:\.\d+)?$/

function validationError(message: string): never {
  throw new Exception(message, { status: 422, code: 'E_VALIDATION' })
}

function scaled(value: string, scale: number, integerDigits: number): bigint {
  if (typeof value !== 'string' || !DECIMAL_POSITIVO.test(value.trim())) {
    validationError('La conversión requiere valores decimales positivos válidos')
  }
  const [whole, fraction = ''] = value.trim().split('.')
  if (fraction.length > scale || whole.length > integerDigits) {
    validationError(`El valor excede la precisión admitida de ${scale} decimales`)
  }
  return BigInt(`${whole}${fraction.padEnd(scale, '0')}`)
}

function formatScaled(value: bigint, scale: number): string {
  const digits = value.toString().padStart(scale + 1, '0')
  const integer = digits.slice(0, -scale).replace(/^0+(?=\d)/, '')
  const fraction = digits.slice(-scale).replace(/0+$/, '')
  return fraction ? `${integer}.${fraction}` : integer
}

/**
 * Fracción exacta con enteros arbitrarios. Todas las multiplicaciones y
 * divisiones intermedias se hacen sin redondeo; sólo se redondea una vez
 * (mitad hacia arriba) al producir el resultado con 8 decimales.
 */
class Fraccion {
  constructor(
    readonly num: bigint,
    readonly den: bigint
  ) {}

  static decimal(valor: bigint, escala: number) {
    return new Fraccion(valor, 10n ** BigInt(escala))
  }

  por(otra: Fraccion) {
    return new Fraccion(this.num * otra.num, this.den * otra.den)
  }

  entre(otra: Fraccion) {
    return new Fraccion(this.num * otra.den, this.den * otra.num)
  }

  redondear(escala: number) {
    const numerador = this.num * 10n ** BigInt(escala)
    return (numerador + this.den / 2n) / this.den
  }
}

function etiqueta(unit: UnidadConvertible) {
  return unit.simbolo?.trim() || unit.codigo
}

/**
 * Convierte cantidades entre unidades del catálogo.
 *
 * - Misma magnitud: usa una conversión DIRECTA documentada si existe; si no,
 *   la razón de factores base.
 * - Magnitudes distintas: sólo las relaciones físicas declaradas arriba y
 *   únicamente con el parámetro (valor y unidad) aportado por el usuario.
 * - Nunca supone densidades, poderes caloríficos ni conversiones ausentes.
 */
export default class UnitConversionService {
  constructor(private readonly dependencies: UnitConversionDependencies = defaultDependencies) {}

  async convert(
    amount: string,
    sourceId: number,
    targetId: number,
    parametros: ParametrosConversion = {}
  ): Promise<string> {
    const { valor } = await this.convertirConDetalle(amount, sourceId, targetId, parametros)
    return valor
  }

  /**
   * Igual que `convert`, pero informa qué parámetro físico se usó de verdad,
   * para guardarlo como evidencia del cálculo.
   */
  async convertirConDetalle(
    amount: string,
    sourceId: number,
    targetId: number,
    parametros: ParametrosConversion = {}
  ): Promise<{ valor: string; parametrosUsados: ParametrosConversion }> {
    const sinParametros = (valor: string) => ({ valor, parametrosUsados: {} })
    // Valida la cantidad antes que nada, incluso en una conversión identidad.
    const cantidad = scaled(amount, SCALE, QUANTITY_INTEGER_DIGITS)
    const [source, target] = await Promise.all([
      this.dependencies.findUnit(sourceId),
      this.dependencies.findUnit(targetId),
    ])
    const origen = this.assertUsable(source, sourceId, 'origen')
    const destino = this.assertUsable(target, targetId, 'destino')

    if (sourceId === targetId) return sinParametros(amount.trim())

    const magnitudOrigen = normalizarMagnitud(origen.magnitud)
    const magnitudDestino = normalizarMagnitud(destino.magnitud)

    if (magnitudOrigen === magnitudDestino) {
      const [direct, reverse] = await Promise.all([
        this.dependencies.findConversion(sourceId, targetId),
        this.dependencies.findConversion(targetId, sourceId),
      ])

      if (direct) {
        const factor = this.assertDirect(direct, origen, destino)
        return sinParametros(this.finish(cantidad, Fraccion.decimal(cantidad, SCALE).por(factor)))
      }

      // Una fila DIRECTA es un escalar lineal positivo y se puede invertir de
      // forma exacta. Una conversión con parámetros nunca se invierte sola.
      if (reverse) {
        const factor = this.assertDirect(reverse, origen, destino, true)
        return sinParametros(this.finish(cantidad, Fraccion.decimal(cantidad, SCALE).entre(factor)))
      }

      const enBase = Fraccion.decimal(cantidad, SCALE).por(this.base(origen))
      return sinParametros(this.finish(cantidad, enBase.entre(this.base(destino))))
    }

    const relacion = RELACIONES_FISICAS[`${magnitudOrigen}>${magnitudDestino}`]
    if (!relacion) {
      validationError(
        `No se pueden convertir ${origen.magnitud} a ${destino.magnitud}: son magnitudes incompatibles`
      )
    }

    const aportado = parametros[relacion.parametro]
    const parametro = await this.resolverParametro(relacion, aportado, { origen, destino })
    let enBase = Fraccion.decimal(cantidad, SCALE).por(this.base(origen))
    enBase = relacion.operacion === 'MULTIPLICAR' ? enBase.por(parametro) : enBase.entre(parametro)
    return {
      valor: this.finish(cantidad, enBase.entre(this.base(destino))),
      // resolverParametro ya garantizó que el parámetro existe y es válido.
      parametrosUsados: {
        [relacion.parametro]: {
          valor: String(aportado!.valor).trim(),
          unidadId: aportado!.unidadId,
        },
      },
    }
  }

  private assertUsable(
    unit: UnidadConvertible | null,
    id: number,
    rol: 'origen' | 'destino'
  ): UnidadConvertible {
    if (!unit) {
      validationError(`La unidad ${rol} (id ${id}) no existe o está inactiva`)
    }
    if (!unit.estado) {
      validationError(`La unidad ${rol} ${etiqueta(unit)} no existe o está inactiva`)
    }
    return unit
  }

  /** Valida y devuelve el factor base de la unidad como fracción exacta. */
  private base(unit: UnidadConvertible) {
    const raw = String(unit.factorBase ?? '').trim()
    if (!DECIMAL_POSITIVO.test(raw)) {
      validationError(`La unidad ${etiqueta(unit)} tiene un factor base inválido`)
    }
    const [whole, fraction = ''] = raw.split('.')
    if (whole.length > FACTOR_INTEGER_DIGITS || fraction.length > FACTOR_SCALE) {
      validationError(
        `El factor base de ${etiqueta(unit)} excede la precisión admitida (DECIMAL 24,12)`
      )
    }
    const valor = scaled(raw, FACTOR_SCALE, FACTOR_INTEGER_DIGITS)
    if (valor <= 0n) {
      validationError(`La unidad ${etiqueta(unit)} tiene un factor base inválido`)
    }
    return Fraccion.decimal(valor, FACTOR_SCALE)
  }

  private async resolverParametro(
    relacion: RelacionFisica,
    parametro: ParametroFisico | undefined,
    contexto: { origen: UnidadConvertible; destino: UnidadConvertible }
  ) {
    const conversion = `${etiqueta(contexto.origen)} (${contexto.origen.magnitud}) → ${etiqueta(
      contexto.destino
    )} (${contexto.destino.magnitud})`
    if (!parametro || parametro.valor === undefined || parametro.valor === null) {
      validationError(
        `No se pueden convertir ${conversion} sin datos adicionales: la conversión requiere el parámetro ${relacion.nombreParametro} con su unidad`
      )
    }
    const valorTexto = String(parametro.valor).trim()
    if (!DECIMAL_POSITIVO.test(valorTexto)) {
      validationError(
        `El parámetro ${relacion.nombreParametro} debe ser un decimal positivo válido`
      )
    }
    const valor = scaled(valorTexto, FACTOR_SCALE, FACTOR_INTEGER_DIGITS)
    if (valor <= 0n) {
      validationError(`El parámetro ${relacion.nombreParametro} debe ser mayor que cero`)
    }
    if (!Number.isInteger(parametro.unidadId) || parametro.unidadId < 1) {
      validationError(`El parámetro ${relacion.nombreParametro} requiere una unidad válida`)
    }
    const unidad = await this.dependencies.findUnit(parametro.unidadId)
    if (!unidad || !unidad.estado) {
      validationError(
        `La unidad del parámetro ${relacion.nombreParametro} no existe o está inactiva`
      )
    }
    if (normalizarMagnitud(unidad.magnitud) !== relacion.magnitudParametro) {
      validationError(
        `La unidad ${etiqueta(unidad)} no corresponde a ${relacion.nombreParametro} (se esperaba magnitud ${relacion.magnitudParametro})`
      )
    }
    return Fraccion.decimal(valor, FACTOR_SCALE).por(this.base(unidad))
  }

  /** Redondea una sola vez y controla desbordes y subdesbordes. */
  private finish(cantidad: bigint, resultado: Fraccion) {
    const redondeado = resultado.redondear(SCALE)
    if ((redondeado / 10n ** BigInt(SCALE)).toString().length > QUANTITY_INTEGER_DIGITS) {
      validationError('El resultado excede la precisión admitida')
    }
    if (cantidad > 0n && redondeado === 0n) {
      validationError(
        `El resultado es menor que la precisión admitida de ${SCALE} decimales; registre la cantidad en una unidad más pequeña`
      )
    }
    return formatScaled(redondeado, SCALE)
  }

  private assertDirect(
    conversion: ConversionDirecta,
    origen: UnidadConvertible,
    destino: UnidadConvertible,
    inversa = false
  ) {
    if (conversion.tipo !== 'DIRECTA') {
      const parametro = conversion.parametro_codigo ?? 'definido por la regla'
      validationError(
        inversa
          ? `No hay conversión ${etiqueta(origen)} → ${etiqueta(destino)}; la regla inversa requiere el parámetro ${parametro} y no se invierte automáticamente`
          : `La conversión ${etiqueta(origen)} → ${etiqueta(destino)} requiere el parámetro ${parametro}`
      )
    }
    const factor = scaled(String(conversion.factor), FACTOR_SCALE, FACTOR_INTEGER_DIGITS)
    // El esquema exige factor > 0; se vuelve a comprobar antes de operar.
    if (factor <= 0n) {
      validationError('El factor de conversión debe ser mayor que cero')
    }
    return Fraccion.decimal(factor, FACTOR_SCALE)
  }
}

/**
 * Extrae los parámetros de conversión guardados en `parametros_calculo` de un
 * dato de actividad. Sólo usa pares completos valor + unidad.
 */
export function parametrosConversionDesde(
  parametros: Record<string, unknown> | null | undefined
): ParametrosConversion {
  if (!parametros) return {}
  const par = (valor: unknown, unidad: unknown): ParametroFisico | undefined => {
    if (valor === undefined || valor === null || valor === '') return undefined
    return { valor: String(valor), unidadId: Number(unidad) }
  }
  const resultado: ParametrosConversion = {}
  const densidad = par(parametros.densidad, parametros.unidadDensidadId)
  const poderCalorifico = par(parametros.poderCalorifico, parametros.unidadPoderCalorificoId)
  if (densidad) resultado.densidad = densidad
  if (poderCalorifico) resultado.poderCalorifico = poderCalorifico
  return resultado
}
