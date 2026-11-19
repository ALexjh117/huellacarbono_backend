import { test } from '@japa/runner'
import { PERMISSIONS, SYSTEM_ROLE_SEEDS } from '#data/permission_catalog'
import Actividad from '#models/actividad'
import AlcanceEmision from '#models/alcance_emision'
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
import Rol from '#models/rol'
import Sede from '#models/sede'
import UnidadMedida from '#models/unidad_medida'
import Usuario from '#models/usuario'
import { dividirEmision, multiplicarEmision } from '#services/calculo_carbono_service'
import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'

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
    apellidos: 'Calculo',
    email,
    password: PASSWORD,
    estado: true,
  })
  await user.related('roles').attach([rol.id])
  const response = await client.post('/api/v1/auth/login').json({ email, password: PASSWORD })
  response.assertStatus(200)
  return { token: (response.body() as { data: { token: string } }).data.token, usuario: user }
}

async function codigoLibre() {
  const usados = new Set((await Departamento.all()).map((item) => item.codigo))
  for (let indice = 0; indice < 100; indice += 1) {
    const candidato = String(indice).padStart(2, '0')
    if (!usados.has(candidato)) return candidato
  }
  return '99'
}

async function escenario(usuarioId: number) {
  const codigo = await codigoLibre()
  const departamento = await Departamento.create({
    codigo,
    nombre: `Depto calculo ${codigo}`,
    estado: true,
  })
  const municipio = await Municipio.create({
    departamentoId: departamento.id,
    codigo: `${codigo}901`,
    nombre: `Municipio calculo ${codigo}`,
    estado: true,
  })
  const organizacion = await Organizacion.create({
    municipioId: municipio.id,
    nombre: `Frigorifico ${codigo}`,
    nit: `9${usuarioId}`,
    tipo: 'EMPRESA',
    estado: true,
  })
  const sede = await Sede.create({
    organizacionId: organizacion.id,
    nombre: 'Planta',
    estado: true,
  })
  const produccion = await Proceso.create({ sedeId: sede.id, nombre: 'Produccion', estado: true })
  const distribucion = await Proceso.create({ sedeId: sede.id, nombre: 'Distribucion', estado: true })
  const caldera = await Actividad.create({ procesoId: produccion.id, nombre: 'Caldera', estado: true })
  const frios = await Actividad.create({
    procesoId: produccion.id,
    nombre: 'Energia de los cuartos frios',
    estado: true,
  })
  const camiones = await Actividad.create({
    procesoId: distribucion.id,
    nombre: 'Camiones contratados',
    estado: true,
  })
  const unidadGas = await UnidadMedida.create({
    codigo: `M3${codigo}`,
    nombre: 'Metro cubico',
    simbolo: 'm3',
    magnitud: 'Volumen',
    factorBase: '1',
    estado: true,
  })
  const unidadKwh = await UnidadMedida.create({
    codigo: `KWH${codigo}`,
    nombre: 'Kilovatio hora',
    simbolo: 'kWh',
    magnitud: 'Energia',
    factorBase: '1',
    estado: true,
  })
  const unidadLitro = await UnidadMedida.create({
    codigo: `L${codigo}`,
    nombre: 'Litro',
    simbolo: 'L',
    magnitud: 'Volumen',
    factorBase: '1',
    estado: true,
  })
  const unidadSalida = await UnidadMedida.create({
    codigo: `CO2${codigo}`,
    nombre: 'Kilogramo de CO2 equivalente',
    simbolo: 'kg CO2e',
    magnitud: 'Masa',
    factorBase: '1',
    estado: true,
  })
  const fuenteGas = await FuenteEmision.create({
    codigo: `GAS${codigo}`,
    nombre: 'Gas natural',
    estado: true,
  })
  const fuenteLuz = await FuenteEmision.create({
    codigo: `ELEC${codigo}`,
    nombre: 'Electricidad',
    estado: true,
  })
  const fuenteDiesel = await FuenteEmision.create({
    codigo: `DIE${codigo}`,
    nombre: 'Diesel',
    estado: true,
  })
  const alcance1 = await AlcanceEmision.create({ codigo: `A1${codigo}`, nombre: `Alcance 1 ${codigo}`, estado: true })
  const alcance2 = await AlcanceEmision.create({ codigo: `A2${codigo}`, nombre: `Alcance 2 ${codigo}`, estado: true })
  const alcance3 = await AlcanceEmision.create({ codigo: `A3${codigo}`, nombre: `Alcance 3 ${codigo}`, estado: true })
  const metodologia = await Metodologia.create({
    codigo: `GHG${codigo}`,
    nombre: 'GHG Protocol',
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
    nombre: 'Abril 2026',
    fechaInicio: DateTime.fromISO('2026-04-01'),
    fechaFin: DateTime.fromISO('2026-04-30'),
    estado: 'ABIERTO',
  })
  const factor = async (
    fuenteId: number,
    unidadId: number,
    codigoFactor: string,
    valor: string
  ) =>
    FactorEmision.create({
      versionId: version.id,
      fuenteEmisionId: fuenteId,
      unidadEntradaId: unidadId,
      unidadSalidaId: unidadSalida.id,
      codigo: codigoFactor,
      nombre: codigoFactor,
      valor,
      fechaInicioVigencia: DateTime.fromISO('2026-01-01'),
      estado: true,
    })
  await factor(fuenteGas.id, unidadGas.id, `FE-GAS-${codigo}`, '2')
  await factor(fuenteLuz.id, unidadKwh.id, `FE-ELEC-${codigo}`, '0.20')
  await factor(fuenteDiesel.id, unidadLitro.id, `FE-DIE-${codigo}`, '2.50')

  const papel = async (
    actividadId: number,
    fuenteId: number,
    unidadId: number,
    alcanceId: number,
    cantidad: string
  ) =>
    DatoActividadCarbono.create({
      actividadId,
      periodoId: periodo.id,
      fuenteEmisionId: fuenteId,
      alcanceId,
      unidadId,
      usuarioRegistroId: usuarioId,
      cantidad,
      fuenteDato: 'Documento de abril',
      estadoRegistro: 'REGISTRADO',
    })

  await papel(caldera.id, fuenteGas.id, unidadGas.id, alcance1.id, '100')
  await papel(frios.id, fuenteLuz.id, unidadKwh.id, alcance2.id, '4000')
  await papel(camiones.id, fuenteDiesel.id, unidadLitro.id, alcance3.id, '600')

  return { organizacion, periodo, version, fuenteLuz, unidadKwh, frios, alcance2 }
}

