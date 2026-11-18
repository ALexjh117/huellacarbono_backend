import { test } from '@japa/runner'
import { PERMISSIONS, SYSTEM_ROLE_SEEDS } from '#data/permission_catalog'
import Actividad from '#models/actividad'
import AlcanceEmision from '#models/alcance_emision'
import FuenteEmision from '#models/fuente_emision'
import Organizacion from '#models/organizacion'
import Permiso from '#models/permiso'
import PeriodoMedicion from '#models/periodo_medicion'
import Proceso from '#models/proceso'
import Rol from '#models/rol'
import Sede from '#models/sede'
import UnidadMedida from '#models/unidad_medida'
import Usuario from '#models/usuario'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'

const PASSWORD = 'Clave1234'

/** Contrato en inglés devuelto por la API (ver `dato_actividad_carbono_transformer`). */
type DatoActividad = {
  id: number
  projectId: number | null
  activityId: number
  activityName: string
  processName: string | null
  periodId: number
  periodName: string
  emissionSourceId: number
  emissionSourceName: string
  scopeId: number
  scopeCode: string
  scopeName: string
  unitId: number
  unitSymbol: string
  unitName: string
  quantity: string
  whatToCopy: string
  document: string
  status: string
  dataDate: string | null
  registeredBy: { id: number; name: string } | null
  createdAt: string | null
  updatedAt: string | null
}

type Proyecto = {
  id: number
  name: string
  shortName: string | null
  address: string | null
  nit: string
  active: boolean
}
type ActividadCatalogo = {
  id: number
  name: string
  processName: string | null
  sedeName: string | null
}
type PeriodoCatalogo = {
  id: number
  name: string
  startDate: string
  endDate: string
  status: string
}
type FuenteCatalogo = { id: number; code: string; name: string; category: string | null }
type AlcanceCatalogo = { id: number; code: string; name: string; description: string | null }

/**
 * Dos proyectos distintos (A = el que se usa, B = ajeno), dos actividades y
 * dos periodos dentro de A para poder comprobar que los filtros separan, y
 * catálogos globales con dos opciones cada uno.
 */
type Base = {
  projectId: number
  otherProjectId: number
  inactiveProjectId: number
  activityId: number
  activity2Id: number
  otherActivityId: number
  periodId: number
  period2Id: number
  otherPeriodId: number
  sourceId: number
  source2Id: number
  scopeId: number
  scope2Id: number
  unitId: number
}

async function ensureAdmin() {
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
  if (faltantes.length > 0) {
    await admin.related('permisos').attach(faltantes.map((permiso) => permiso.id))
  }

  return roles
}

async function createAccount(email: string, roleId: number) {
  const user = await Usuario.create({
    nombres: 'Prueba',
    apellidos: 'Usuario',
    email,
    password: PASSWORD,
    estado: true,
  })
  await user.related('roles').attach([roleId])
  return user
}

function payload<T>(response: { body(): unknown }) {
  return (response.body() as { data: T }).data
}

async function login(client: ApiClient, email: string, password = PASSWORD) {
  const response = await client.post('/api/v1/auth/login').json({ email, password })
  response.assertStatus(200)
  return (response.body() as { data: { token: string } }).data.token
}

