import { Exception } from '@adonisjs/core/exceptions'

export type MethodParameters = {
  consumoEspecifico?: string | number
  unidadConsumoId?: number
  unidadDistanciaId?: number
}

type Methodology = {
  nombre: string
  magnitudes: string[]
}

const METHODS: Record<string, Methodology> = {
  COMBUSTION_FIJA: {
    nombre: 'Combustión fija por consumo de combustible',
    magnitudes: ['masa', 'volumen', 'energia'],
  },
  COMBUSTION_MOVIL: {
    nombre: 'Combustión móvil por combustible o distancia',
    magnitudes: ['masa', 'volumen', 'energia', 'distancia'],
  },
  PROCESO_INDUSTRIAL: {
    nombre: 'Proceso industrial por material o producción',
    magnitudes: ['masa', 'volumen', 'produccion'],
  },
  EMISION_FUGITIVA: {
    nombre: 'Emisión fugitiva por cantidad liberada',
    magnitudes: ['masa', 'volumen'],
  },
  ELECTRICIDAD: { nombre: 'Electricidad adquirida por energía consumida', magnitudes: ['energia'] },
  AGRICULTURA_USO_SUELO: {
    nombre: 'Agricultura y uso del suelo por actividad cuantificada',
    magnitudes: ['masa', 'volumen', 'produccion', 'area'],
  },
  BIENES_SERVICIOS: {
    nombre: 'Bienes y servicios por unidad de actividad',
    magnitudes: ['masa', 'volumen', 'energia', 'produccion'],
  },
  TRANSPORTE: {
    nombre: 'Transporte por unidad de actividad documentada',
    // 'transporte de carga' (t·km) es la magnitud del catálogo de unidades;
    // 'transporte' se conserva por compatibilidad con unidades anteriores.
    magnitudes: ['distancia', 'masa', 'volumen', 'transporte', 'transporte de carga'],
  },
  RESIDUOS: { nombre: 'Residuos por masa o volumen tratado', magnitudes: ['masa', 'volumen'] },
  VIAJES: {
    nombre: 'Viajes de negocio por unidad de transporte documentada',
    magnitudes: ['distancia', 'transporte', 'transporte de pasajeros'],
  },
  MOVILIDAD: {
    nombre: 'Movilidad de empleados por unidad de transporte documentada',
    magnitudes: ['distancia', 'transporte', 'transporte de pasajeros'],
  },
  USO_PRODUCTOS: {
    nombre: 'Uso de productos vendidos por actividad documentada',
    magnitudes: ['masa', 'volumen', 'energia', 'produccion'],
  },
  FIN_VIDA_PRODUCTOS: {
    nombre: 'Fin de vida por masa o volumen tratado',
    magnitudes: ['masa', 'volumen'],
  },
  ACTIVOS_ARRENDADOS: {
    nombre: 'Activos arrendados por actividad documentada',
    magnitudes: ['masa', 'volumen', 'energia', 'produccion'],
  },
}

const METHOD_BY_ACTIVITY: Record<string, string> = {
  A1: 'COMBUSTION_FIJA',
  A2: 'COMBUSTION_MOVIL',
  A3: 'PROCESO_INDUSTRIAL',
  A4: 'EMISION_FUGITIVA',
  A5: 'AGRICULTURA_USO_SUELO',
  B1: 'ELECTRICIDAD',
  C1: 'BIENES_SERVICIOS',
  C2: 'TRANSPORTE',
  C3: 'RESIDUOS',
  C4: 'VIAJES',
  C5: 'MOVILIDAD',
  C6: 'TRANSPORTE',
  C7: 'USO_PRODUCTOS',
  C8: 'FIN_VIDA_PRODUCTOS',
  C13: 'ACTIVOS_ARRENDADOS',
}

function normalizarMagnitud(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}

export function resolverMetodologia(actividadCodigo: string, reglaTipo?: string | null) {
  const codigo = (reglaTipo ?? METHOD_BY_ACTIVITY[actividadCodigo] ?? '').toUpperCase()
  const method = METHODS[codigo]
  if (!method) {
    throw new Exception(`No hay una metodología ejecutable configurada para ${actividadCodigo}`, {
      status: 422,
      code: 'E_VALIDATION',
    })
  }
  return { codigo, ...method }
}

