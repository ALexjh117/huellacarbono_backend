import { test } from '@japa/runner'
import {
  factorCubreIntervalo,
  regionAplica,
  sectorAplica,
  unidadCompatibleConActividades,
} from '#services/emissions/cobertura_intervalo'

const electricidad2024 = {
  fechaInicio: '2024-01-01',
  fechaFin: '2024-12-31',
  anioAplicacion: 2024,
}

test.group('Cobertura preliminar por intervalo', () => {
  test('el factor de 2024 cubre el inventario de ese año y no el de 2026', ({ assert }) => {
    assert.isTrue(factorCubreIntervalo(electricidad2024, '2024-01-01', '2024-12-31'))
    assert.isTrue(factorCubreIntervalo(electricidad2024, '2024-06-15', '2024-06-15'))
    assert.isFalse(factorCubreIntervalo(electricidad2024, '2026-02-11', '2026-08-11'))
    assert.isFalse(factorCubreIntervalo(electricidad2024, '2025-01-01', '2025-12-31'))
  })

  test('un factor sin año no se estira si la vigencia ya cerró', ({ assert }) => {
    assert.isFalse(
      factorCubreIntervalo(
        { fechaInicio: '2024-01-01', fechaFin: '2024-12-31', anioAplicacion: null },
        '2026-02-11',
        '2026-08-11'
      )
    )
  })

  test('región Colombia y sector de la organización', ({ assert }) => {
    assert.isTrue(regionAplica(null))
    assert.isTrue(regionAplica('co'))
    assert.isTrue(regionAplica('Colombia'))
    assert.isFalse(regionAplica('MX'))
    assert.isTrue(sectorAplica(null, 'Educación para el trabajo'))
    assert.isTrue(sectorAplica('Alimentos', 'alimentos'))
    assert.isFalse(sectorAplica('Alimentos', 'Educación para el trabajo'))
  })

  test('kWh de electricidad es compatible y un litro no', ({ assert }) => {
    assert.isTrue(unidadCompatibleConActividades('Energía', 'Masa', ['B1']))
    assert.isFalse(unidadCompatibleConActividades('Volumen', 'Masa', ['B1']))
    assert.isFalse(unidadCompatibleConActividades('Energía', 'Energía', ['B1']))
  })
})
