type GwpRecord = { valor: string }

export type GwpSnapshot = {
  gwpValueId: number | null
  valorGwp: string | null
  gwpHorizonteAnios: number | null
  gwpVersion: string | null
}

export function crearSnapshotGwp(
  gwp: { id: number; valor: string } | null,
  set: { horizonteAnios: number; estandarVersion: string } | null
): GwpSnapshot {
  if (!gwp || !set) {
    return {
      gwpValueId: null,
      valorGwp: null,
      gwpHorizonteAnios: null,
      gwpVersion: null,
    }
  }
  return {
    gwpValueId: gwp.id,
    valorGwp: gwp.valor,
    gwpHorizonteAnios: set.horizonteAnios,
    gwpVersion: set.estandarVersion,
  }
}

export type GwpResolution<T extends GwpRecord> =
  | { status: 'direct' }
  | { status: 'unsupported_species'; gas: string; species: string | null }
  | { status: 'missing_set' }
  | { status: 'missing_value'; code: string }
  | { status: 'found'; code: string; gwp: T }

function normalizarTexto(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
}

function codigoGwp(gas: string, species: string | null): string | null {
  if (gas === 'CO2' || gas === 'N2O') return gas
  if (gas === 'CH4') {
    if (!species) return null
    const especie = normalizarTexto(species)
    const codigos: Record<string, string> = {
      'ch4_biogenic': 'CH4_BIOGENIC',
      'metano biogenico': 'CH4_BIOGENIC',
      'biogenico': 'CH4_BIOGENIC',
      'ch4_fossil_combustion': 'CH4_FOSSIL_COMBUSTION',
      'metano fosil de combustion': 'CH4_FOSSIL_COMBUSTION',
      'fosil de combustion': 'CH4_FOSSIL_COMBUSTION',
      'ch4_fossil_fugitive_process': 'CH4_FOSSIL_FUGITIVE_PROCESS',
      'metano fosil fugitivo o de proceso': 'CH4_FOSSIL_FUGITIVE_PROCESS',
      'fosil fugitivo/proceso': 'CH4_FOSSIL_FUGITIVE_PROCESS',
    }
    return codigos[especie] ?? null
  }
  if (gas === 'OTRO') {
    if (!species) return null
    const code = species.trim()
    const reservado = new Set(['CO2', 'CH4', 'N2O', 'CO2E'])
    if (reservado.has(code.toUpperCase()) || code.toUpperCase().startsWith('CH4_')) return null
    return code
  }
  return null
}

/** Resolves a gas only within the GWP set assigned to the selected version. */
export async function resolverGwpAplicable<T extends GwpRecord>(
  gas: string,
  species: string | null,
  gwpSetId: number | null,
  lookup: (setId: number, gasCode: string) => Promise<T | null>
): Promise<GwpResolution<T>> {
  if (gas === 'CO2E') return { status: 'direct' }

  const code = codigoGwp(gas, species)
  if (!code) return { status: 'unsupported_species', gas, species }
  if (!gwpSetId) return { status: 'missing_set' }

  const gwp = await lookup(gwpSetId, code)
  return gwp ? { status: 'found', code, gwp } : { status: 'missing_value', code }
}
