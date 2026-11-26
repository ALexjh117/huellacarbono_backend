import { test } from '@japa/runner'
import UnitConversionService, {
  parametrosConversionDesde,
  type ParametrosConversion,
} from '#services/emissions/unit_conversion_service'
import { UNIDADES_MEDIDA_CATALOGO } from '#data/unidades_medida_catalogo'
import { decimalCanonico, validarCatalogo } from '#services/unidad_medida_catalogo_service'

type Unit = {
  id: number
  codigo: string
  magnitud: string
  factorBase: string
  estado: boolean
}

type Conversion = {
  tipo: string
  factor: string
  parametro_codigo: string | null
}

const unit = (id: number, changes: Partial<Unit> = {}): Unit => ({
  id,
  codigo: `U${id}`,
  magnitud: 'masa',
  factorBase: '1',
  estado: true,
  ...changes,
})

function service(
  options: {
    units?: Map<number, Unit>
    conversions?: Map<string, Conversion>
  } = {}
) {
  const units =
    options.units ??
    new Map([
      [1, unit(1)],
      [2, unit(2, { factorBase: '1000' })],
    ])
  const conversions = options.conversions ?? new Map<string, Conversion>()
  return new UnitConversionService({
    findUnit: async (id) => units.get(id) ?? null,
    findConversion: async (source, target) => conversions.get(`${source}:${target}`) ?? null,
  })
}

test.group('conversión de unidades (unitario sin base de datos)', () => {
  test('usa una conversión directa activa', async ({ assert }) => {
    const converter = service({
      conversions: new Map([['1:2', { tipo: 'DIRECTA', factor: '2.5', parametro_codigo: null }]]),
    })
    assert.equal(await converter.convert('4', 1, 2), '10')
  })

  test('convierte mediante la razón de factor_base cuando no hay regla directa', async ({
    assert,
  }) => {
    assert.equal(await service().convert('2', 1, 2), '0.002')
  })

  test('normaliza tildes al comparar la magnitud física', async ({ assert }) => {
    const converter = service({
      units: new Map([
        [1, unit(1, { magnitud: 'Energía' })],
        [2, unit(2, { magnitud: 'energia', factorBase: '1000' })],
      ]),
    })
    assert.equal(await converter.convert('2', 1, 2), '0.002')
  })

  test('valida unidad y cantidad antes de devolver una conversión identidad', async ({
    assert,
  }) => {
    assert.equal(await service().convert('1.25', 1, 1), '1.25')
    await assert.rejects(() => service().convert('', 1, 1), /decimales positivos válidos/)
    await assert.rejects(
      () => service({ units: new Map([[1, unit(1, { estado: false })]]) }).convert('1', 1, 1),
      /no existe o está inactiva/
    )
  })

  test('rechaza unidad origen o destino inexistente', async ({ assert }) => {
    await assert.rejects(() => service().convert('1', 99, 2), /no existe o está inactiva/)
    await assert.rejects(() => service().convert('1', 1, 99), /no existe o está inactiva/)
  })

  test('rechaza unidades inactivas y magnitudes incompatibles', async ({ assert }) => {
    await assert.rejects(
      () =>
        service({
          units: new Map([
            [1, unit(1, { estado: false })],
            [2, unit(2)],
          ]),
        }).convert('1', 1, 2),
      /no existe o está inactiva/
    )
    await assert.rejects(
      () =>
        service({
          units: new Map([
            [1, unit(1)],
            [2, unit(2, { magnitud: 'volumen' })],
          ]),
        }).convert('1', 1, 2),
      /No se pueden convertir/
    )
  })

  test('no inventa conversión inversa para una regla que requiere parámetros', async ({
    assert,
  }) => {
    const converter = service({
      conversions: new Map([
        ['2:1', { tipo: 'DENSIDAD', factor: '1', parametro_codigo: 'densidad' }],
      ]),
    })
    await assert.rejects(() => converter.convert('1', 1, 2), /requiere el parámetro densidad/)
  })

  test('invierte una regla DIRECTA unidireccional usando su factor positivo', async ({
    assert,
  }) => {
    const converter = service({
      conversions: new Map([['2:1', { tipo: 'DIRECTA', factor: '2', parametro_codigo: null }]]),
    })
    assert.equal(await converter.convert('10', 1, 2), '5')
  })

  test('rechaza valores vacíos, mal formados y negativos', async ({ assert }) => {
    const converter = service()
    for (const value of ['', ' ', 'abc', '1,2', '1x', '-1']) {
      await assert.rejects(() => converter.convert(value, 1, 2), /decimales positivos válidos/)
    }
  })

  test('respeta precisión decimal y límites numéricos', async ({ assert }) => {
    const converter = service()
    assert.equal(await converter.convert('0.12345678', 1, 1), '0.12345678')
    await assert.rejects(() => converter.convert('0.123456789', 1, 2), /precisión admitida/)
    await assert.rejects(() => converter.convert('10000000000000000', 1, 2), /precisión admitida/)
    const oversizedDirect = service({
      conversions: new Map([
        ['1:2', { tipo: 'DIRECTA', factor: '999999999999', parametro_codigo: null }],
      ]),
    })
    await assert.rejects(
      () => oversizedDirect.convert('9999999999999999', 1, 2),
      /precisión admitida/
    )
    const oversizedBase = service({
      units: new Map([
        [1, unit(1, { factorBase: '1000000000000' })],
        [2, unit(2)],
      ]),
    })
    await assert.rejects(() => oversizedBase.convert('1', 1, 2), /precisión admitida/)
  })
})

