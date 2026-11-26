import { test } from '@japa/runner'
import { PERMISSIONS, SYSTEM_ROLE_SEEDS } from '#data/permission_catalog'
import Actividad from '#models/actividad'
import Departamento from '#models/departamento'
import FuenteEmision from '#models/fuente_emision'
import ActividadEmision from '#models/actividad_emision'
import SubcategoriaEmision from '#models/subcategoria_emision'
import Municipio from '#models/municipio'
import Organizacion from '#models/organizacion'
import Permiso from '#models/permiso'
import Proceso from '#models/proceso'
import Rol from '#models/rol'
import Sede from '#models/sede'
import UnidadMedida from '#models/unidad_medida'
import GwpSet from '#models/gwp_set'
import GwpValue from '#models/gwp_value'
import Usuario from '#models/usuario'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import type { ApiClient } from '@japa/api-client'

const PASSWORD = 'Clave1234'

async function prepararCuenta(client: ApiClient, email: string, rolNombre: string) {
  const roles = new Map<string, Rol>()
  for (const seed of SYSTEM_ROLE_SEEDS) {
    const existing = await Rol.findBy('nombre', seed.nombre)
    roles.set(seed.nombre, existing ?? (await Rol.create({ ...seed, estado: true })))
  }
  for (const permission of PERMISSIONS) {
    const existing = await Permiso.findBy('codigo', permission.code)
    if (!existing) await Permiso.create({ codigo: permission.code, nombre: permission.name })
  }
  const rol = roles.get(rolNombre)!
  const codigos = PERMISSIONS.filter((permission) =>
    (permission.roles as readonly string[]).includes(rolNombre)
  ).map((permission) => permission.code)
  const permisos = codigos.length ? await Permiso.query().whereIn('codigo', codigos) : []
  await rol.load('permisos')
  const asignados = new Set(rol.permisos.map((permiso) => permiso.codigo))
  const faltantes = permisos.filter((permiso) => !asignados.has(permiso.codigo))
  if (faltantes.length) await rol.related('permisos').attach(faltantes.map((permiso) => permiso.id))

  const user = await Usuario.create({
    nombres: 'Prueba',
    apellidos: 'Catalogo',
    email,
    password: PASSWORD,
    estado: true,
  })
  await user.related('roles').attach([rol.id])

  const response = await client.post('/api/v1/auth/login').json({ email, password: PASSWORD })
  response.assertStatus(200)
  const cuerpo = response.body() as { data: { token: string } }
  return { token: cuerpo.data.token, usuario: user }
}

function datos<T>(response: { body: () => unknown }) {
  return (response.body() as { data: T }).data
}

async function cadenaOperativa(usuarioId: number) {
  const departamentos = await Departamento.all()
  const usados = new Set(departamentos.map((item) => item.codigo))
  let codigo = '00'
  for (let indice = 0; indice < 100; indice += 1) {
    const candidato = String(indice).padStart(2, '0')
    if (!usados.has(candidato)) {
      codigo = candidato
      break
    }
  }
  const departamento = await Departamento.create({
    codigo,
    nombre: `Depto catalogo ${codigo}`,
    estado: true,
  })
  const municipio = await Municipio.create({
    departamentoId: departamento.id,
    codigo: `${codigo}901`,
    nombre: `Municipio catalogo ${codigo}`,
    estado: true,
  })
  const organizacion = await Organizacion.create({
    municipioId: municipio.id,
    nombre: `Org catalogo ${codigo}`,
    nit: `8${codigo}01`,
    tipo: 'EMPRESA',
    estado: true,
  })
  const sede = await Sede.create({
    organizacionId: organizacion.id,
    nombre: 'Sede catalogo',
    codigo: 'CAT',
    estado: true,
  })
  const proceso = await Proceso.create({
    sedeId: sede.id,
    nombre: 'Proceso catalogo',
    estado: true,
  })
  const actividad = await Actividad.create({
    procesoId: proceso.id,
    nombre: 'Actividad catalogo',
    estado: true,
  })
  const unidad = await UnidadMedida.create({
    codigo: `M3${codigo}`,
    nombre: `Metro cubico ${codigo}`,
    simbolo: 'm³',
    magnitud: 'Volumen',
    factorBase: '1',
    estado: true,
  })
  const fuente = await FuenteEmision.create({
    codigo: `ELEC${codigo}`,
    nombre: `Electricidad ${codigo}`,
    categoria: 'Energía',
    estado: true,
  })
  const periodo = await db
    .table('periodo_medicion')
    .insert({
      id_organizacion: organizacion.id,
      nombre: `2024-${codigo}`,
      fecha_inicio: '2024-01-01',
      fecha_fin: '2024-12-31',
      estado: 'ABIERTO',
    })
    .returning('id_periodo')
  const periodoId = Number(typeof periodo[0] === 'object' ? periodo[0].id_periodo : periodo[0])

  return { actividad, unidad, fuente, periodoId, usuarioId, codigo }
}