/** Crea los catálogos mínimos dentro de la transacción de la prueba. */
async function crearBase(): Promise<Base> {
  const municipio = await db
    .from('municipio')
    .select('id_municipio')
    .orderBy('id_municipio', 'asc')
    .first()

  if (!municipio) {
    throw new Error('La tabla municipio no tiene filas para construir los fixtures')
  }

  const idMunicipio = municipio.id_municipio as number

  const proyecto = await Organizacion.create({
    idMunicipio,
    nombre: 'Empresa Huella Norte',
    nombreCorto: 'Huella Norte',
    direccion: 'Calle 1 #2-3, Popayán',
    nit: '900.001.001-1',
    tipo: 'EMPRESA',
    estado: true,
  })
  const otroProyecto = await Organizacion.create({
    idMunicipio,
    nombre: 'Empresa Huella Sur',
    nit: '900.001.002-1',
    tipo: 'EMPRESA',
    estado: true,
  })
  const proyectoInactivo = await Organizacion.create({
    idMunicipio,
    nombre: 'Empresa Fuera de Servicio',
    nit: '900.001.003-1',
    tipo: 'EMPRESA',
    estado: false,
  })

  const sede = await Sede.create({
    idOrganizacion: proyecto.id,
    nombre: 'Planta Norte',
    estado: true,
  })
  const otraSede = await Sede.create({
    idOrganizacion: otroProyecto.id,
    nombre: 'Planta Sur',
    estado: true,
  })

  const proceso = await Proceso.create({ idSede: sede.id, nombre: 'Producción', estado: true })
  const otroProceso = await Proceso.create({
    idSede: otraSede.id,
    nombre: 'Producción',
    estado: true,
  })

  const actividad = await Actividad.create({
    idProceso: proceso.id,
    nombre: 'Caldera',
    estado: true,
  })
  const actividad2 = await Actividad.create({
    idProceso: proceso.id,
    nombre: 'Horno',
    estado: true,
  })
  const otraActividad = await Actividad.create({
    idProceso: otroProceso.id,
    nombre: 'Caldera',
    estado: true,
  })

  const periodo = await PeriodoMedicion.create({
    idOrganizacion: proyecto.id,
    nombre: 'Abril 2026',
    fechaInicio: DateTime.fromISO('2026-04-01'),
    fechaFin: DateTime.fromISO('2026-04-30'),
    estado: 'ABIERTO',
  })
  const periodo2 = await PeriodoMedicion.create({
    idOrganizacion: proyecto.id,
    nombre: 'Mayo 2026',
    fechaInicio: DateTime.fromISO('2026-05-01'),
    fechaFin: DateTime.fromISO('2026-05-31'),
    estado: 'ABIERTO',
  })
  const otroPeriodo = await PeriodoMedicion.create({
    idOrganizacion: otroProyecto.id,
    nombre: 'Abril 2026',
    fechaInicio: DateTime.fromISO('2026-04-01'),
    fechaFin: DateTime.fromISO('2026-04-30'),
    estado: 'ABIERTO',
  })

  const fuente = await FuenteEmision.create({
    codigo: 'GAS_NATURAL',
    nombre: 'Gas natural',
    categoria: 'Combustibles',
    estado: true,
  })
  const otraFuente = await FuenteEmision.create({
    codigo: 'ELECTRICIDAD',
    nombre: 'Electricidad',
    categoria: 'Energía',
    estado: true,
  })

  const alcance = await AlcanceEmision.create({
    codigo: 'ALCANCE_1',
    nombre: 'Alcance 1 - Directos',
    estado: true,
  })
  const otroAlcance = await AlcanceEmision.create({
    codigo: 'ALCANCE_2',
    nombre: 'Alcance 2 - Indirectos',
    estado: true,
  })

  const unidad = await UnidadMedida.create({
    codigo: 'M3',
    nombre: 'Metro cúbico',
    simbolo: 'm³',
    magnitud: 'Volumen',
    factorBase: '1',
    estado: true,
  })

  return {
    projectId: proyecto.id,
    otherProjectId: otroProyecto.id,
    inactiveProjectId: proyectoInactivo.id,
    activityId: actividad.id,
    activity2Id: actividad2.id,
    otherActivityId: otraActividad.id,
    periodId: periodo.id,
    period2Id: periodo2.id,
    otherPeriodId: otroPeriodo.id,
    sourceId: fuente.id,
    source2Id: otraFuente.id,
    scopeId: alcance.id,
    scope2Id: otroAlcance.id,
    unitId: unidad.id,
  }
}

/** Alta con el payload válido por defecto; `overrides` sustituye campos concretos. */
function crearDato(
  client: ApiClient,
  token: string,
  base: Base,
  overrides: Record<string, unknown> = {}
) {
  return client
    .post('/api/v1/activity-data')
    .bearerToken(token)
    .json({
      projectId: base.projectId,
      activityId: base.activityId,
      periodId: base.periodId,
      emissionSourceId: base.sourceId,
      scopeId: base.scopeId,
      unitId: base.unitId,
      quantity: '100',
      whatToCopy: 'Lectura del medidor de gas',
      document: 'Medidor de la caldera, abril 2026',
      ...overrides,
    })
}

