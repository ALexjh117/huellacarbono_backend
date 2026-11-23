import { test } from '@japa/runner'
import { PERMISSIONS, SYSTEM_ROLE_SEEDS } from '#data/permission_catalog'
import { UNIDADES_MEDIDA_CATALOGO } from '#data/unidades_medida_catalogo'
import Actividad from '#models/actividad'
import CalculoCarbono from '#models/calculo_carbono'
import ActividadEmision from '#models/actividad_emision'
import DatoActividadCarbono from '#models/dato_actividad_carbono'
import Departamento from '#models/departamento'
import FactorEmision from '#models/factor_emision'
import FuenteEmision from '#models/fuente_emision'
import Metodologia from '#models/metodologia'
import MetodologiaVersion from '#models/metodologia_version'
import Municipio from '#models/municipio'
import Organizacion from '#models/organizacion'
import PeriodoMedicion from '#models/periodo_medicion'
import Permiso from '#models/permiso'
import Proceso from '#models/proceso'
import ResultadoCarbono from '#models/resultado_carbono'
import Rol from '#models/rol'
import Sede from '#models/sede'
import UnidadMedida from '#models/unidad_medida'
import Usuario from '#models/usuario'
import UnidadMedidaCatalogoService from '#services/unidad_medida_catalogo_service'
import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'

/**
 * Todos los factores, densidades y valores de este archivo son sintéticos:
 * sólo comprueban la integración de unidades y no son datos oficiales.
 */
const PASSWORD = 'Clave1234'

async function prepararAdmin(client: ApiClient, email: string) {
  const roles = new Map<string, Rol>()
  for (const seed of SYSTEM_ROLE_SEEDS) {
    const existing = await Rol.findBy('nombre', seed.nombre)
    roles.set(seed.nombre, existing ?? (await Rol.create({ ...seed, estado: true })))
  }
  for (const permission of PERMISSIONS) {
    await Permiso.updateOrCreate({ codigo: permission.code }, { nombre: permission.name })
  }
  const admin = roles.get('ADMINISTRADOR')!
  await admin.load('permisos')
  const asignados = new Set(admin.permisos.map((permiso) => permiso.codigo))
  const faltantes = await Permiso.query().whereIn(
    'codigo',
    PERMISSIONS.map((permission) => permission.code).filter((codigo) => !asignados.has(codigo))
  )
  if (faltantes.length) await admin.related('permisos').attach(faltantes.map((p) => p.id))

  const usuario = await Usuario.create({
    nombres: 'Prueba',
    apellidos: 'Unidades',
    email,
    password: PASSWORD,
    estado: true,
  })
  await usuario.related('roles').attach([admin.id])
  const response = await client.post('/api/v1/auth/login').json({ email, password: PASSWORD })
  response.assertStatus(200)
  return { token: (response.body() as { data: { token: string } }).data.token, usuario }
}

async function unidadesDelCatalogo() {
  await new UnidadMedidaCatalogoService().sincronizar({ aplicar: true })
  const filas = await UnidadMedida.query().whereIn(
    'codigo',
    UNIDADES_MEDIDA_CATALOGO.map((unidad) => unidad.codigo)
  )
  const porCodigo = new Map(filas.map((fila) => [fila.codigo, fila]))
  return (codigo: string) => {
    const unidad = porCodigo.get(codigo)
    if (!unidad) throw new Error(`Falta la unidad ${codigo} en la base de pruebas`)
    return unidad
  }
}

async function codigoLibre() {
  const departamentos = await Departamento.all()
  const usados = new Set(departamentos.map((item) => item.codigo))
  for (let indice = 0; indice < 100; indice += 1) {
    const candidato = String(indice).padStart(2, '0')
    if (!usados.has(candidato)) return candidato
  }
  return '99'
}

