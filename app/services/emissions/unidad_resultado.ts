import type UnidadMedida from '#models/unidad_medida'
import { Exception } from '@adonisjs/core/exceptions'
import { normalizarMagnitud } from '#services/emissions/unit_conversion_service'

/**
 * Código estable de la unidad en la que se consolidan los resultados (kg).
 * Coincide con el catálogo app/data/unidades_medida_catalogo.ts.
 */
export const CODIGO_UNIDAD_RESULTADO = 'UM-KG'

export type UnidadCandidata = Pick<
  UnidadMedida,
  'id' | 'codigo' | 'simbolo' | 'magnitud' | 'factorBase' | 'estado'
>

const SIMBOLO_KG = /^kg(?:\s*co2e)?$/

function esFactorUno(valor: string) {
  return /^0*1(?:\.0*)?$/.test(String(valor).trim())
}

function esKilogramo(unidad: UnidadCandidata) {
  return normalizarMagnitud(unidad.magnitud) === 'masa' && esFactorUno(unidad.factorBase)
}

function error(message: string): never {
  throw new Exception(message, { status: 422, code: 'E_VALIDATION' })
}

/**
 * Elige la unidad final del cálculo sin depender del orden de los registros:
 *
 * 1. Si existe la unidad con código UM-KG, es la referencia. Debe estar activa
 *    y ser masa con factor base 1; si no lo es, el catálogo está mal
 *    configurado y se rechaza en vez de usar otra en silencio.
 * 2. Si no existe (bases con un kg histórico de otro código), se acepta una
 *    única unidad activa de masa con factor base 1 y símbolo «kg» o «kg CO2e».
 *    Si hay más de una, se rechaza indicando sus ids para que se resuelva.
 */
export function seleccionarUnidadResultado(unidades: readonly UnidadCandidata[]) {
  const referencia = unidades.find((unidad) => unidad.codigo === CODIGO_UNIDAD_RESULTADO)
  if (referencia) {
    if (!referencia.estado) {
      error(
        `La unidad de referencia ${CODIGO_UNIDAD_RESULTADO} está inactiva; reactívela para consolidar resultados`
      )
    }
    if (!esKilogramo(referencia)) {
      error(
        `La unidad de referencia ${CODIGO_UNIDAD_RESULTADO} debe ser de masa con factor base 1 (kg)`
      )
    }
    return referencia
  }

  const candidatas = unidades
    .filter(
      (unidad) =>
        unidad.estado &&
        esKilogramo(unidad) &&
        SIMBOLO_KG.test(unidad.simbolo.trim().toLocaleLowerCase())
    )
    .sort((a, b) => a.id - b.id)
  if (candidatas.length === 1) return candidatas[0]
  if (candidatas.length === 0) {
    error('Configura una unidad de masa base en kilogramos para consolidar resultados')
  }
  error(
    `Hay ${candidatas.length} unidades kg activas equivalentes (ids ${candidatas
      .map((unidad) => unidad.id)
      .join(', ')}); registre la unidad ${CODIGO_UNIDAD_RESULTADO} o desactive las sobrantes`
  )
}

/** Etiqueta del resultado: siempre es masa de CO2 equivalente. */
export function etiquetaUnidadCo2e(simbolo: string | null | undefined) {
  if (!simbolo) return null
  return /co2e/i.test(simbolo) ? simbolo : `${simbolo} CO2e`
}