/**
 * Catálogo real de unidades con ids sintéticos (posición + 1). Los valores de
 * densidad y poder calorífico de estas pruebas son sintéticos: sólo comprueban
 * la aritmética y no deben usarse como datos oficiales.
 */
type CatalogUnit = Unit & { simbolo: string }
const catalogUnits = new Map<number, CatalogUnit>(
  UNIDADES_MEDIDA_CATALOGO.map((item, index) => [
    index + 1,
    {
      id: index + 1,
      codigo: item.codigo,
      simbolo: item.simbolo,
      magnitud: item.magnitud,
      factorBase: item.factorBase,
      estado: true,
    },
  ])
)
function uid(codigo: string) {
  for (const [key, value] of catalogUnits) if (value.codigo === codigo) return key
  throw new Error(`Unidad ${codigo} no está en el catálogo`)
}
function catalogService(extra: [number, CatalogUnit][] = []) {
  const units = new Map<number, CatalogUnit>([...catalogUnits, ...extra])
  return new UnitConversionService({
    findUnit: async (unitId) => units.get(unitId) ?? null,
    findConversion: async () => null,
  })
}
const convertir = (
  cantidad: string,
  origen: string,
  destino: string,
  parametros: ParametrosConversion = {}
) => catalogService().convert(cantidad, uid(origen), uid(destino), parametros)

test.group('catálogo de unidades: definición', () => {
  test('el catálogo declarado es válido y no repite códigos ni símbolos', ({ assert }) => {
    assert.deepEqual(validarCatalogo(UNIDADES_MEDIDA_CATALOGO), [])
  })

  test('detecta factores base inválidos y códigos repetidos', ({ assert }) => {
    const errores = validarCatalogo([
      { codigo: 'X', nombre: 'X', simbolo: 'x', magnitud: 'Masa', factorBase: '0' },
      { codigo: 'X', nombre: 'Y', simbolo: 'y', magnitud: 'Masa', factorBase: '-1' },
      { codigo: 'Z', nombre: 'Z', simbolo: 'X', magnitud: 'masa', factorBase: '1' },
    ])
    assert.lengthOf(errores, 4)
  })

  test('compara factores base en forma canónica', ({ assert }) => {
    assert.equal(decimalCanonico('1.000000000000'), '1')
    assert.equal(decimalCanonico('0.453592370000'), '0.45359237')
    assert.equal(decimalCanonico('1000'), '1000')
  })
})