test.group('Catálogos paramétricos', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('el catálogo documental conserva cantidades y el vínculo A2 con subcategoría', async ({
    assert,
  }) => {
    assert.equal(
      await ActividadEmision.query()
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total)),
      15
    )
    assert.equal(
      await SubcategoriaEmision.query()
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total)),
      10
    )
    assert.equal(
      await FuenteEmision.query()
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total)),
      191
    )

    const actividad = await ActividadEmision.query().where('codigo', 'A2').firstOrFail()
    const fuente = await FuenteEmision.query().where('codigo', 'A2-01').firstOrFail()
    const vinculo = await db
      .from('actividad_emision_fuente as vinculo')
      .join(
        'subcategoria_emision as subcategoria',
        'subcategoria.id_subcategoria',
        'vinculo.id_subcategoria_emision'
      )
      .where('vinculo.id_actividad_emision', actividad.id)
      .where('vinculo.id_fuente_emision', fuente.id)
      .select('subcategoria.codigo')
      .first()
    assert.equal(vinculo?.codigo, 'TRANSPORTE-TERRESTRE')
  })

  test('rechaza el listado de tipos de agua sin sesión', async ({ client }) => {
    const response = await client.get('/api/v1/tipos-agua')
    response.assertStatus(401)
  })

  test('un rol sin permiso no consulta los catálogos', async ({ client }) => {
    const { token } = await prepararCuenta(
      client,
      'consulta.catalogo@huellacarbono.test',
      'USUARIO_CONSULTA'
    )
    const response = await client.get('/api/v1/tipos-agua').bearerToken(token)
    response.assertStatus(403)
  })

  test('el tipo de agua se crea, no se duplica y no se apaga si tiene mediciones', async ({
    client,
    assert,
  }) => {
    const { token, usuario } = await prepararCuenta(
      client,
      'admin.catalogo@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const creado = await client.post('/api/v1/tipos-agua').bearerToken(token).json({
      codigo: 'acueducto',
      nombre: 'Agua de acueducto',
      descripcion: 'Agua potable de la red',
    })
    creado.assertStatus(200)
    const tipo = datos<{ id: number; codigo: string; active: boolean }>(creado)
    assert.equal(tipo.codigo, 'ACUEDUCTO')
    assert.isTrue(tipo.active)

    const repetido = await client.post('/api/v1/tipos-agua').bearerToken(token).json({
      codigo: 'ACUEDUCTO',
      nombre: 'Otro nombre de agua',
    })
    repetido.assertStatus(409)

    const nombre = await client.post('/api/v1/tipos-agua').bearerToken(token).json({
      codigo: 'POZO',
      nombre: 'agua de acueducto',
    })
    nombre.assertStatus(409)

    const cadena = await cadenaOperativa(usuario.id)
    await db.table('dato_hidrico').insert({
      id_actividad: cadena.actividad.id,
      id_periodo: cadena.periodoId,
      id_tipo_agua: tipo.id,
      id_unidad: cadena.unidad.id,
      id_usuario_registro: usuario.id,
      cantidad: 10,
      estado_registro: 'REGISTRADO',
    })

    const bloqueado = await client
      .patch(`/api/v1/tipos-agua/${tipo.id}`)
      .bearerToken(token)
      .json({ active: false })
    bloqueado.assertStatus(409)
  })

  test('componente hídrico y alcance de emisión aceptan un alta simple', async ({
    client,
    assert,
  }) => {
    const { token } = await prepararCuenta(
      client,
      'admin.simple@huellacarbono.test',
      'ADMINISTRADOR'
    )

    const componente = await client.post('/api/v1/componentes-hidricos').bearerToken(token).json({
      codigo: 'azul',
      nombre: 'Agua azul',
      descripcion: 'Consumo de agua superficial o subterránea',
    })
    componente.assertStatus(200)
    assert.equal(datos<{ codigo: string }>(componente).codigo, 'AZUL')

    const alcance = await client.post('/api/v1/alcances-emision').bearerToken(token).json({
      codigo: 'alcance-prueba',
      nombre: 'Alcance de prueba hídrica',
      descripcion: 'Alcance creado para validar el componente hídrico',
    })
    alcance.assertStatus(200)
    assert.equal(datos<{ nombre: string }>(alcance).nombre, 'Alcance de prueba hídrica')
  })

  test('la metodología conserva versiones y no se apaga mientras estén activas', async ({
    client,
    assert,
  }) => {
    const { token } = await prepararCuenta(
      client,
      'admin.metodo@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const metodologia = await client.post('/api/v1/metodologias').bearerToken(token).json({
      codigo: 'iso-14046',
      nombre: 'ISO 14046',
      tipo: 'HIDRICA',
      entidadFuente: 'ISO',
    })
    metodologia.assertStatus(200)
    const creada = datos<{ id: number; tipo: string; versionesActivas: number }>(metodologia)
    assert.equal(creada.tipo, 'HIDRICA')
    assert.equal(creada.versionesActivas, 0)

    const invalida = await client
      .post(`/api/v1/metodologias/${creada.id}/versiones`)
      .bearerToken(token)
      .json({
        numeroVersion: '2014',
        fechaInicioVigencia: '2014-01-01',
        fechaFinVigencia: '2013-12-31',
      })
    invalida.assertStatus(422)

    const version = await client
      .post(`/api/v1/metodologias/${creada.id}/versiones`)
      .bearerToken(token)
      .json({
        numeroVersion: '2014',
        fechaInicioVigencia: '2014-01-01',
        descripcion: 'Fixture de prueba; no es metodología oficial',
        referenciaDocumental: 'Referencia sintética para probar el endpoint; no es fuente oficial',
      })
    version.assertStatus(200)
    const creadaVersion = datos<{
      fechaInicioVigencia: string
      numeroVersion: string
      referenciaDocumental: string
    }>(version)
    assert.equal(creadaVersion.numeroVersion, '2014')
    assert.equal(creadaVersion.fechaInicioVigencia, '2014-01-01')
    assert.include(creadaVersion.referenciaDocumental, 'Referencia sintética')

    const identidadBloqueada = await client
      .patch(`/api/v1/metodologias/${creada.id}`)
      .bearerToken(token)
      .json({ tipo: 'CARBONO' })
    identidadBloqueada.assertStatus(409)

    const bloqueada = await client
      .patch(`/api/v1/metodologias/${creada.id}`)
      .bearerToken(token)
      .json({ active: false })
    bloqueada.assertStatus(409)
  })

  test('el factor y el parámetro quedan ligados a una versión vigente', async ({
    client,
    assert,
  }) => {
    const { token } = await prepararCuenta(
      client,
      'admin.factor@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const cadena = await cadenaOperativa(1)
    const metodologia = await client
      .post('/api/v1/metodologias')
      .bearerToken(token)
      .json({
        codigo: `fecoc-${cadena.codigo}`,
        nombre: `FECOC ${cadena.codigo}`,
        tipo: 'CARBONO',
      })
    const metodologiaId = datos<{ id: number }>(metodologia).id
    const gwpVacio = await GwpSet.create({
      codigo: `GWP-EMPTY-${Date.now()}`,
      nombre: 'Fixture GWP vacío',
      horizonteAnios: 100,
      estandarVersion: 'TEST ONLY',
      fuenteCientifica: 'Fixture de pruebas; no es fuente científica',
      referencia: null,
      estado: true,
    })
    const versionSinValoresGwp = await client
      .post(`/api/v1/metodologias/${metodologiaId}/versiones`)
      .bearerToken(token)
      .json({ numeroVersion: '2023', fechaInicioVigencia: '2023-01-01', gwpSetId: gwpVacio.id })
    versionSinValoresGwp.assertStatus(422)

    const gwpSet = await GwpSet.create({
      codigo: `GWP-TEST-${Date.now()}`,
      nombre: 'Fixture GWP sintético de pruebas',
      horizonteAnios: 100,
      estandarVersion: 'TEST ONLY',
      fuenteCientifica: 'Fixture de pruebas; no es fuente científica',
      referencia: null,
      estado: true,
    })
    await GwpValue.create({
      gwpSetId: gwpSet.id,
      gasCodigo: 'CO2',
      nombreGas: 'CO2 de fixture',
      valor: '1',
      nota: 'Solo para probar la relación; no es dato oficial',
    })
    const version = await client
      .post(`/api/v1/metodologias/${metodologiaId}/versiones`)
      .bearerToken(token)
      .json({ numeroVersion: '2024', fechaInicioVigencia: '2024-01-01', gwpSetId: gwpSet.id })
    version.assertStatus(200)
    const versionId = datos<{ id: number }>(version).id
    assert.equal(datos<{ gwpSetId: number; gwpSetCodigo: string }>(version).gwpSetId, gwpSet.id)
    assert.equal(datos<{ gwpSetCodigo: string }>(version).gwpSetCodigo, gwpSet.codigo)

    const unidadSalida = await UnidadMedida.create({
      codigo: `KG${Date.now()}`,
      nombre: 'Kilogramo de prueba',
      simbolo: 'kg',
      magnitud: 'Masa',
      factorBase: '1',
      estado: true,
    })
    const unidadEnergia = await UnidadMedida.create({
      codigo: `KWH${Date.now()}`,
      nombre: 'Kilovatio hora de prueba',
      simbolo: 'kWh',
      magnitud: 'Energia',
      factorBase: '1',
      estado: true,
    })
    const fuenteElectricidad = await FuenteEmision.query().where('codigo', 'B1-01').firstOrFail()

    const opciones = await client.get('/api/v1/factores-emision/opciones').bearerToken(token)
    opciones.assertStatus(200)
    const listas = datos<{ fuentes: { id: number }[]; unidades: { id: number }[] }>(opciones)
    assert.isAtLeast(listas.fuentes.length, 1)
    assert.isAtLeast(listas.unidades.length, 1)

    const factor = await client.post('/api/v1/factores-emision').bearerToken(token).json({
      versionId,
      fuenteEmisionId: fuenteElectricidad.id,
      unidadEntradaId: unidadEnergia.id,
      unidadSalidaId: unidadSalida.id,
      codigo: 'fe-elec',
      nombre: 'Electricidad Colombia',
      valor: '0.126',
      fuente: 'Referencia sintética de prueba; no es factor oficial',
      region: 'Colombia',
      anioAplicacion: 2024,
      origen: 'FIXTURE_TEST',
      fechaInicioVigencia: '2024-01-01',
    })
    factor.assertStatus(200)
    const creado = datos<{
      codigo: string
      valor: string
      fuenteEmisionNombre: string
      anioAplicacion: number
      origen: string
      estadoAprobacion: string
    }>(factor)
    assert.equal(creado.codigo, 'FE-ELEC')
    assert.equal(creado.valor, '0.126')
    assert.equal(creado.anioAplicacion, 2024)
    assert.equal(creado.origen, 'FIXTURE_TEST')
    assert.equal(creado.estadoAprobacion, 'PENDIENTE')
    assert.include(creado.fuenteEmisionNombre, 'Electricidad')

    const crearFactorGas = (
      codigo: string,
      gas: 'CO2' | 'CH4' | 'N2O' | 'CO2E' | 'OTRO',
      gasEspecifico?: string
    ) =>
      client
        .post('/api/v1/factores-emision')
        .bearerToken(token)
        .json({
          versionId,
          fuenteEmisionId: fuenteElectricidad.id,
          unidadEntradaId: unidadEnergia.id,
          unidadSalidaId: unidadSalida.id,
          codigo,
          nombre: `Prueba ${codigo}`,
          valor: '0.5',
          fechaInicioVigencia: '2024-01-01',
          gas,
          ...(gasEspecifico !== undefined ? { gasEspecifico } : {}),
        })

    const co2 = await crearFactorGas('TEST-CO2', 'CO2')
    co2.assertStatus(200)
    assert.equal(datos<{ gas: string; gasEspecifico: string | null }>(co2).gas, 'CO2')
    assert.isNull(datos<{ gasEspecifico: string | null }>(co2).gasEspecifico)

    const co2ConEspecie = await crearFactorGas('TEST-CO2-ESPECIE', 'CO2', 'biogénico')
    co2ConEspecie.assertStatus(422)
    const n2oConEspecie = await crearFactorGas('TEST-N2O-ESPECIE', 'N2O', 'industrial')
    n2oConEspecie.assertStatus(422)
    const ch4SinEspecie = await crearFactorGas('TEST-CH4-SIN-ESPECIE', 'CH4')
    ch4SinEspecie.assertStatus(422)
    const otroSinEspecie = await crearFactorGas('TEST-OTRO-SIN-ESPECIE', 'OTRO')
    otroSinEspecie.assertStatus(422)
    const co2eConEspecie = await crearFactorGas('TEST-CO2E-ESPECIE', 'CO2E', 'R-134a')
    co2eConEspecie.assertStatus(422)

    const ch4 = await crearFactorGas('TEST-CH4', 'CH4', 'fósil de combustión')
    ch4.assertStatus(200)
    assert.equal(datos<{ gasEspecifico: string }>(ch4).gasEspecifico, 'fósil de combustión')
    const otro = await crearFactorGas('TEST-OTRO', 'OTRO', 'R-134a')
    otro.assertStatus(200)
    assert.equal(datos<{ gasEspecifico: string }>(otro).gasEspecifico, 'R-134a')

    const co2Id = datos<{ id: number }>(co2).id
    const updateCo2ConEspecie = await client
      .patch(`/api/v1/factores-emision/${co2Id}`)
      .bearerToken(token)
      .json({ gasEspecifico: 'biogénico' })
    updateCo2ConEspecie.assertStatus(422)
    const updateCh4SinEspecie = await client
      .patch(`/api/v1/factores-emision/${co2Id}`)
      .bearerToken(token)
      .json({ gas: 'CH4' })
    updateCh4SinEspecie.assertStatus(422)
    const updateValido = await client
      .patch(`/api/v1/factores-emision/${co2Id}`)
      .bearerToken(token)
      .json({ gas: 'N2O' })
    updateValido.assertStatus(200)
    assert.equal(datos<{ gas: string; gasEspecifico: string | null }>(updateValido).gas, 'N2O')
    assert.isNull(datos<{ gasEspecifico: string | null }>(updateValido).gasEspecifico)
    const updateN2oConEspecie = await client
      .patch(`/api/v1/factores-emision/${co2Id}`)
      .bearerToken(token)
      .json({ gasEspecifico: 'industrial' })
    updateN2oConEspecie.assertStatus(422)

    const updateCh4Valido = await client
      .patch(`/api/v1/factores-emision/${datos<{ id: number }>(ch4).id}`)
      .bearerToken(token)
      .json({ gasEspecifico: 'fósil fugitivo/proceso' })
    updateCh4Valido.assertStatus(200)
    assert.equal(
      datos<{ gasEspecifico: string }>(updateCh4Valido).gasEspecifico,
      'fósil fugitivo/proceso'
    )

    const aprobacionIncompleta = await client
      .patch(`/api/v1/factores-emision/${datos<{ id: number }>(factor).id}`)
      .bearerToken(token)
      .json({ estadoAprobacion: 'APROBADO' })
    aprobacionIncompleta.assertStatus(422)

    const factorIncompatible = await client
      .post('/api/v1/factores-emision')
      .bearerToken(token)
      .json({
        versionId,
        fuenteEmisionId: fuenteElectricidad.id,
        unidadEntradaId: unidadEnergia.id,
        unidadSalidaId: cadena.unidad.id,
        codigo: 'FE-INCOMPATIBLE-UNIDAD',
        nombre: 'Fixture con unidad de salida incompatible',
        valor: '1',
        fechaInicioVigencia: '2024-01-01',
      })
    factorIncompatible.assertStatus(422)

    const aprobacionCompleta = await client
      .patch(`/api/v1/factores-emision/${datos<{ id: number }>(factor).id}`)
      .bearerToken(token)
      .json({
        estadoAprobacion: 'APROBADO',
        institucionResponsable: 'Fixture de pruebas',
        anioPublicacion: 2026,
      })
    aprobacionCompleta.assertStatus(200)
    assert.equal(
      datos<{ estadoAprobacion: string }>(aprobacionCompleta).estadoAprobacion,
      'APROBADO'
    )

    const versionDocumentalBloqueada = await client
      .patch(`/api/v1/metodologias/${metodologiaId}/versiones/${versionId}`)
      .bearerToken(token)
      .json({ referenciaDocumental: 'Cambio posterior al uso' })
    versionDocumentalBloqueada.assertStatus(409)

    const repetido = await client.post('/api/v1/factores-emision').bearerToken(token).json({
      versionId,
      fuenteEmisionId: fuenteElectricidad.id,
      unidadEntradaId: unidadEnergia.id,
      unidadSalidaId: unidadSalida.id,
      codigo: 'FE-ELEC',
      nombre: 'Otro factor',
      valor: '0.110',
      fechaInicioVigencia: '2024-01-01',
    })
    repetido.assertStatus(409)

    const crearFactorSolapamiento = (codigo: string, dimensiones: Record<string, unknown> = {}) =>
      client
        .post('/api/v1/factores-emision')
        .bearerToken(token)
        .json({
          versionId,
          fuenteEmisionId: fuenteElectricidad.id,
          unidadEntradaId: unidadEnergia.id,
          unidadSalidaId: unidadSalida.id,
          codigo,
          nombre: `Solapamiento ${codigo}`,
          valor: '0.5',
          gas: 'CO2E',
          fechaInicioVigencia: '2024-01-01',
          ...dimensiones,
        })

    const sectorManufactura = await crearFactorSolapamiento('OVERLAP-SECTOR-MAN', {
      sectorCategoria: 'Manufactura',
      anioAplicacion: 2024,
    })
    sectorManufactura.assertStatus(200)
    const sectorTransporte = await crearFactorSolapamiento('OVERLAP-SECTOR-TRA', {
      sectorCategoria: 'Transporte',
      anioAplicacion: 2024,
    })
    sectorTransporte.assertStatus(200)

    const anio2025 = await crearFactorSolapamiento('OVERLAP-ANIO-25', {
      sectorCategoria: 'Manufactura',
      anioAplicacion: 2025,
      fechaFinVigencia: '2025-12-31',
    })
    anio2025.assertStatus(200)
    const mismoContexto = await crearFactorSolapamiento('OVERLAP-DUPLICADO', {
      sectorCategoria: 'Duplicado',
      anioAplicacion: 2024,
      region: '  CO   lombia ',
    })
    mismoContexto.assertStatus(200)
    const regionNormalizadaDuplicada = await crearFactorSolapamiento('OVERLAP-DUP-REGION', {
      sectorCategoria: 'Duplicado',
      anioAplicacion: 2024,
      region: 'co lombia',
    })
    regionNormalizadaDuplicada.assertStatus(409)

    const noSolapa2024 = await crearFactorSolapamiento('OVERLAP-NO-2024', {
      sectorCategoria: 'No solapado',
      fechaInicioVigencia: '2024-01-01',
      fechaFinVigencia: '2024-12-31',
    })
    noSolapa2024.assertStatus(200)
    const noSolapa2025 = await crearFactorSolapamiento('OVERLAP-NO-2025', {
      sectorCategoria: 'No solapado',
      fechaInicioVigencia: '2025-01-01',
      fechaFinVigencia: '2025-12-31',
    })
    noSolapa2025.assertStatus(200)

    const nulos = await crearFactorSolapamiento('OVERLAP-NULLS')
    nulos.assertStatus(200)
    const nulosDuplicados = await crearFactorSolapamiento('OVERLAP-NULLS-DUP')
    nulosDuplicados.assertStatus(409)

    const selfUpdateId = datos<{ id: number }>(noSolapa2024).id
    const selfUpdate = await client
      .patch(`/api/v1/factores-emision/${selfUpdateId}`)
      .bearerToken(token)
      .json({ sectorCategoria: '  No   solapado  ' })
    selfUpdate.assertStatus(200)

    const factorAnioCambio = await crearFactorSolapamiento('OVERLAP-UPDATE-ANIO', {
      sectorCategoria: 'Cambio de año',
      anioAplicacion: 2024,
      fechaFinVigencia: '2025-12-31',
    })
    factorAnioCambio.assertStatus(200)
    const factorAnioColision = await crearFactorSolapamiento('OVERLAP-UPDATE-ANIO-DEST', {
      sectorCategoria: 'Cambio de año',
      anioAplicacion: 2025,
      fechaFinVigencia: '2025-12-31',
    })
    factorAnioColision.assertStatus(200)
    const updateAnioColision = await client
      .patch(`/api/v1/factores-emision/${datos<{ id: number }>(factorAnioColision).id}`)
      .bearerToken(token)
      .json({ anioAplicacion: 2024 })
    updateAnioColision.assertStatus(409)

    const factorAnioNulable = await crearFactorSolapamiento('OVERLAP-UPDATE-ANIO-NULL', {
      sectorCategoria: 'Año anulable',
      anioAplicacion: 2025,
      fechaFinVigencia: '2025-12-31',
    })
    factorAnioNulable.assertStatus(200)
    const updateAnioNulo = await client
      .patch(`/api/v1/factores-emision/${datos<{ id: number }>(factorAnioNulable).id}`)
      .bearerToken(token)
      .json({ anioAplicacion: null })
    updateAnioNulo.assertStatus(200)
    assert.isNull(datos<{ anioAplicacion: number | null }>(updateAnioNulo).anioAplicacion)

    const factorSectorColision = await crearFactorSolapamiento('OVERLAP-UPDATE-SECTOR-DEST', {
      sectorCategoria: 'Sector destino',
      anioAplicacion: 2024,
    })
    factorSectorColision.assertStatus(200)
    const updateSectorColision = await client
      .patch(`/api/v1/factores-emision/${datos<{ id: number }>(factorSectorColision).id}`)
      .bearerToken(token)
      .json({ sectorCategoria: 'Manufactura' })
    updateSectorColision.assertStatus(409)

    const parametro = await client.post('/api/v1/parametros-hidricos').bearerToken(token).json({
      versionId,
      unidadId: cadena.unidad.id,
      codigo: 'escasez-cauca',
      nombre: 'Factor de escasez del Cauca',
      valor: '1.25',
      fuente: 'IDEAM',
      fechaInicioVigencia: '2024-01-01',
    })
    parametro.assertStatus(200)
    assert.equal(
      datos<{ codigo: string; unidadSimbolo: string }>(parametro).codigo,
      'ESCASEZ-CAUCA'
    )
    assert.equal(datos<{ unidadSimbolo: string }>(parametro).unidadSimbolo, 'm³')
  })
})