const DATO_POR_METODO: Record<string, string> = {
  COMBUSTION_FIJA: 'Combustible consumido',
  COMBUSTION_MOVIL: 'Combustible consumido o distancia recorrida',
  PROCESO_INDUSTRIAL: 'Material procesado o producción',
  EMISION_FUGITIVA: 'Cantidad liberada',
  ELECTRICIDAD: 'Energía eléctrica consumida',
  AGRICULTURA_USO_SUELO: 'Actividad agropecuaria o de uso del suelo',
  BIENES_SERVICIOS: 'Cantidad del bien o servicio adquirido',
  TRANSPORTE: 'Actividad de transporte',
  RESIDUOS: 'Residuo tratado',
  VIAJES: 'Viaje de negocio',
  MOVILIDAD: 'Desplazamiento de empleados',
  USO_PRODUCTOS: 'Uso del producto vendido',
  FIN_VIDA_PRODUCTOS: 'Producto al final de su vida',
  ACTIVOS_ARRENDADOS: 'Actividad del activo arrendado',
}

const UNIDAD_POR_MAGNITUD: Record<string, string> = {
  masa: 'masa (kg, t)',
  volumen: 'volumen (L, m³, gal)',
  energia: 'energía (kWh, MWh)',
  distancia: 'distancia (km)',
  produccion: 'producción',
  area: 'área',
  transporte: 'transporte',
  'transporte de carga': 'transporte de carga (t·km)',
  'transporte de pasajeros': 'transporte de pasajeros',
}

export type RequisitosCalculoFuente = {
  estado: 'EJECUTABLE' | 'PENDIENTE_METODOLOGIA'
  metodologia: string
  datos: string
  unidades: string
  factor: string
  pendiente: string
}

/** Ficha que el formulario muestra al elegir una fuente. Sale de la metodología de su actividad. */
export function requisitosCalculoFuente(codigosActividad: readonly string[]): RequisitosCalculoFuente {
  const metodos = codigosActividad.flatMap((codigo) => {
    try {
      return [resolverMetodologia(codigo)]
    } catch {
      return []
    }
  })
  if (!metodos.length) {
    return {
      estado: 'PENDIENTE_METODOLOGIA',
      metodologia: 'Sin metodología ejecutable para esta fuente',
      datos: 'El dato se puede guardar como evidencia',
      unidades: 'El cálculo no aplicará una unidad hasta que exista método',
      factor: 'No hay un método que aplique un factor',
      pendiente: 'Esta fuente no tiene una metodología de cálculo implementada.',
    }
  }
  const metodo = metodos[0]
  return {
    estado: 'EJECUTABLE',
    metodologia: metodo.nombre,
    datos: DATO_POR_METODO[metodo.codigo] ?? 'Cantidad de actividad del periodo',
    unidades: metodo.magnitudes.map((magnitud) => UNIDAD_POR_MAGNITUD[magnitud] ?? magnitud).join(', '),
    factor:
      'Factor aprobado de la versión elegida, vigente en la fecha del dato, con salida en masa de CO2e',
    pendiente:
      metodo.codigo === 'COMBUSTION_MOVIL'
        ? 'Si registras distancia, también hace falta el consumo específico y su unidad.'
        : '',
  }
}

export type ResumenFactorFuente = {
  variantes: string[]
  unidades: string[]
  gases: string[]
  anios: number[]
}

export type CampoOpcionFactor = {
  campo: 'opcionFactor'
  etiqueta: string
  tipo: 'seleccion'
  requerido: true
  ayuda: string
  opciones: { valor: string; texto: string }[]
}

export function etiquetaVariante(codigo: string) {
  return codigo.replace(/_/g, ' ')
}

/**
 * Completa la ficha con lo que sí está cargado: unidades, gases, años y, si hay
 * más de una, la lista para elegir la opción de factor.
 */