test.group('conversión de unidades del catálogo', () => {
  test('kg ↔ g', async ({ assert }) => {
    assert.equal(await convertir('2.5', 'UM-KG', 'UM-G'), '2500')
    assert.equal(await convertir('2500', 'UM-G', 'UM-KG'), '2.5')
  })

  test('kg ↔ t', async ({ assert }) => {
    assert.equal(await convertir('1234.5', 'UM-KG', 'UM-T'), '1.2345')
    assert.equal(await convertir('3', 'UM-T', 'UM-KG'), '3000')
  })

  test('L ↔ m³', async ({ assert }) => {
    assert.equal(await convertir('1500', 'UM-L', 'UM-M3'), '1.5')
    assert.equal(await convertir('0.75', 'UM-M3', 'UM-L'), '750')
  })

  test('m³st ↔ m³ y m³st → L', async ({ assert }) => {
    assert.equal(await convertir('2.5', 'UM-M3ST', 'UM-M3'), '2.5')
    assert.equal(await convertir('2.5', 'UM-M3ST', 'UM-L'), '2500')
    assert.equal(await convertir('1000', 'UM-L', 'UM-M3ST'), '1')
  })

  test('kWh ↔ MWh y kWh → MJ', async ({ assert }) => {
    assert.equal(await convertir('2500', 'UM-KWH', 'UM-MWH'), '2.5')
    assert.equal(await convertir('1.2', 'UM-MWH', 'UM-KWH'), '1200')
    assert.equal(await convertir('1', 'UM-KWH', 'UM-MJ'), '3.6')
  })

  test('MJ ↔ GJ y GJ → TJ', async ({ assert }) => {
    assert.equal(await convertir('4500', 'UM-MJ', 'UM-GJ'), '4.5')
    assert.equal(await convertir('0.001', 'UM-GJ', 'UM-MJ'), '1')
    assert.equal(await convertir('250', 'UM-GJ', 'UM-TJ'), '0.25')
  })

  test('m ↔ km', async ({ assert }) => {
    assert.equal(await convertir('12345', 'UM-M', 'UM-KM'), '12.345')
    assert.equal(await convertir('0.5', 'UM-KM', 'UM-M'), '500')
  })

  test('ha ↔ m²', async ({ assert }) => {
    assert.equal(await convertir('2.5', 'UM-HA', 'UM-M2'), '25000')
    assert.equal(await convertir('5000', 'UM-M2', 'UM-HA'), '0.5')
  })

  test('libra, galón y barril usan sus equivalencias exactas', async ({ assert }) => {
    assert.equal(await convertir('100', 'UM-LB', 'UM-KG'), '45.359237')
    assert.equal(await convertir('1', 'UM-KG', 'UM-LB'), '2.20462262')
    assert.equal(await convertir('10', 'UM-GAL', 'UM-L'), '37.85411784')
    assert.equal(await convertir('1', 'UM-BBL', 'UM-GAL'), '42')
  })

  test('conserva decimales y redondea una sola vez al final', async ({ assert }) => {
    assert.equal(await convertir('0.12345678', 'UM-T', 'UM-KG'), '123.45678')
    assert.equal(await convertir('1', 'UM-LB', 'UM-G'), '453.59237')
    // 1 g → lb = 0.0022046226218… → 8 decimales con mitad hacia arriba.
    assert.equal(await convertir('1', 'UM-G', 'UM-LB'), '0.00220462')
  })

  test('maneja valores grandes y pequeños dentro de la precisión', async ({ assert }) => {
    assert.equal(await convertir('1234567890123456', 'UM-KG', 'UM-T'), '1234567890123.456')
    assert.equal(await convertir('0.00000001', 'UM-T', 'UM-KG'), '0.00001')
    await assert.rejects(() => convertir('9999999999999999', 'UM-KG', 'UM-G'), /precisión admitida/)
    await assert.rejects(
      () => convertir('0.00000001', 'UM-G', 'UM-KG'),
      /menor que la precisión admitida/
    )
  })

  test('ida y vuelta devuelve la cantidad original', async ({ assert }) => {
    const casos: [string, string, string][] = [
      ['123.456', 'UM-KWH', 'UM-MJ'],
      ['987.654', 'UM-KG', 'UM-T'],
      ['42.5', 'UM-M3', 'UM-L'],
      ['3.75', 'UM-HA', 'UM-M2'],
      ['19.99', 'UM-KM', 'UM-M'],
      ['7', 'UM-BBL', 'UM-L'],
    ]
    for (const [cantidad, origen, destino] of casos) {
      const ida = await convertir(cantidad, origen, destino)
      assert.equal(await convertir(ida, destino, origen), cantidad, `${origen} ↔ ${destino}`)
    }
    // Con una equivalencia no exacta la vuelta queda dentro de 1e-8.
    const libras = await convertir('75.3', 'UM-KG', 'UM-LB')
    const vuelta = Number(await convertir(libras, 'UM-LB', 'UM-KG'))
    assert.closeTo(vuelta, 75.3, 1e-8)
    // Límite documentado: el resultado se guarda con 8 decimales, así que al
    // pasar a una unidad mayor se pierden los dígitos que no caben.
    assert.equal(await convertir('987.654321', 'UM-KG', 'UM-T'), '0.98765432')
  })

  test('rechaza magnitudes incompatibles con un mensaje claro', async ({ assert }) => {
    await assert.rejects(() => convertir('1', 'UM-KG', 'UM-KM'), /magnitudes incompatibles/)
    await assert.rejects(() => convertir('1', 'UM-TKM', 'UM-PKM'), /magnitudes incompatibles/)
    await assert.rejects(() => convertir('1', 'UM-H', 'UM-KWH'), /magnitudes incompatibles/)
  })

  test('rechaza unidades inexistentes o inactivas', async ({ assert }) => {
    await assert.rejects(
      () => catalogService().convert('1', 9999, uid('UM-KG')),
      /unidad origen \(id 9999\) no existe o está inactiva/
    )
    const inactiva: CatalogUnit = {
      id: 500,
      codigo: 'INACTIVA',
      simbolo: 'kgi',
      magnitud: 'Masa',
      factorBase: '1',
      estado: false,
    }
    await assert.rejects(
      () => catalogService([[500, inactiva]]).convert('1', uid('UM-KG'), 500),
      /unidad destino kgi no existe o está inactiva/
    )
  })

  test('rechaza factores base inválidos', async ({ assert }) => {
    for (const factorBase of ['0', 'abc', '-1', '']) {
      const mala: CatalogUnit = {
        id: 600,
        codigo: 'MALA',
        simbolo: 'mala',
        magnitud: 'Masa',
        factorBase,
        estado: true,
      }
      await assert.rejects(
        () => catalogService([[600, mala]]).convert('1', 600, uid('UM-KG')),
        /factor base inválido/
      )
    }
  })

  test('rechaza cantidades inválidas', async ({ assert }) => {
    for (const cantidad of ['', '-5', '1e3', 'NaN', '1,5', ' ']) {
      await assert.rejects(
        () => convertir(cantidad, 'UM-KG', 'UM-T'),
        /decimales positivos válidos/
      )
    }
  })
})

