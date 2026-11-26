
export type GasCandidate = {
  gas: string
  gasEspecifico: string | null
  region?: string | null
  sectorCategoria?: string | null
  anioAplicacion?: number | null
}

export type FactorCandidateGroups<T extends GasCandidate> = {
  porGas: Map<string, T[]>
  error: string | null
}

function normalizarDimensionTexto(value?: string | null): string | null {
  if (!value?.trim()) return null

  const normalized = value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()

  // CO y COLOMBIA representan la misma región.
  return normalized === 'colombia' ? 'co' : normalized
}

function dimensionesSeSolapan(a: GasCandidate, b: GasCandidate): boolean {
  const regionA = normalizarDimensionTexto(a.region)
  const regionB = normalizarDimensionTexto(b.region)

  const sectorA = normalizarDimensionTexto(a.sectorCategoria)
  const sectorB = normalizarDimensionTexto(b.sectorCategoria)

  const anioA = a.anioAplicacion ?? null
  const anioB = b.anioAplicacion ?? null

  const regionesCompatibles =
    regionA === null || regionB === null || regionA === regionB

  const sectoresCompatibles =
    sectorA === null || sectorB === null || sectorA === sectorB

  const aniosCompatibles =
    anioA === null || anioB === null || anioA === anioB

  return regionesCompatibles && sectoresCompatibles && aniosCompatibles
}

/**
 * Groups applicable factor candidates by gas/species.
 * Candidates with overlapping dimensions are ambiguous and must not be selected.
 */
export function agruparCandidatosPorGas<T extends GasCandidate>(
  candidatos: T[]
): FactorCandidateGroups<T> {
  const porGas = new Map<string, T[]>()

  for (const candidato of candidatos) {
    const key = `${candidato.gas}:${candidato.gasEspecifico?.trim() || ''}`
    const list = porGas.get(key) ?? []
    list.push(candidato)
    porGas.set(key, list)
  }

  if ([...porGas.keys()].some((key) => key.startsWith('CO2E:')) && porGas.size > 1) {
    return {
      porGas,
      error: 'No se pueden mezclar factores CO2e directos con factores por gas',
    }
  }

  const porGasBase = new Map<string, T[]>()

  for (const candidato of candidatos) {
    const mismoGas = porGasBase.get(candidato.gas) ?? []
    mismoGas.push(candidato)
    porGasBase.set(candidato.gas, mismoGas)
  }

  for (const items of porGasBase.values()) {
    if (items.length < 2) continue

    // No se permite resolver automáticamente especies distintas del mismo gas.
    const especies = new Set(
      items.map((item) => item.gasEspecifico?.trim().toLocaleLowerCase() || '')
    )

    if (especies.size > 1) {
      return {
        porGas,
        error: 'Hay más de un factor aprobado y vigente para el mismo gas; no se puede desambiguar',
      }
    }

    // Dos factores de la misma especie solo son ambiguos si sus dimensiones se solapan.
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (dimensionesSeSolapan(items[i], items[j])) {
          return {
            porGas,
            error: 'Hay más de un factor aprobado y vigente para el mismo gas; no se puede desambiguar',
          }
        }
      }
    }
  }

  return { porGas, error: null }
}