export function fichaConCatalogo(
  base: RequisitosCalculoFuente,
  resumen: ResumenFactorFuente | null
): { requisitos: RequisitosCalculoFuente; camposParametros: CampoOpcionFactor[] } {
  if (!resumen || resumen.unidades.length + resumen.variantes.length + resumen.gases.length === 0) {
    return {
      requisitos: {
        ...base,
        pendiente: base.pendiente || 'No hay un factor aprobado cargado para esta fuente.',
      },
      camposParametros: [],
    }
  }
  const anios = resumen.anios.length ? ` Años con factor: ${resumen.anios.join(', ')}.` : ''
  const gases = resumen.gases.length ? ` Gases: ${resumen.gases.join(', ')}.` : ''
  const varias = resumen.variantes.length > 1
  const factor = varias
    ? `Hay ${resumen.variantes.length} opciones de factor. Elige la que corresponde al dato.${anios}${gases}`
    : resumen.variantes[0]
      ? `Opción ${etiquetaVariante(resumen.variantes[0])}. Salida en masa de CO2e.${anios}${gases}`
      : `${base.factor}.${anios}${gases}`
  return {
    requisitos: {
      ...base,
      unidades: resumen.unidades.length ? resumen.unidades.join(', ') : base.unidades,
      factor,
      pendiente: varias
        ? 'Selecciona la opción de factor. Sin ella hay varios factores vigentes y el cálculo no elige uno.'
        : base.pendiente,
    },
    camposParametros: varias
      ? [
          {
            campo: 'opcionFactor',
            etiqueta: 'Opción de factor',
            tipo: 'seleccion',
            requerido: true,
            ayuda: 'Cada opción tiene su propio factor aprobado. El cálculo usa solo la que declares.',
            opciones: resumen.variantes.map((valor) => ({ valor, texto: etiquetaVariante(valor) })),
          },
        ]
      : [],
  }
}

/** Returns activity in the factor's input unit; it never guesses properties. */
export async function actividadParaFactor(
  methodologyCode: string,
  activityQuantity: string,
  activityMagnitude: string,
  factorUnitId: number,
  parameters: MethodParameters,
  convert: (amount: string, sourceId: number, targetId: number) => Promise<string>,
  activityUnitId: number,
  factorUnitMagnitude?: string
) {
  const method = METHODS[methodologyCode]
  if (!method) throw new Error(`Metodología no soportada: ${methodologyCode}`)
  const magnitude = normalizarMagnitud(activityMagnitude)
  if (!method.magnitudes.includes(magnitude)) {
    throw new Exception(
      `La metodología ${methodologyCode} no admite unidades de ${activityMagnitude}`,
      {
        status: 422,
        code: 'E_VALIDATION',
      }
    )
  }

  const factorMagnitude = factorUnitMagnitude ? normalizarMagnitud(factorUnitMagnitude) : null
  if (
    methodologyCode === 'COMBUSTION_MOVIL' &&
    magnitude === 'distancia' &&
    factorMagnitude !== 'distancia'
  ) {
    if (
      !parameters.consumoEspecifico ||
      !parameters.unidadConsumoId ||
      !parameters.unidadDistanciaId
    ) {
      throw new Exception(
        'La combustión móvil por distancia requiere consumoEspecifico, unidadConsumoId y unidadDistanciaId',
        {
          status: 422,
          code: 'E_VALIDATION',
        }
      )
    }
    if (Number(parameters.consumoEspecifico) <= 0) {
      throw new Exception('El consumo específico debe ser mayor que cero', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    const distanciaConvertida = await convert(
      activityQuantity,
      activityUnitId,
      parameters.unidadDistanciaId
    )
    const consumoCalculado = multiplyDecimal(
      distanciaConvertida,
      String(parameters.consumoEspecifico)
    )
    return convert(consumoCalculado, parameters.unidadConsumoId, factorUnitId)
  }
  return convert(activityQuantity, activityUnitId, factorUnitId)
}

function multiplyDecimal(left: string, right: string) {
  const parse = (value: string) => {
    if (!/^\d+(?:\.\d{1,12})?$/.test(value)) {
      throw new Exception('El consumo específico debe ser un decimal positivo válido', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    const [integer, fraction = ''] = value.split('.')
    return { value: BigInt(`${integer}${fraction.padEnd(12, '0')}`), scale: 12 }
  }
  const a = parse(left)
  const b = parse(right)
  const product = a.value * b.value
  const divisor = 10n ** BigInt(a.scale + b.scale - 8)
  const rounded = (product + divisor / 2n) / divisor
  const digits = rounded.toString().padStart(9, '0')
  const whole = digits.slice(0, -8).replace(/^0+(?=\d)/, '')
  const fraction = digits.slice(-8).replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole
}

export const METODOLOGIAS_CALCULO = METHODS