test.group('conversiones con parámetros físicos (valores sintéticos)', () => {
  const densidad = (valor: string, unidad = 'UM-KG-L') => ({
    densidad: { valor, unidadId: uid(unidad) },
  })
  const poder = (valor: string, unidad: string) => ({
    poderCalorifico: { valor, unidadId: uid(unidad) },
  })

  test('volumen → masa exige densidad', async ({ assert }) => {
    await assert.rejects(
      () => convertir('1000', 'UM-L', 'UM-KG'),
      /requiere el parámetro densidad con su unidad/
    )
  })

  test('volumen ↔ masa con densidad en cualquier unidad de densidad', async ({ assert }) => {
    assert.equal(await convertir('1000', 'UM-L', 'UM-KG', densidad('0.85')), '850')
    assert.equal(await convertir('1000', 'UM-L', 'UM-KG', densidad('850', 'UM-KG-M3')), '850')
    assert.equal(await convertir('2', 'UM-M3', 'UM-T', densidad('0.85')), '1.7')
    assert.equal(await convertir('850', 'UM-KG', 'UM-L', densidad('0.85')), '1000')
  })

  test('rechaza densidad inválida, en cero o con unidad equivocada', async ({ assert }) => {
    await assert.rejects(
      () => convertir('1', 'UM-L', 'UM-KG', densidad('0')),
      /densidad debe ser mayor que cero/
    )
    await assert.rejects(
      () => convertir('1', 'UM-L', 'UM-KG', densidad('abc')),
      /densidad debe ser un decimal positivo válido/
    )
    await assert.rejects(
      () => convertir('1', 'UM-L', 'UM-KG', densidad('0.85', 'UM-MJ-KG')),
      /no corresponde a densidad/
    )
    await assert.rejects(
      () =>
        catalogService().convert('1', uid('UM-L'), uid('UM-KG'), {
          densidad: { valor: '0.85', unidadId: 9999 },
        }),
      /unidad del parámetro densidad no existe o está inactiva/
    )
  })

  test('masa o volumen → energía exige el poder calorífico correspondiente', async ({ assert }) => {
    await assert.rejects(
      () => convertir('1', 'UM-T', 'UM-GJ'),
      /requiere el parámetro poder calorífico másico/
    )
    await assert.rejects(
      () => convertir('1', 'UM-L', 'UM-MJ'),
      /requiere el parámetro poder calorífico volumétrico/
    )
    await assert.rejects(
      () => convertir('1', 'UM-L', 'UM-MJ', poder('35.8', 'UM-MJ-KG')),
      /no corresponde a poder calorífico volumétrico/
    )
    await assert.rejects(
      () => convertir('1', 'UM-L', 'UM-MJ', poder('0', 'UM-MJ-L')),
      /mayor que cero/
    )
  })

  test('convierte a energía con el poder calorífico aportado', async ({ assert }) => {
    assert.equal(await convertir('1', 'UM-T', 'UM-GJ', poder('25.8', 'UM-MJ-KG')), '25.8')
    assert.equal(await convertir('1000', 'UM-L', 'UM-TJ', poder('35.8', 'UM-MJ-L')), '0.0358')
    assert.equal(await convertir('100', 'UM-M3', 'UM-MJ', poder('38', 'UM-MJ-M3')), '3800')
    assert.equal(await convertir('25.8', 'UM-GJ', 'UM-T', poder('25.8', 'UM-MJ-KG')), '1')
  })

  test('lee los parámetros guardados en el dato sólo si vienen completos', ({ assert }) => {
    assert.deepEqual(parametrosConversionDesde(null), {})
    assert.deepEqual(
      parametrosConversionDesde({
        densidad: '0.85',
        unidadDensidadId: 7,
        consumoEspecifico: '0.1',
      }),
      { densidad: { valor: '0.85', unidadId: 7 } }
    )
    assert.deepEqual(parametrosConversionDesde({ poderCalorifico: '', unidadDensidadId: 7 }), {})
  })
})
