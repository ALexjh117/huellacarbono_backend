import { test } from '@japa/runner'
import {
  CODIGO_UNIDAD_RESULTADO,
  etiquetaUnidadCo2e,
  seleccionarUnidadResultado,
  type UnidadCandidata,
} from '#services/emissions/unidad_resultado'
import UnitConversionService from '#services/emissions/unit_conversion_service'

const unidad = (id: number, cambios: Partial<UnidadCandidata> = {}): UnidadCandidata => ({
  id,
  codigo: `U${id}`,
  simbolo: 'kg',
  magnitud: 'Masa',
  factorBase: '1.000000000000',
  estado: true,
  ...cambios,
})

/** Todas las permutaciones, para probar que el orden no cambia la elección. */
function permutaciones<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items]
  return items.flatMap((item, index) =>
    permutaciones([...items.slice(0, index), ...items.slice(index + 1)]).map((resto) => [
      item,
      ...resto,
    ])
  )
}

test.group('selección determinista de la unidad final', () => {
  test('la unidad UM-KG es la referencia sin importar el orden', ({ assert }) => {
    const referencia = unidad(900, { codigo: CODIGO_UNIDAD_RESULTADO })
    const otras = [
      unidad(31, { codigo: '767987', nombre: 'Kilogramos' } as Partial<UnidadCandidata>),
      unidad(5, { simbolo: 'kg CO2e' }),
      unidad(77, { estado: false }),
    ]
    for (const orden of permutaciones([referencia, ...otras])) {
      assert.equal(seleccionarUnidadResultado(orden).id, 900)
    }
  })

  test('sin UM-KG usa la única kg activa (caso de un id histórico)', ({ assert }) => {
    const historica = unidad(31, { codigo: '767987' })
    const inactiva = unidad(12, { estado: false })
    const libra = unidad(32, { simbolo: 'LB', factorBase: '0.45359237' })
    const tonelada = unidad(40, { simbolo: 't', factorBase: '1000' })
    for (const orden of permutaciones([historica, inactiva, libra, tonelada])) {
      assert.equal(seleccionarUnidadResultado(orden).id, 31)
    }
  })

  test('sin UM-KG y con varias kg activas se rechaza en cualquier orden', ({ assert }) => {
    const candidatas = [unidad(8), unidad(3, { simbolo: 'kg CO2e' }), unidad(5, { simbolo: 'KG' })]
    for (const orden of permutaciones(candidatas)) {
      assert.throws(
        () => seleccionarUnidadResultado(orden),
        /Hay 3 unidades kg activas equivalentes \(ids 3, 5, 8\)/
      )
    }
  })

  test('rechaza una referencia UM-KG inactiva en vez de usar otra', ({ assert }) => {
    assert.throws(
      () =>
        seleccionarUnidadResultado([
          unidad(1, { codigo: CODIGO_UNIDAD_RESULTADO, estado: false }),
          unidad(2),
        ]),
      /UM-KG está inactiva/
    )
  })

  test('rechaza una referencia UM-KG incompatible con kg', ({ assert }) => {
    assert.throws(
      () =>
        seleccionarUnidadResultado([
          unidad(1, { codigo: CODIGO_UNIDAD_RESULTADO, factorBase: '1000' }),
        ]),
      /masa con factor base 1/
    )
    assert.throws(
      () =>
        seleccionarUnidadResultado([
          unidad(1, { codigo: CODIGO_UNIDAD_RESULTADO, magnitud: 'Volumen' }),
        ]),
      /masa con factor base 1/
    )
  })

  test('sin ninguna kg activa pide configurarla', ({ assert }) => {
    assert.throws(
      () => seleccionarUnidadResultado([unidad(1, { estado: false }), unidad(2, { simbolo: 'g' })]),
      /Configura una unidad de masa base en kilogramos/
    )
  })

  test('la etiqueta del resultado siempre indica CO2e', ({ assert }) => {
    assert.equal(etiquetaUnidadCo2e('kg'), 'kg CO2e')
    assert.equal(etiquetaUnidadCo2e('kg CO2e'), 'kg CO2e')
    assert.isNull(etiquetaUnidadCo2e(null))
  })
})

test.group('detalle de conversión para la trazabilidad', () => {
  const unidades = new Map([
    [1, { id: 1, codigo: 'L', simbolo: 'L', magnitud: 'Volumen', factorBase: '1', estado: true }],
    [
      2,
      { id: 2, codigo: 'M3', simbolo: 'm³', magnitud: 'Volumen', factorBase: '1000', estado: true },
    ],
    [3, { id: 3, codigo: 'KG', simbolo: 'kg', magnitud: 'Masa', factorBase: '1', estado: true }],
    [
      4,
      {
        id: 4,
        codigo: 'KGL',
        simbolo: 'kg/L',
        magnitud: 'Densidad',
        factorBase: '1',
        estado: true,
      },
    ],
  ])
  const servicio = new UnitConversionService({
    findUnit: async (id) => unidades.get(id) ?? null,
    findConversion: async () => null,
  })
  const densidad = { densidad: { valor: '0.85', unidadId: 4 } }

  test('informa la densidad sólo cuando la conversión la usa', async ({ assert }) => {
    assert.deepEqual(await servicio.convertirConDetalle('1000', 1, 3, densidad), {
      valor: '850',
      parametrosUsados: { densidad: { valor: '0.85', unidadId: 4 } },
    })
    assert.deepEqual(await servicio.convertirConDetalle('1000', 1, 2, densidad), {
      valor: '1',
      parametrosUsados: {},
    })
  })
})
