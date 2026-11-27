import { resolverMetodologia } from '#services/emissions/calculation_methodologies'
import { normalizarMagnitud } from '#services/emissions/unit_conversion_service'

/**
 * Regla temporal de la cobertura preliminar. Replica el motor
 * (calculo_carbono_service): la vigencia debe cubrir todo el intervalo y, si
 * el factor declara año de aplicación, ese año tiene que ser el del intervalo.
 * Un factor de otro año no se extiende.
 */
export function factorCubreIntervalo(
  factor: {
    fechaInicio: string
    fechaFin: string | null
    anioAplicacion: number | null
  },
  desde: string,
  hasta: string
) {
  if (factor.fechaInicio > desde) return false
  const fin = factor.fechaFin ?? (factor.anioAplicacion ? `${factor.anioAplicacion}-12-31` : null)
  if (fin && fin < hasta) return false
  if (factor.anioAplicacion == null) return true
  const anioDesde = Number(desde.slice(0, 4))
  const anioHasta = Number(hasta.slice(0, 4))
  return factor.anioAplicacion === anioDesde && factor.anioAplicacion === anioHasta
}

/** Igual que el motor: sin región aplica; solo Colombia se acepta como región explícita. */
export function regionAplica(region: string | null) {
  if (!region?.trim()) return true
  return ['CO', 'COLOMBIA'].includes(region.trim().toUpperCase())
}

/**
 * Sin sector en el factor aplica a cualquier organización. Con sector, solo
 * si coincide con el de la organización consultada.
 */
export function sectorAplica(sectorFactor: string | null, sectorOrganizacion: string | null) {
  if (!sectorFactor?.trim()) return true
  if (!sectorOrganizacion?.trim()) return false
  return (
    sectorFactor.trim().toLocaleLowerCase() === sectorOrganizacion.trim().toLocaleLowerCase()
  )
}

/**
 * La unidad de entrada tiene que ser una magnitud que la metodología de alguna
 * actividad vinculada admite, y la salida tiene que ser masa para consolidar.
 */
export function unidadCompatibleConActividades(
  magnitudEntrada: string,
  magnitudSalida: string,
  actividades: readonly string[]
) {
  if (normalizarMagnitud(magnitudSalida) !== 'masa') return false
  const entrada = normalizarMagnitud(magnitudEntrada)
  return actividades.some((codigo) => {
    try {
      return resolverMetodologia(codigo).magnitudes.includes(entrada)
    } catch {
      return false
    }
  })
}