async function escenario(usuarioId: number) {
  const u = await unidadesDelCatalogo()
  const codigo = await codigoLibre()
  const departamento = await Departamento.create({
    codigo,
    nombre: `Depto unidades ${codigo}`,
    estado: true,
  })
  const municipio = await Municipio.create({
    departamentoId: departamento.id,
    codigo: `${codigo}902`,
    nombre: `Municipio unidades ${codigo}`,
    estado: true,
  })
  const organizacion = await Organizacion.create({
    municipioId: municipio.id,
    nombre: `Planta unidades ${codigo}`,
    nit: `7${usuarioId}`,
    tipo: 'EMPRESA',
    estado: true,
  })
  const sede = await Sede.create({ organizacionId: organizacion.id, nombre: 'Sede', estado: true })
  const proceso = await Proceso.create({ sedeId: sede.id, nombre: 'Calderas', estado: true })
  const actividad = await Actividad.create({
    procesoId: proceso.id,
    nombre: 'Caldera principal',
    estado: true,
  })
  const actividadA1 = await ActividadEmision.query().where('codigo', 'A1').firstOrFail()
  const fuenteGas = await FuenteEmision.query().where('codigo', 'A1-01').firstOrFail()
  const fuenteGlp = await FuenteEmision.query().where('codigo', 'A1-04').firstOrFail()
  const fuenteAcpm = await FuenteEmision.query().where('codigo', 'A1-06').firstOrFail()
  const metodologia = await Metodologia.create({
    codigo: `UNI${codigo}`,
    nombre: 'Metodología sintética de unidades',
    tipo: 'CARBONO',
    estado: true,
  })
  const version = await MetodologiaVersion.create({
    metodologiaId: metodologia.id,
    numeroVersion: '2026',
    fechaInicioVigencia: DateTime.fromISO('2026-01-01'),
    estado: true,
  })
  const periodo = await PeriodoMedicion.create({
    organizacionId: organizacion.id,
    nombre: 'Mayo 2026',
    fechaInicio: DateTime.fromISO('2026-05-01'),
    fechaFin: DateTime.fromISO('2026-05-31'),
    estado: 'ABIERTO',
  })
  const factor = (fuenteId: number, unidadEntradaId: number, codigoFactor: string, valor: string) =>
    FactorEmision.create({
      versionId: version.id,
      fuenteEmisionId: fuenteId,
      unidadEntradaId,
      unidadSalidaId: u('UM-KG').id,
      codigo: `${codigoFactor}-${codigo}`,
      nombre: codigoFactor,
      valor,
      gas: 'CO2E',
      estadoAprobacion: 'APROBADO',
      fuente: 'Factor sintético exclusivo de fixture; no usar como dato oficial',
      institucionResponsable: 'Fixture de pruebas',
      anioPublicacion: 2026,
      anioAplicacion: 2026,
      origen: 'FIXTURE_TEST',
      fechaInicioVigencia: DateTime.fromISO('2026-01-01'),
      estado: true,
    })
  // Factor por m³ (gas), por tonelada (ACPM y GLP): obligan a convertir.
  await factor(fuenteGas.id, u('UM-M3').id, 'FE-SINT-GAS', '2')
  await factor(fuenteAcpm.id, u('UM-T').id, 'FE-SINT-ACPM', '3')
  await factor(fuenteGlp.id, u('UM-T').id, 'FE-SINT-GLP', '3')

  const papel = (
    fuenteId: number,
    unidadId: number,
    cantidad: string,
    parametrosCalculo: Record<string, string | number> = {}
  ) =>
    DatoActividadCarbono.create({
      actividadId: actividad.id,
      periodoId: periodo.id,
      fuenteEmisionId: fuenteId,
      alcanceId: actividadA1.alcanceId,
      actividadEmisionId: actividadA1.id,
      subcategoriaEmisionId: null,
      unidadId,
      usuarioRegistroId: usuarioId,
      cantidad,
      fuenteDato: 'Dato sintético de prueba',
      estadoRegistro: 'REGISTRADO',
      parametrosCalculo,
    })

  return {
    u,
    organizacion,
    periodo,
    version,
    actividad,
    actividadA1,
    fuenteGas,
    fuenteGlp,
    fuenteAcpm,
    papel,
  }
}

