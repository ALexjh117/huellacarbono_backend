import { test } from '@japa/runner'
import {
  conflictosInternos,
  vigenciasSeSolapan,
  type FilaComparable,
} from '#services/importacion_factor_service'

const fila = (numero: number, cambios: Partial<FilaComparable> = {}): FilaComparable => ({
  fila: numero,
  versionId: 1,
  fuenteEmisionId: 10,
  unidadEntradaId: 20,
  codigo: `FE-${numero}`,
  gas: 'CO2E',
  gasEspecifico: null,
  region: null,
  sectorCategoria: null,
  anioAplicacion: 2026,
  inicio: '2026-01-01',
  fin: null,
  ...cambios,
})

test.group('importación de factores: vigencias', () => {
  test('detecta vigencias inclusivas superpuestas y abiertas', ({ assert }) => {
    assert.isTrue(vigenciasSeSolapan('2026-01-01', null, '2027-01-01', null))
    assert.isTrue(vigenciasSeSolapan('2026-01-01', '2026-12-31', '2026-12-31', null))
    assert.isFalse(vigenciasSeSolapan('2026-01-01', '2026-06-30', '2026-07-01', '2026-12-31'))
  })
})

test.group('importación de factores: duplicados dentro del archivo', () => {
  test('marca la segunda fila con las mismas condiciones y vigencia superpuesta', ({ assert }) => {
    const conflictos = conflictosInternos([
      fila(1),
      fila(2, { codigo: 'OTRO', region: '  co  ', inicio: '2026-03-01' }),
    ])
    // region '  co  ' ≠ null: dimensiones distintas, no es duplicado.
    assert.equal(conflictos.size, 0)

    const repetidas = conflictosInternos([
      fila(1, { region: 'Colombia' }),
      fila(2, { codigo: 'OTRO', region: '  COLOMBIA ', inicio: '2026-03-01' }),
    ])
    assert.match(repetidas.get(2)!, /Duplica la fila 1/)
    assert.isFalse(repetidas.has(1))
  })

  test('marca el mismo código y fecha de inicio aunque cambien las dimensiones', ({ assert }) => {
    const conflictos = conflictosInternos([
      fila(1, { codigo: 'fe-gas' }),
      fila(2, { codigo: 'FE-GAS', fuenteEmisionId: 99 }),
    ])
    assert.isTrue(conflictos.has(2))
  })

  test('permite filas que sólo difieren en sector, año, gas o vigencia', ({ assert }) => {
    const conflictos = conflictosInternos([
      fila(1, { sectorCategoria: 'Manufactura' }),
      fila(2, { sectorCategoria: 'Transporte' }),
      fila(3, { anioAplicacion: 2027, inicio: '2027-01-01' }),
      fila(4, { gas: 'CH4', gasEspecifico: 'CH4_FOSSIL_COMBUSTION' }),
      fila(5, { fin: '2026-06-30', anioAplicacion: null, unidadEntradaId: 21 }),
      fila(6, { inicio: '2026-07-01', anioAplicacion: null, unidadEntradaId: 21 }),
    ])
    assert.equal(conflictos.size, 0)
  })
})