test.group('Cálculo de carbono', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('la multiplicación de la guía no pierde el decimal', ({ assert }) => {
    assert.equal(multiplicarEmision('4000', '0.20'), '800')
    assert.equal(multiplicarEmision('100', '2'), '200')
    assert.equal(multiplicarEmision('600', '2.50'), '1500')
    assert.equal(multiplicarEmision('180', '2.31'), '415.8')
    assert.equal(dividirEmision('1090.8', '1000'), '1.0908')
    assert.equal(dividirEmision('1090.8', '10000'), '0.10908')
    assert.equal(dividirEmision('130', '1000'), '0.13')
  })

  test('rechaza el cálculo sin sesión', async ({ client }) => {
    const response = await client.post('/api/v1/calculos-carbono').json({})
    response.assertStatus(401)
  })

  test('un rol sin permiso no calcula', async ({ client }) => {
    const { token } = await prepararCuenta(client, 'consulta.calculo@huellacarbono.test', 'USUARIO_CONSULTA')
    const response = await client.post('/api/v1/calculos-carbono').bearerToken(token).json({
      organizacionId: 1,
      periodoId: 1,
      versionId: 1,
    })
    response.assertStatus(403)
  })

  test('abril de El Roble suma 2500 y deja fuera un papel sin factor', async ({ client, assert }) => {
    const { token, usuario } = await prepararCuenta(client, 'admin.calculo@huellacarbono.test', 'ADMINISTRADOR')
    const escenarioRoble = await escenario(usuario.id)
    const huerfano = await FuenteEmision.create({
      codigo: `HUE${usuario.id}`,
      nombre: 'Fuente sin factor',
      estado: true,
    })
    await DatoActividadCarbono.create({
      actividadId: escenarioRoble.frios.id,
      periodoId: escenarioRoble.periodo.id,
      fuenteEmisionId: huerfano.id,
      alcanceId: escenarioRoble.alcance2.id,
      unidadId: escenarioRoble.unidadKwh.id,
      usuarioRegistroId: usuario.id,
      cantidad: '10',
      fuenteDato: 'Papel sin factor',
      estadoRegistro: 'REGISTRADO',
    })

    const response = await client.post('/api/v1/calculos-carbono').bearerToken(token).json({
      organizacionId: escenarioRoble.organizacion.id,
      periodoId: escenarioRoble.periodo.id,
      versionId: escenarioRoble.version.id,
      unidadesProducidas: '10000',
      unidadFuncional: 'unidades',
    })
    response.assertStatus(200)
    const data = response.body().data
    assert.equal(data.totalCo2e, '2500')
    assert.equal(data.toneladasCo2e, '2.5')
    assert.equal(data.intensidadCo2e, '0.25')
    assert.equal(data.unidadFuncional, 'unidades')
    assert.equal(data.unidadResultado, 'kg CO2e')
    assert.lengthOf(data.lineas, 3)
    assert.lengthOf(data.omitidos, 1)
    assert.equal(data.omitidos[0].motivo, 'No hay un factor de esa versión para esta fuente y esta unidad')

    const sugerido = await client
      .get(`/api/v1/calculos-carbono/${data.id}/reduccion`)
      .bearerToken(token)
    sugerido.assertStatus(200)
    const sugerencias = sugerido.body().data.acciones
    assert.lengthOf(sugerencias, 3)
    assert.equal(sugerencias[0].fuenteNombre, 'Diesel')
    assert.include(sugerencias[0].meta, '1500')
    assert.equal(sugerencias[1].fuenteNombre, 'Electricidad')
    assert.include(sugerencias[1].estrategia, 'LED')
    assert.equal(sugerencias[2].fuenteNombre, 'Gas natural')

    const plan = await client
      .put(`/api/v1/calculos-carbono/${data.id}/reduccion`)
      .bearerToken(token)
      .json({
        acciones: [
          { estrategia: 'Iluminación eficiente', indicador: 'kWh/mes', meta: 'Reducir 10%' },
        ],
      })
    plan.assertStatus(200)
    assert.equal(plan.body().data.acciones[0].meta, 'Reducir 10%')

    const informe = await client.get(`/api/v1/calculos-carbono/${data.id}/informe`).bearerToken(token)
    informe.assertStatus(200)
    assert.equal(informe.body().data.toneladasCo2e, '2.5')
    assert.equal(informe.body().data.intensidadCo2e, '0.25')
    assert.equal(informe.body().data.acciones[0].estrategia, 'Iluminación eficiente')

    const resumen = await client
      .get(`/api/v1/calculos-carbono/resumen?organizacionId=${escenarioRoble.organizacion.id}`)
      .bearerToken(token)
    resumen.assertStatus(200)
    assert.equal(resumen.body().data.ultimo.totalCo2e, '2500')
    assert.equal(resumen.body().data.ultimo.toneladasCo2e, '2.5')

    const historial = await client
      .get(`/api/v1/calculos-carbono?organizacionId=${escenarioRoble.organizacion.id}`)
      .bearerToken(token)
    historial.assertStatus(200)
    assert.equal(historial.body().data[0].totalCo2e, '2500')
  })
})