type Calculo = { id: number; totalCo2e: string; omitidos: { motivo: string }[] }

async function calcular(
  client: ApiClient,
  token: string,
  datos: Awaited<ReturnType<typeof escenario>>
) {
  return client.post('/api/v1/calculos-carbono').bearerToken(token).json({
    organizacionId: datos.organizacion.id,
    periodoId: datos.periodo.id,
    versionId: datos.version.id,
  })
}

test.group('Catálogo de unidades (sincronización idempotente)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('la simulación no escribe y la aplicación crea sólo lo que falta', async ({ assert }) => {
    const servicio = new UnidadMedidaCatalogoService()
    const antes = await UnidadMedida.query().count('* as total').first()

    const simulacion = await servicio.sincronizar({ aplicar: false })
    assert.lengthOf(simulacion.creadas, 0)
    const despuesSimulacion = await UnidadMedida.query().count('* as total').first()
    assert.equal(despuesSimulacion?.$extras.total, antes?.$extras.total)

    const primera = await servicio.sincronizar({ aplicar: true })
    assert.equal(
      primera.creadas.length + primera.encontradas.length + primera.requierenRevision.length,
      UNIDADES_MEDIDA_CATALOGO.length
    )
    assert.equal(primera.creadas.length, simulacion.porCrear.length)

    const segunda = await servicio.sincronizar({ aplicar: true })
    assert.lengthOf(segunda.creadas, 0)
    assert.equal(segunda.encontradas.length, primera.encontradas.length + primera.creadas.length)

    const kg = await UnidadMedida.findByOrFail('codigo', 'UM-KG')
    assert.equal(kg.factorBase, '1.000000000000')
    const lb = await UnidadMedida.findByOrFail('codigo', 'UM-LB')
    assert.equal(lb.factorBase, '0.453592370000')
  })

  test('informa y no modifica unidades existentes con factor erróneo o inactivas', async ({
    assert,
  }) => {
    // Reproduce el caso de la base principal: libra con factor 1 y kg inactivo.
    const libra = await UnidadMedida.create({
      codigo: 'LIBRA-PRUEBA',
      nombre: 'LIBRA',
      simbolo: 'LBX',
      magnitud: 'MASA',
      factorBase: '1',
      estado: true,
    })
    const kilo = await UnidadMedida.create({
      codigo: 'KILO-PRUEBA',
      nombre: 'Kilogramos',
      simbolo: 'kgx',
      magnitud: 'Masa',
      factorBase: '1',
      estado: false,
    })
    const catalogo = [
      {
        codigo: 'UMX-LB',
        nombre: 'Libra',
        simbolo: 'lbx',
        magnitud: 'Masa',
        factorBase: '0.45359237',
      },
      { codigo: 'UMX-KG', nombre: 'Kilogramo', simbolo: 'kgx', magnitud: 'Masa', factorBase: '1' },
      { codigo: 'UMX-G', nombre: 'Gramo', simbolo: 'gx', magnitud: 'Masa', factorBase: '0.001' },
    ]

    const reporte = await new UnidadMedidaCatalogoService().sincronizar({ aplicar: true, catalogo })

    assert.deepEqual(
      reporte.requierenRevision.map((fila) => [fila.codigo, fila.idUnidad]),
      [
        ['UMX-LB', libra.id],
        ['UMX-KG', kilo.id],
      ]
    )
    assert.match(
      reporte.requierenRevision[0].detalle,
      /factor base 1 distinto del esperado 0.45359237/
    )
    assert.match(reporte.requierenRevision[1].detalle, /inactiva/)
    assert.deepEqual(
      reporte.creadas.map((fila) => fila.codigo),
      ['UMX-G']
    )

    await libra.refresh()
    await kilo.refresh()
    assert.equal(libra.factorBase, '1.000000000000')
    assert.isFalse(kilo.estado)
    assert.isNull(await UnidadMedida.findBy('codigo', 'UMX-LB'))
  })
})

