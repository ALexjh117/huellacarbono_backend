import { test } from '@japa/runner'
import {
  dividirEmision,
  convertirAGwp,
  aEntero,
  intensidadDesde,
  multiplicarEmision,
  toneladasDesdeKg,
  agruparResultadosPorGas,
} from '#services/calculo_carbono_service'
import {
  actividadParaFactor,
  resolverMetodologia,
} from '#services/emissions/calculation_methodologies'
import { agruparCandidatosPorGas } from '#services/emissions/factor_candidates'
import { validarEspecieGas } from '#services/emissions/gas_validation'
import { crearSnapshotGwp, resolverGwpAplicable } from '#services/emissions/gwp_selection'

test.group('motor de cálculo de emisiones (unitario)', () => {
  test('aEntero acepta decimales válidos y rechaza formatos inválidos o fuera de precisión', ({
    assert,
  }) => {
    assert.equal(aEntero('12.34000000', 8), 1234000000n)
    assert.equal(aEntero('-0.5', 8), -50000000n)
    for (const invalid of ['', ' ', 'abc', '1x2', '1,25', '.', '01', '1.000000001']) {
      assert.throws(() => aEntero(invalid, 8), /decimal válido|precisión admitida/)
    }
    assert.throws(() => aEntero(null as unknown as string, 8), /decimal válido/)
    assert.throws(() => aEntero('1000000000000000000000000', 8), /precisión admitida/)
  })

  test('multiplica y redondea decimales sin pérdida binaria', ({ assert }) => {
    assert.equal(multiplicarEmision('12.34567890', '0.123456789012'), '1.52415788')
    assert.equal(multiplicarEmision('0.00000001', '0.5'), '0.00000001')
  })

  test('convierte kilogramos a toneladas e intensidad con precisión decimal', ({ assert }) => {
    assert.equal(toneladasDesdeKg('1234.5'), '1.2345')
    assert.equal(intensidadDesde('10', '4'), '2.5')
    assert.equal(dividirEmision('1', '3'), '0.33333333')
  })

  test('consolida CO2e por gas y conserva separadas las especies', ({ assert }) => {
    const resumen = agruparResultadosPorGas(
      [
        { gasCalculado: 'CO2', gasEspecifico: null, valorCo2e: '2' },
        { gasCalculado: 'CH4', gasEspecifico: 'fósil', valorCo2e: '3' },
        { gasCalculado: 'CH4', gasEspecifico: 'biogénico', valorCo2e: '4' },
        { gasCalculado: 'CO2E', gasEspecifico: null, valorCo2e: '1' },
      ],
      '10'
    )
    assert.deepEqual(
      resumen.map(({ nombre, valorCo2e }) => [nombre, valorCo2e]),
      [
        ['CO2', '2'],
        ['CH4 — fósil', '3'],
        ['CH4 — biogénico', '4'],
        ['CO2E', '1'],
      ]
    )
    assert.equal(
      resumen.reduce((sum, item) => sum + item.porcentaje, 0),
      100
    )
  })

  test('convierte gases a CO2e una sola vez y no reaplica GWP a CO2e directo', ({ assert }) => {
    assert.equal(convertirAGwp('2', 'CO2', '1'), '2')
    assert.equal(convertirAGwp('0.1', 'CH4', '27'), '2.7')
    assert.equal(convertirAGwp('0.01', 'N2O', '273'), '2.73')
    assert.equal(convertirAGwp('7.43', 'CO2E'), '7.43')
    assert.throws(() => convertirAGwp('1', 'CH4'), /Se requiere un GWP documentado/)
  })

  test('resuelve metodologías por código documental de actividad', ({ assert }) => {
    assert.equal(resolverMetodologia('A1').codigo, 'COMBUSTION_FIJA')
    assert.equal(resolverMetodologia('A2').codigo, 'COMBUSTION_MOVIL')
    assert.equal(resolverMetodologia('B1').codigo, 'ELECTRICIDAD')
    assert.equal(resolverMetodologia('C3').codigo, 'RESIDUOS')
    assert.throws(() => resolverMetodologia('SIN-METODO'), /No hay una metodología ejecutable/)
  })

  test('combustión móvil por distancia requiere consumo explícito', async ({ assert }) => {
    await assert.rejects(
      () => actividadParaFactor('COMBUSTION_MOVIL', '100', 'distancia', 7, {}, async () => '0', 2),
      /requiere consumoEspecifico/
    )

    const actividad = await actividadParaFactor(
      'COMBUSTION_MOVIL',
      '100',
      'distancia',
      7,
      { consumoEspecifico: '0.08', unidadConsumoId: 7, unidadDistanciaId: 2 },
      async (amount) => amount,
      2
    )
    assert.equal(actividad, '8')

    const distanciaConvertida = await actividadParaFactor(
      'COMBUSTION_MOVIL',
      '500',
      'distancia',
      7,
      { consumoEspecifico: '0.08', unidadConsumoId: 7, unidadDistanciaId: 2 },
      async (amount, sourceId, targetId) =>
        sourceId === 3 && targetId === 2 ? String(Number(amount) / 1000) : amount,
      3
    )
    assert.equal(distanciaConvertida, '0.04')

    const factorDirectoPorDistancia = await actividadParaFactor(
      'COMBUSTION_MOVIL',
      '500',
      'distancia',
      2,
      {},
      async (amount, sourceId, targetId) =>
        sourceId === 3 && targetId === 2 ? String(Number(amount) / 1000) : amount,
      3,
      'distancia'
    )
    assert.equal(factorDirectoPorDistancia, '0.5')
  })

  test('no elige arbitrariamente entre factores genéricos y específicos coincidentes', ({
    assert,
  }) => {
    const resultado = agruparCandidatosPorGas([
      { id: 1, gas: 'CO2', gasEspecifico: null, region: null, sectorCategoria: null },
      {
        id: 2,
        gas: 'CO2',
        gasEspecifico: null,
        region: 'CO',
        sectorCategoria: 'Manufactura',
      },
    ])

    assert.equal(
      resultado.error,
      'Hay más de un factor aprobado y vigente para el mismo gas; no se puede desambiguar'
    )
    assert.equal(resultado.porGas.get('CO2:')?.length, 2)
  })

  test('conserva candidatos con igual gas cuando sector, año o región son distintos', ({
    assert,
  }) => {
    const sectores = agruparCandidatosPorGas([
      { id: 1, gas: 'CO2', gasEspecifico: null, sectorCategoria: 'Manufactura' },
      { id: 2, gas: 'CO2', gasEspecifico: null, sectorCategoria: 'Transporte' },
    ])
    const anios = agruparCandidatosPorGas([
      { id: 1, gas: 'CO2', gasEspecifico: null, anioAplicacion: 2024 },
      { id: 2, gas: 'CO2', gasEspecifico: null, anioAplicacion: 2025 },
    ])
    const regiones = agruparCandidatosPorGas([
      { id: 1, gas: 'CO2', gasEspecifico: null, region: 'CO' },
      { id: 2, gas: 'CO2', gasEspecifico: null, region: 'PE' },
    ])

    assert.isNull(sectores.error)
    assert.isNull(anios.error)
    assert.isNull(regiones.error)
  })

  test('rechaza dos factores de CH4 con especies específicas diferentes', ({ assert }) => {
    const resultado = agruparCandidatosPorGas([
      { id: 1, gas: 'CH4', gasEspecifico: 'fósil de combustión' },
      { id: 2, gas: 'CH4', gasEspecifico: 'fósil fugitivo/proceso' },
    ])

    assert.equal(
      resultado.error,
      'Hay más de un factor aprobado y vigente para el mismo gas; no se puede desambiguar'
    )
    assert.equal(resultado.porGas.size, 2)
  })

  test('permite combinar gases distintos cuando cada uno tiene un único factor', ({ assert }) => {
    const resultado = agruparCandidatosPorGas([
      { gas: 'CO2', gasEspecifico: null },
      { gas: 'CH4', gasEspecifico: 'fósil de combustión' },
      { gas: 'N2O', gasEspecifico: null },
    ])

    assert.isNull(resultado.error)
    assert.equal(resultado.porGas.size, 3)
  })

  test('rechaza mezclar CO2e directo con factores individuales por gas', ({ assert }) => {
    const resultado = agruparCandidatosPorGas([
      { gas: 'CO2E', gasEspecifico: null },
      { gas: 'CO2', gasEspecifico: null },
    ])

    assert.equal(
      resultado.error,
      'No se pueden mezclar factores CO2e directos con factores por gas'
    )
  })

  test('valida especies según el gas y normaliza valores vacíos', ({ assert }) => {
    assert.isNull(validarEspecieGas('CO2'))
    assert.isNull(validarEspecieGas('CO2', '   '))
    assert.isNull(validarEspecieGas('N2O', null))
    assert.isNull(validarEspecieGas('CO2E'))
    assert.equal(validarEspecieGas('CH4', '  fósil de combustión  '), 'fósil de combustión')
    assert.equal(validarEspecieGas('OTRO', 'R-134a'), 'R-134a')

    assert.throws(() => validarEspecieGas('CO2', 'biogénico'), /no admite una especie adicional/)
    assert.throws(() => validarEspecieGas('N2O', 'otra especie'), /no admite una especie adicional/)
    assert.throws(() => validarEspecieGas('CO2E', 'R-134a'), /no admite una especie adicional/)
    assert.throws(() => validarEspecieGas('CH4'), /requiere identificar su especie/)
    assert.throws(() => validarEspecieGas('CH4', '   '), /requiere identificar su especie/)
    assert.throws(() => validarEspecieGas('OTRO'), /requiere identificar la especie gaseosa/)
    assert.throws(() => validarEspecieGas('OTRO', '   '), /requiere identificar la especie gaseosa/)
  })

  test('resuelve CH4 al código AR6 correcto dentro del conjunto de la versión', async ({
    assert,
  }) => {
    const consultas: { setId: number; codigo: string }[] = []
    const values = new Map([[`41:CH4_FOSSIL_COMBUSTION`, '27']])
    const resultado = await resolverGwpAplicable(
      'CH4',
      'fósil de combustión',
      41,
      async (setId, codigo) => {
        consultas.push({ setId, codigo })
        const valor = values.get(`${setId}:${codigo}`)
        return valor ? { valor } : null
      }
    )

    assert.deepEqual(consultas, [{ setId: 41, codigo: 'CH4_FOSSIL_COMBUSTION' }])
    assert.equal(resultado.status, 'found')
    if (resultado.status === 'found') {
      assert.equal(resultado.gwp.valor, '27')
      assert.equal(multiplicarEmision('0.1', resultado.gwp.valor), '2.7')
    }
  })

  test('no toma un GWP de otro conjunto cuando el conjunto de la versión no lo contiene', async ({
    assert,
  }) => {
    const resultado = await resolverGwpAplicable('N2O', null, 52, async (setId, codigo) =>
      setId === 51 && codigo === 'N2O' ? { valor: '273' } : null
    )

    assert.deepEqual(resultado, { status: 'missing_value', code: 'N2O' })
  })

  test('marca gas sin GWP aplicable y no busca especies reservadas para OTRO', async ({
    assert,
  }) => {
    const consultas: string[] = []
    const ausente = await resolverGwpAplicable('OTRO', 'HFC-125', 41, async () => {
      consultas.push('HFC-125')
      return null
    })
    assert.deepEqual(ausente, { status: 'missing_value', code: 'HFC-125' })

    const reservado = await resolverGwpAplicable('OTRO', 'CO2', 41, async () => {
      consultas.push('CO2')
      return { valor: '1' }
    })
    assert.equal(reservado.status, 'unsupported_species')
    assert.deepEqual(consultas, ['HFC-125'])

    const sinConjunto = await resolverGwpAplicable('N2O', null, null, async () => ({
      valor: '273',
    }))
    assert.deepEqual(sinConjunto, { status: 'missing_set' })
  })

  test('CO2 usa GWP 1 y CO2e directo no consulta ni reaplica GWP', async ({ assert }) => {
    const consultas: string[] = []
    const co2 = await resolverGwpAplicable('CO2', null, 41, async (_setId, codigo) => {
      consultas.push(codigo)
      return codigo === 'CO2' ? { valor: '1' } : null
    })
    assert.equal(co2.status, 'found')
    if (co2.status === 'found') assert.equal(convertirAGwp('2', 'CO2', co2.gwp.valor), '2')

    const directo = await resolverGwpAplicable('CO2E', null, null, async (_setId, codigo) => {
      consultas.push(codigo)
      return { valor: '999' }
    })
    assert.deepEqual(directo, { status: 'direct' })
    assert.deepEqual(consultas, ['CO2'])
    assert.equal(convertirAGwp('7.43', 'CO2E'), '7.43')
  })

  test('N2O usa el GWP100 AR6 verificado para convertir a CO2e', ({ assert }) => {
    assert.equal(convertirAGwp('0.01', 'N2O', '273'), '2.73')
  })

  test('consulta HFC-134a con el código documentado del gas OTRO', async ({ assert }) => {
    const resultado = await resolverGwpAplicable('OTRO', 'HFC-134a', 41, async (setId, codigo) =>
      setId === 41 && codigo === 'HFC-134a' ? { valor: '1526' } : null
    )

    assert.equal(resultado.status, 'found')
    if (resultado.status === 'found') {
      assert.equal(resultado.gwp.valor, '1526')
      assert.equal(convertirAGwp('0.01', 'OTRO', resultado.gwp.valor), '15.26')
    }
  })

  test('usa el GWP100 AR6 específico para CH4 fósil fugitivo o de proceso', async ({ assert }) => {
    const resultado = await resolverGwpAplicable(
      'CH4',
      'CH4_FOSSIL_FUGITIVE_PROCESS',
      41,
      async (setId, codigo) =>
        setId === 41 && codigo === 'CH4_FOSSIL_FUGITIVE_PROCESS' ? { valor: '29.8' } : null
    )

    assert.equal(resultado.status, 'found')
    if (resultado.status === 'found') {
      assert.equal(convertirAGwp('0.1', 'CH4', resultado.gwp.valor), '2.98')
    }
  })

  test('crea snapshots GWP con valor, horizonte y versión; deja nulos los CO2e directos', ({
    assert,
  }) => {
    assert.deepEqual(
      crearSnapshotGwp(
        { id: 9, valor: '27' },
        {
          horizonteAnios: 100,
          estandarVersion: 'AR6 WGIII Annex II (2022)',
        }
      ),
      {
        gwpValueId: 9,
        valorGwp: '27',
        gwpHorizonteAnios: 100,
        gwpVersion: 'AR6 WGIII Annex II (2022)',
      }
    )
    assert.deepEqual(crearSnapshotGwp(null, null), {
      gwpValueId: null,
      valorGwp: null,
      gwpHorizonteAnios: null,
      gwpVersion: null,
    })
  })
})
