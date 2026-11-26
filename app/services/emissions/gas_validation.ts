import { Exception } from '@adonisjs/core/exceptions'

export type GasEmision = 'CO2' | 'CH4' | 'N2O' | 'CO2E' | 'OTRO'

export function normalizarEspecieGas(gasEspecifico?: string | null): string | null {
  return gasEspecifico?.trim() || null
}

/** Applies the same gas/species contract enforced by factor_emision's CHECK. */
export function validarEspecieGas(gas: string, gasEspecifico?: string | null): string | null {
  const especie = normalizarEspecieGas(gasEspecifico)

  if ((gas === 'CH4' || gas === 'OTRO') && !especie) {
    const mensaje =
      gas === 'CH4'
        ? 'Un factor CH4 requiere identificar su especie para aplicar el GWP correcto'
        : 'Un factor de OTRO gas requiere identificar la especie gaseosa'
    throw new Exception(mensaje, { status: 422, code: 'E_VALIDATION' })
  }

  if (gas !== 'CH4' && gas !== 'OTRO' && especie) {
    throw new Exception(`El gas ${gas} no admite una especie adicional`, {
      status: 422,
      code: 'E_VALIDATION',
    })
  }

  return especie
}