test.group('Unidades en el registro y en el motor de cálculo', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('el registro exige densidad completa y unidades activas', async ({ client, assert }) => {
    const { token, usuario } = await prepararAdmin(client, 'admin.unidades.dato@huellacarbono.test')
    const datos = await escenario(usuario.id)
    const base = {
      actividadId: datos.actividad.id,
      periodoId: datos.periodo.id,
      fuenteEmisionId: datos.fuenteAcpm.id,
      alcanceId: datos.actividadA1.alcanceId,
      actividadEmisionId: datos.actividadA1.id,
      unidadId: datos.u('UM-L').id,
      cantidad: '1000',
      fechaDato: '2026-05-10',
    }
    const registrar = (extra: Record<string, unknown>) =>
      client
        .post('/api/v1/datos-actividad-carbono')
        .bearerToken(token)
        .json({ ...base, ...extra })

    const sinUnidad = await registrar({ parametrosCalculo: { densidad: '0.85' } })
    sinUnidad.assertStatus(422)

    const unidadEquivocada = await registrar({
      parametrosCalculo: { densidad: '0.85', unidadDensidadId: datos.u('UM-MJ-KG').id },
    })
    unidadEquivocada.assertStatus(422)

    const cero = await registrar({
      parametrosCalculo: { densidad: '0', unidadDensidadId: datos.u('UM-KG-L').id },
    })
    cero.assertStatus(422)

    const valido = await registrar({
      parametrosCalculo: { densidad: '0.85', unidadDensidadId: datos.u('UM-KG-L').id },
    })
    valido.assertStatus(200)

    const inactiva = await UnidadMedida.create({
      codigo: 'UMX-INACTIVA',
      nombre: 'Litro retirado',
      simbolo: 'Lx',
      magnitud: 'Volumen',
      factorBase: '1',
      estado: false,
    })
    const conInactiva = await registrar({ unidadId: inactiva.id })
    conInactiva.assertStatus(422)
    assert.include(
      (conInactiva.body() as { errors?: { message: string }[]; message?: string }).errors?.[0]
        ?.message ?? JSON.stringify(conInactiva.body()),
      'inactiva'
    )
  })

  test('convierte antes de multiplicar y conserva la trazabilidad', async ({ client, assert }) => {
    const { token, usuario } = await prepararAdmin(
      client,
      'admin.unidades.motor@huellacarbono.test'
    )
    const datos = await escenario(usuario.id)
    const u = datos.u
    // 1500 L → 1.5 m³ × 2 = 3 kg
    const gas = await datos.papel(datos.fuenteGas.id, u('UM-L').id, '1500')
    // 1000 L × 0.85 kg/L = 850 kg = 0.85 t × 3 = 2.55 kg
    const acpm = await datos.papel(datos.fuenteAcpm.id, u('UM-L').id, '1000', {
      densidad: '0.85',
      unidadDensidadId: u('UM-KG-L').id,
    })

    const response = await calcular(client, token, datos)
    response.assertStatus(200)
    const calculo = (response.body() as { data: Calculo }).data
    assert.equal(calculo.totalCo2e, '5.55')
    assert.lengthOf(calculo.omitidos, 0)

    const resultados = await ResultadoCarbono.query().where('calculoCarbonoId', calculo.id)
    const trazaGas = resultados.find((fila) => fila.datoCarbonoId === gas.id)!
    assert.equal(trazaGas.cantidadOriginal, '1500.00000000')
    assert.equal(trazaGas.unidadOriginalId, u('UM-L').id)
    assert.equal(trazaGas.cantidadConvertida, '1.50000000')
    assert.equal(trazaGas.unidadUtilizadaId, u('UM-M3').id)
    assert.equal(trazaGas.valorFactor, '2.000000000000')
    assert.equal(trazaGas.valorCo2e, '3.00000000')

    const trazaAcpm = resultados.find((fila) => fila.datoCarbonoId === acpm.id)!
    assert.equal(trazaAcpm.cantidadOriginal, '1000.00000000')
    assert.equal(trazaAcpm.unidadOriginalId, u('UM-L').id)
    assert.equal(trazaAcpm.cantidadConvertida, '0.85000000')
    assert.equal(trazaAcpm.unidadUtilizadaId, u('UM-T').id)
    assert.equal(trazaAcpm.valorCo2e, '2.55000000')
  })

  test('omite con motivo claro el dato sin densidad o con unidad inactiva', async ({
    client,
    assert,
  }) => {
    const { token, usuario } = await prepararAdmin(
      client,
      'admin.unidades.omite@huellacarbono.test'
    )
    const datos = await escenario(usuario.id)
    const u = datos.u
    await datos.papel(datos.fuenteGas.id, u('UM-M3').id, '10')
    await datos.papel(datos.fuenteGlp.id, u('UM-L').id, '500')
    const retirada = await UnidadMedida.create({
      codigo: 'UMX-M3-RETIRADO',
      nombre: 'Metro cúbico retirado',
      simbolo: 'm³x',
      magnitud: 'Volumen',
      factorBase: '1000',
      estado: true,
    })
    await datos.papel(datos.fuenteGas.id, retirada.id, '5')
    retirada.estado = false
    await retirada.save()

    const response = await calcular(client, token, datos)
    response.assertStatus(200)
    const calculo = (response.body() as { data: Calculo }).data
    assert.equal(calculo.totalCo2e, '20')
    const motivos = calculo.omitidos.map((fila) => fila.motivo)
    assert.lengthOf(motivos, 2)
    assert.isTrue(motivos.some((motivo) => /requiere el parámetro densidad/.test(motivo)))
    assert.isTrue(motivos.some((motivo) => /no existe o está inactiva/.test(motivo)))
  })

  test('rechaza el cálculo cuando todas las unidades son incompatibles', async ({
    client,
    assert,
  }) => {
    const { token, usuario } = await prepararAdmin(
      client,
      'admin.unidades.rechaza@huellacarbono.test'
    )
    const datos = await escenario(usuario.id)
    // Horas (Tiempo) frente a un factor por m³ (Volumen): no hay relación física.
    await datos.papel(datos.fuenteGas.id, datos.u('UM-H').id, '100')
    // kWh frente a m³ sólo es posible con poder calorífico, que no se registró.
    await datos.papel(datos.fuenteGas.id, datos.u('UM-KWH').id, '100')

    const response = await calcular(client, token, datos)
    response.assertStatus(422)
    assert.match(JSON.stringify(response.body()), /unidades suficientes/)
  })

  test('consolida en la unidad de referencia UM-KG aunque existan otras kg', async ({
    client,
    assert,
  }) => {
    const { token, usuario } = await prepararAdmin(
      client,
      'admin.unidades.referencia@huellacarbono.test'
    )
    const datos = await escenario(usuario.id)
    // Otra kg activa con símbolo «kg CO2e», como la de los fixtures antiguos.
    await UnidadMedida.create({
      codigo: 'UMX-KG-CO2E',
      nombre: 'Kilogramo de CO2 equivalente',
      simbolo: 'kg CO2e',
      magnitud: 'Masa',
      factorBase: '1',
      estado: true,
    })
    await datos.papel(datos.fuenteGas.id, datos.u('UM-M3').id, '10')

    const response = await calcular(client, token, datos)
    response.assertStatus(200)
    const calculo = (response.body() as { data: Calculo & { unidadResultado: string } }).data
    const guardado = await CalculoCarbono.findOrFail(calculo.id)
    assert.equal(guardado.unidadResultadoId, datos.u('UM-KG').id)
    assert.equal(calculo.unidadResultado, 'kg CO2e')
  })

  test('la evidencia conserva la densidad usada aunque luego se edite el dato', async ({
    client,
    assert,
  }) => {
    const { token, usuario } = await prepararAdmin(
      client,
      'admin.unidades.traza@huellacarbono.test'
    )
    const datos = await escenario(usuario.id)
    const u = datos.u
    const dato = await datos.papel(datos.fuenteAcpm.id, u('UM-L').id, '1000', {
      densidad: '0.85',
      unidadDensidadId: u('UM-KG-L').id,
    })

    const primero = await calcular(client, token, datos)
    primero.assertStatus(200)
    const primerCalculo = (primero.body() as { data: Calculo }).data
    assert.equal(primerCalculo.totalCo2e, '2.55')

    // Se corrige la densidad del dato después del cálculo (otra unidad y valor).
    const editado = await client
      .patch(`/api/v1/datos-actividad-carbono/${dato.id}`)
      .bearerToken(token)
      .json({ parametrosCalculo: { densidad: '900', unidadDensidadId: u('UM-KG-M3').id } })
    editado.assertStatus(200)

    // La evidencia del primer cálculo no cambia.
    const [traza] = await ResultadoCarbono.query()
      .where('calculoCarbonoId', primerCalculo.id)
      .preload('calculo', (calculo) => calculo.preload('version'))
    assert.equal(traza.cantidadOriginal, '1000.00000000')
    assert.equal(traza.unidadOriginalId, u('UM-L').id)
    assert.equal(traza.cantidadConvertida, '0.85000000')
    assert.equal(traza.unidadUtilizadaId, u('UM-T').id)
    assert.equal(traza.densidadValor, '0.850000000000')
    assert.equal(traza.unidadDensidadId, u('UM-KG-L').id)
    assert.isNull(traza.poderCalorificoValor)
    assert.isNull(traza.unidadPoderCalorificoId)
    assert.deepEqual(traza.parametrosCalculo, {
      densidad: '0.85',
      unidadDensidadId: u('UM-KG-L').id,
    })
    assert.equal(traza.valorFactor, '3.000000000000')
    assert.equal(traza.factorVersion, '2026')
    assert.equal(traza.calculo.version.id, datos.version.id)
    assert.isNotNull(traza.fechaCalculo)

    // La API del cálculo anterior también devuelve los parámetros originales.
    const detalle = await client
      .get(`/api/v1/calculos-carbono/${primerCalculo.id}`)
      .bearerToken(token)
    detalle.assertStatus(200)
    const linea = (
      detalle.body() as {
        data: { lineas: { densidadValor: string; unidadDensidadId: number }[] }
      }
    ).data.lineas[0]
    assert.equal(linea.densidadValor, '0.850000000000')
    assert.equal(linea.unidadDensidadId, u('UM-KG-L').id)

    // Un cálculo nuevo usa la densidad editada (900 kg/m³ = 0.9 kg/L).
    const segundo = await calcular(client, token, datos)
    segundo.assertStatus(200)
    const segundoCalculo = (segundo.body() as { data: Calculo }).data
    assert.equal(segundoCalculo.totalCo2e, '2.7')
    const [trazaNueva] = await ResultadoCarbono.query().where('calculoCarbonoId', segundoCalculo.id)
    assert.equal(trazaNueva.densidadValor, '900.000000000000')
    assert.equal(trazaNueva.unidadDensidadId, u('UM-KG-M3').id)
  })

  test('sin conversión especial no inventa densidad ni poder calorífico', async ({
    client,
    assert,
  }) => {
    const { token, usuario } = await prepararAdmin(
      client,
      'admin.unidades.sinparametro@huellacarbono.test'
    )
    const datos = await escenario(usuario.id)
    // Tiene densidad registrada, pero L → m³ no la necesita: no debe guardarse.
    await datos.papel(datos.fuenteGas.id, datos.u('UM-L').id, '1500', {
      densidad: '0.7',
      unidadDensidadId: datos.u('UM-KG-L').id,
    })

    const response = await calcular(client, token, datos)
    response.assertStatus(200)
    const calculo = (response.body() as { data: Calculo }).data
    const [traza] = await ResultadoCarbono.query().where('calculoCarbonoId', calculo.id)
    assert.isNull(traza.densidadValor)
    assert.isNull(traza.unidadDensidadId)
    assert.isNull(traza.poderCalorificoValor)
  })
})