/** Cuenta de administradora con permisos de datos de actividad, lista para usar. */
async function adminToken(client: ApiClient, correo: string) {
  const roles = await ensureAdmin()
  await createAccount(correo, roles.get('ADMINISTRADOR')!.id)
  return login(client, correo)
}

test.group('Datos de actividad', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('rechaza el listado sin sesión', async ({ client }) => {
    const response = await client.get('/api/v1/activity-data?projectId=1')
    response.assertStatus(401)
  })

  test('un usuario de consulta no administra datos de actividad', async ({ client }) => {
    const roles = await ensureAdmin()
    await createAccount('consulta.dato@huellacarbono.test', roles.get('USUARIO_CONSULTA')!.id)
    const token = await login(client, 'consulta.dato@huellacarbono.test')

    const listed = await client.get('/api/v1/activity-data?projectId=1').bearerToken(token)
    listed.assertStatus(403)

    const created = await crearDato(client, token, await crearBase())
    created.assertStatus(403)

    const updated = await client
      .patch('/api/v1/activity-data/1')
      .bearerToken(token)
      .json({ quantity: '1' })
    updated.assertStatus(403)

    const deleted = await client.delete('/api/v1/activity-data/1').bearerToken(token)
    deleted.assertStatus(403)

    const projects = await client.get('/api/v1/projects').bearerToken(token)
    projects.assertStatus(403)
  })

  test('el administrador crea, consulta, lista y edita un dato de actividad', async ({
    client,
    assert,
  }) => {
    const token = await adminToken(client, 'dato.admin@huellacarbono.test')
    const base = await crearBase()

    const created = await crearDato(client, token, base)
    created.assertStatus(200)
    const dato = payload<DatoActividad>(created)

    assert.equal(dato.projectId, base.projectId)
    assert.equal(dato.activityId, base.activityId)
    assert.equal(dato.activityName, 'Caldera')
    assert.equal(dato.processName, 'Producción')
    assert.equal(dato.periodId, base.periodId)
    assert.equal(dato.periodName, 'Abril 2026')
    assert.equal(dato.emissionSourceId, base.sourceId)
    assert.equal(dato.emissionSourceName, 'Gas natural')
    assert.equal(dato.scopeCode, 'ALCANCE_1')
    assert.equal(dato.unitId, base.unitId)
    assert.equal(dato.unitSymbol, 'm³')
    assert.equal(dato.unitName, 'Metro cúbico')
    assert.equal(dato.quantity, '100')
    assert.equal(dato.whatToCopy, 'Lectura del medidor de gas')
    assert.equal(dato.document, 'Medidor de la caldera, abril 2026')
    assert.equal(dato.status, 'REGISTRADO')
    assert.isNotNull(dato.registeredBy)
    assert.isNull(dato.dataDate)

    const shown = await client.get(`/api/v1/activity-data/${dato.id}`).bearerToken(token)
    shown.assertStatus(200)
    assert.equal(payload<DatoActividad>(shown).quantity, '100')

    const listed = await client
      .get(`/api/v1/activity-data?projectId=${base.projectId}`)
      .bearerToken(token)
    listed.assertStatus(200)
    const registros = payload<DatoActividad[]>(listed)
    assert.equal(registros.length, 1)
    assert.equal(registros[0].id, dato.id)

    const updated = await client
      .patch(`/api/v1/activity-data/${dato.id}`)
      .bearerToken(token)
      .json({ quantity: '4000.5', document: 'Factura de energía, abril 2026' })
    updated.assertStatus(200)
    const editado = payload<DatoActividad>(updated)
    assert.equal(editado.quantity, '4000.5')
    assert.equal(editado.document, 'Factura de energía, abril 2026')
    assert.equal(editado.whatToCopy, 'Lectura del medidor de gas')
    assert.equal(editado.activityName, 'Caldera')
    assert.equal(editado.status, 'REGISTRADO')
  })

  test('filtra por proyecto, periodo, actividad, fuente y alcance', async ({ client, assert }) => {
    const token = await adminToken(client, 'dato.filtro@huellacarbono.test')
    const base = await crearBase()

    const primero = payload<DatoActividad>(await crearDato(client, token, base))
    const segundo = payload<DatoActividad>(
      await crearDato(client, token, base, {
        activityId: base.activity2Id,
        periodId: base.period2Id,
        emissionSourceId: base.source2Id,
        scopeId: base.scope2Id,
        quantity: '4000',
        whatToCopy: 'Factura de energía',
        document: 'Factura de energía, mayo 2026',
      })
    )
    const ajeno = payload<DatoActividad>(
      await crearDato(client, token, base, {
        projectId: base.otherProjectId,
        activityId: base.otherActivityId,
        periodId: base.otherPeriodId,
        quantity: '600',
        whatToCopy: 'Reporte del transportador',
        document: 'Reporte del transportador, abril 2026',
      })
    )

    const listar = async (filtros: Record<string, number>) => {
      const query = Object.entries(filtros)
        .map(([clave, valor]) => `${clave}=${valor}`)
        .join('&')
      const response = await client.get(`/api/v1/activity-data?${query}`).bearerToken(token)
      response.assertStatus(200)
      return payload<DatoActividad[]>(response)
    }

    const listarIds = async (filtros: Record<string, number>) => {
      const registros = await listar(filtros)
      return registros.map((registro) => registro.id)
    }

    const porProyecto = await listar({ projectId: base.projectId })
    assert.deepEqual(
      porProyecto.map((registro) => registro.id).sort(),
      [primero.id, segundo.id].sort()
    )
    assert.isFalse(porProyecto.some((registro) => registro.id === ajeno.id))

    assert.deepEqual(await listarIds({ projectId: base.projectId, periodId: base.periodId }), [
      primero.id,
    ])
    assert.deepEqual(await listarIds({ projectId: base.projectId, periodId: base.period2Id }), [
      segundo.id,
    ])
    assert.deepEqual(await listarIds({ projectId: base.projectId, activityId: base.activityId }), [
      primero.id,
    ])
    assert.deepEqual(await listarIds({ projectId: base.projectId, activityId: base.activity2Id }), [
      segundo.id,
    ])
    assert.deepEqual(
      await listarIds({ projectId: base.projectId, emissionSourceId: base.sourceId }),
      [primero.id]
    )
    assert.deepEqual(await listarIds({ projectId: base.projectId, scopeId: base.scope2Id }), [
      segundo.id,
    ])

    const sinProyecto = await client.get('/api/v1/activity-data').bearerToken(token)
    sinProyecto.assertStatus(422)
  })

  test('rechaza actividad o periodo de otro proyecto', async ({ client }) => {
    const token = await adminToken(client, 'dato.pertenencia@huellacarbono.test')
    const base = await crearBase()

    const actividadAjena = await crearDato(client, token, base, {
      activityId: base.otherActivityId,
    })
    actividadAjena.assertStatus(422)

    const periodoAjeno = await crearDato(client, token, base, { periodId: base.otherPeriodId })
    periodoAjeno.assertStatus(422)

    const proyectoInexistente = await crearDato(client, token, base, { projectId: 99999999 })
    proyectoInexistente.assertStatus(422)

    const proyectoInactivo = await crearDato(client, token, base, {
      projectId: base.inactiveProjectId,
    })
    proyectoInactivo.assertStatus(422)

    const registro = payload<DatoActividad>(await crearDato(client, token, base))

    const editarActividad = await client
      .patch(`/api/v1/activity-data/${registro.id}`)
      .bearerToken(token)
      .json({ activityId: base.otherActivityId })
    editarActividad.assertStatus(422)

    const editarPeriodo = await client
      .patch(`/api/v1/activity-data/${registro.id}`)
      .bearerToken(token)
      .json({ periodId: base.otherPeriodId })
    editarPeriodo.assertStatus(422)

    const editarProyecto = await client
      .patch(`/api/v1/activity-data/${registro.id}`)
      .bearerToken(token)
      .json({ projectId: base.otherProjectId })
    editarProyecto.assertStatus(422)
  })

  test('rechaza fuentes, alcances o unidades inexistentes o inactivos', async ({ client }) => {
    const token = await adminToken(client, 'dato.catalogos@huellacarbono.test')
    const base = await crearBase()

    const fuenteDesconocida = await crearDato(client, token, base, {
      emissionSourceId: 99999999,
    })
    fuenteDesconocida.assertStatus(422)

    const alcanceDesconocido = await crearDato(client, token, base, { scopeId: 99999999 })
    alcanceDesconocido.assertStatus(422)

    const unidadDesconocida = await crearDato(client, token, base, { unitId: 99999999 })
    unidadDesconocida.assertStatus(422)

    const unidadInactiva = await UnidadMedida.create({
      codigo: 'KW_H',
      nombre: 'Kilovatio hora',
      simbolo: 'kWh',
      magnitud: 'Energía',
      factorBase: '1',
      estado: false,
    })
    const conUnidadInactiva = await crearDato(client, token, base, { unitId: unidadInactiva.id })
    conUnidadInactiva.assertStatus(422)

    const fuenteInactiva = await FuenteEmision.create({
      codigo: 'CARBON',
      nombre: 'Carbón',
      estado: false,
    })
    const conFuenteInactiva = await crearDato(client, token, base, {
      emissionSourceId: fuenteInactiva.id,
    })
    conFuenteInactiva.assertStatus(422)

    const alcanceInactivo = await AlcanceEmision.create({
      codigo: 'ALCANCE_3',
      nombre: 'Alcance 3 - Otras indirectas',
      estado: false,
    })
    const conAlcanceInactivo = await crearDato(client, token, base, {
      scopeId: alcanceInactivo.id,
    })
    conAlcanceInactivo.assertStatus(422)
  })

  test('valida la cantidad: formato decimal y estrictamente mayor que cero', async ({
    client,
    assert,
  }) => {
    const token = await adminToken(client, 'dato.cantidad@huellacarbono.test')
    const base = await crearBase()

    const rechazadas = ['0', '-2', 'abc', '0.123456789', '12345678901234567.5']
    for (const quantity of rechazadas) {
      const response = await crearDato(client, token, base, { quantity })
      response.assertStatus(422)
    }

    const numeroJson = await client.post('/api/v1/activity-data').bearerToken(token).json({
      projectId: base.projectId,
      activityId: base.activityId,
      periodId: base.periodId,
      emissionSourceId: base.sourceId,
      scopeId: base.scopeId,
      unitId: base.unitId,
      quantity: 100,
      whatToCopy: 'Lectura del medidor de gas',
      document: 'Medidor de la caldera, abril 2026',
    })
    numeroJson.assertStatus(422)

    const valida = await crearDato(client, token, base, { quantity: '4000' })
    valida.assertStatus(200)
    assert.equal(payload<DatoActividad>(valida).quantity, '4000')

    const decimal = await crearDato(client, token, base, { quantity: '0.00000001' })
    decimal.assertStatus(200)
    assert.equal(payload<DatoActividad>(decimal).quantity, '0.00000001')

    const maxima = await crearDato(client, token, base, { quantity: '1234567890123456' })
    maxima.assertStatus(200)
    assert.equal(payload<DatoActividad>(maxima).quantity, '1234567890123456')
  })

  test('exige qué se copia y documento en el alta', async ({ client }) => {
    const token = await adminToken(client, 'dato.evidencia@huellacarbono.test')
    const base = await crearBase()

    const sinQueSeCopia = await crearDato(client, token, base, { whatToCopy: undefined })
    sinQueSeCopia.assertStatus(422)

    const sinDocumento = await crearDato(client, token, base, { document: undefined })
    sinDocumento.assertStatus(422)

    const queSeCopiaVacio = await crearDato(client, token, base, { whatToCopy: '' })
    queSeCopiaVacio.assertStatus(422)

    const documentoLargo = await crearDato(client, token, base, { document: 'x'.repeat(256) })
    documentoLargo.assertStatus(422)

    const identificadorInvalido = await crearDato(client, token, base, { activityId: 1.5 })
    identificadorInvalido.assertStatus(422)
  })

  test('elimina un dato de actividad y no permite borrar dos veces', async ({ client, assert }) => {
    const token = await adminToken(client, 'dato.eliminar@huellacarbono.test')
    const base = await crearBase()

    const registro = payload<DatoActividad>(await crearDato(client, token, base))

    const deleted = await client.delete(`/api/v1/activity-data/${registro.id}`).bearerToken(token)
    deleted.assertStatus(200)
    assert.equal(payload<DatoActividad>(deleted).id, registro.id)

    const shown = await client.get(`/api/v1/activity-data/${registro.id}`).bearerToken(token)
    shown.assertStatus(404)

    const again = await client.delete(`/api/v1/activity-data/${registro.id}`).bearerToken(token)
    again.assertStatus(404)

    const listed = await client
      .get(`/api/v1/activity-data?projectId=${base.projectId}`)
      .bearerToken(token)
    listed.assertStatus(200)
    assert.equal(payload<DatoActividad[]>(listed).length, 0)
  })

  test('sirve los catálogos del módulo filtrados por proyecto', async ({ client, assert }) => {
    const token = await adminToken(client, 'dato.listas@huellacarbono.test')
    const base = await crearBase()

    const projects = await client.get('/api/v1/projects').bearerToken(token)
    projects.assertStatus(200)
    const proyectos = payload<Proyecto[]>(projects)
    assert.isTrue(proyectos.some((proyecto) => proyecto.id === base.projectId))
    assert.isFalse(proyectos.some((proyecto) => proyecto.id === base.inactiveProjectId))
    const propio = proyectos.find((proyecto) => proyecto.id === base.projectId)
    assert.equal(propio?.shortName, 'Huella Norte')
    assert.equal(propio?.address, 'Calle 1 #2-3, Popayán')

    const activities = await client
      .get(`/api/v1/activities?projectId=${base.projectId}`)
      .bearerToken(token)
    activities.assertStatus(200)
    const actividades = payload<ActividadCatalogo[]>(activities)
    assert.isTrue(actividades.some((actividad) => actividad.id === base.activityId))
    assert.isFalse(actividades.some((actividad) => actividad.id === base.otherActivityId))
    const caldera = actividades.find((actividad) => actividad.id === base.activityId)
    assert.equal(caldera?.processName, 'Producción')
    assert.equal(caldera?.sedeName, 'Planta Norte')

    const periods = await client
      .get(`/api/v1/periods?projectId=${base.projectId}`)
      .bearerToken(token)
    periods.assertStatus(200)
    const periodos = payload<PeriodoCatalogo[]>(periods)
    assert.isTrue(periodos.some((periodo) => periodo.id === base.periodId))
    assert.isFalse(periodos.some((periodo) => periodo.id === base.otherPeriodId))
    assert.equal(periodos.find((periodo) => periodo.id === base.periodId)?.startDate, '2026-04-01')

    const sources = await client.get('/api/v1/emission-sources').bearerToken(token)
    sources.assertStatus(200)
    assert.isTrue(payload<FuenteCatalogo[]>(sources).some((fuente) => fuente.id === base.sourceId))

    const scopes = await client.get('/api/v1/emission-scopes').bearerToken(token)
    scopes.assertStatus(200)
    assert.isTrue(payload<AlcanceCatalogo[]>(scopes).some((alcance) => alcance.id === base.scopeId))

    const sinProyectoActividades = await client.get('/api/v1/activities').bearerToken(token)
    sinProyectoActividades.assertStatus(422)

    const sinProyectoPeriodos = await client.get('/api/v1/periods').bearerToken(token)
    sinProyectoPeriodos.assertStatus(422)

    const desconocidas = await client
      .get('/api/v1/activities?projectId=99999999')
      .bearerToken(token)
    desconocidas.assertStatus(200)
    assert.equal(payload<ActividadCatalogo[]>(desconocidas).length, 0)
  })

  test('devuelve 404 ante identificadores inexistentes o malformados', async ({ client }) => {
    const token = await adminToken(client, 'dato.404@huellacarbono.test')

    const inexistente = await client.get('/api/v1/activity-data/99999999').bearerToken(token)
    inexistente.assertStatus(404)

    const malformado = await client.get('/api/v1/activity-data/abc').bearerToken(token)
    malformado.assertStatus(404)

    const borrado = await client.delete('/api/v1/activity-data/99999999').bearerToken(token)
    borrado.assertStatus(404)
  })
})
