import { test } from '@japa/runner'
import { PERMISSIONS, SYSTEM_ROLE_SEEDS } from '#data/permission_catalog'
import Actividad from '#models/actividad'
import ActividadEmision from '#models/actividad_emision'
import AlcanceEmision from '#models/alcance_emision'
import Departamento from '#models/departamento'
import FuenteEmision from '#models/fuente_emision'
import Municipio from '#models/municipio'
import Organizacion from '#models/organizacion'
import PeriodoMedicion from '#models/periodo_medicion'
import Permiso from '#models/permiso'
import Proceso from '#models/proceso'
import Rol from '#models/rol'
import Sede from '#models/sede'
import UnidadMedida from '#models/unidad_medida'
import Usuario from '#models/usuario'
import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

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
    apellidos: 'Papel',
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
  const departamentos = await Departamento.all()
  const usados = new Set(departamentos.map((item) => item.codigo))
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
    nombre: `Depto papel ${codigo}`,
    estado: true,
  })
  const municipio = await Municipio.create({
    departamentoId: departamento.id,
    codigo: `${codigo}901`,
    nombre: `Municipio papel ${codigo}`,
    estado: true,
  })
  const organizacion = await Organizacion.create({
    municipioId: municipio.id,
    nombre: `Frigorifico papel ${codigo}`,
    nit: `8${usuarioId}`,
    tipo: 'EMPRESA',
    estado: true,
  })
  const sede = await Sede.create({
    organizacionId: organizacion.id,
    nombre: 'Planta',
    estado: true,
  })
  const proceso = await Proceso.create({ sedeId: sede.id, nombre: 'Produccion', estado: true })
  const actividad = await Actividad.create({
    procesoId: proceso.id,
    nombre: 'Caldera',
    estado: true,
  })
  const unidad = await UnidadMedida.create({
    codigo: `M3P${codigo}`,
    nombre: 'Metro cubico papel',
    simbolo: 'm3',
    magnitud: 'Volumen',
    factorBase: '1',
    estado: true,
  })
  const fuente = await FuenteEmision.create({
    codigo: `GASP${codigo}`,
    nombre: 'Gas natural papel',
    estado: true,
  })
  const fuenteNoVinculada = await FuenteEmision.create({
    codigo: `OTRA${codigo}`,
    nombre: 'Fuente sin vínculo documental',
    estado: true,
  })
  const alcance = await AlcanceEmision.create({
    codigo: `1P${codigo}`,
    nombre: `Alcance 1 papel ${codigo}`,
    estado: true,
  })
  const actividadEmision = await ActividadEmision.create({
    alcanceId: alcance.id,
    codigo: `A1-${codigo}`,
    nombre: `Combustión fija ${codigo}`,
    estado: true,
  })
  await db.table('actividad_emision_fuente').insert({
    id_actividad_emision: actividadEmision.id,
    id_fuente_emision: fuente.id,
    id_subcategoria_emision: null,
  })
  const periodo = await PeriodoMedicion.create({
    organizacionId: organizacion.id,
    nombre: 'Abril 2026',
    fechaInicio: DateTime.fromISO('2026-04-01'),
    fechaFin: DateTime.fromISO('2026-04-30'),
    estado: 'ABIERTO',
  })
  const cerrado = await PeriodoMedicion.create({
    organizacionId: organizacion.id,
    nombre: 'Marzo 2026',
    fechaInicio: DateTime.fromISO('2026-03-01'),
    fechaFin: DateTime.fromISO('2026-03-31'),
    estado: 'CERRADO',
  })

  return {
    organizacion,
    sede,
    proceso,
    actividad,
    unidad,
    fuente,
    fuenteNoVinculada,
    alcance,
    actividadEmision,
    periodo,
    cerrado,
  }
}

test.group('Papeles de carbono', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function habilitarPermisos(rolNombre: string, codigos: string[]) {
    const rol = await Rol.findByOrFail('nombre', rolNombre)
    const permisos = await Permiso.query().whereIn('codigo', codigos)
    await rol.load('permisos')
    const asignados = new Set(rol.permisos.map((permiso) => permiso.codigo))
    const faltantes = permisos.filter((permiso) => !asignados.has(permiso.codigo))
    if (faltantes.length) {
      await rol.related('permisos').attach(faltantes.map((permiso) => permiso.id))
    }
  }

  test('rechaza el papel sin sesión', async ({ client }) => {
    const response = await client.post('/api/v1/datos-actividad-carbono').json({})
    response.assertStatus(401)
  })

  test('un rol sin permiso no registra papeles', async ({ client }) => {
    const { token } = await prepararCuenta(
      client,
      'consulta.papel@huellacarbono.test',
      'USUARIO_CONSULTA'
    )
    const response = await client.post('/api/v1/datos-actividad-carbono').bearerToken(token).json({
      actividadId: 1,
      periodoId: 1,
      fuenteEmisionId: 1,
      alcanceId: 1,
      unidadId: 1,
      cantidad: '100',
    })
    response.assertStatus(403)
  })

  test('guarda la cantidad, el alcance y el documento del mes', async ({ client, assert }) => {
    const { token, usuario } = await prepararCuenta(
      client,
      'admin.papel@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const datos = await escenario(usuario.id)

    const response = await client.post('/api/v1/datos-actividad-carbono').bearerToken(token).json({
      actividadId: datos.actividad.id,
      periodoId: datos.periodo.id,
      fuenteEmisionId: datos.fuente.id,
      alcanceId: datos.alcance.id,
      actividadEmisionId: datos.actividadEmision.id,
      unidadId: datos.unidad.id,
      cantidad: '100',
      fechaDato: '2026-04-15',
      fuenteDato: 'Medidor de gas, abril 2026',
    })
    response.assertStatus(200)
    const papel = (response.body() as { data: Record<string, string> }).data
    assert.equal(papel.cantidad, '100')
    assert.equal(papel.actividadNombre, 'Caldera')
    assert.equal(papel.alcanceCodigo, datos.alcance.codigo)
    assert.equal(papel.fuenteDato, 'Medidor de gas, abril 2026')
    assert.equal(papel.estadoRegistro, 'REGISTRADO')

    const lista = await client
      .get(
        `/api/v1/datos-actividad-carbono?organizacionId=${datos.organizacion.id}&periodoId=${datos.periodo.id}`
      )
      .bearerToken(token)
    lista.assertStatus(200)
    const filas = (lista.body() as { data: { cantidad: string }[] }).data
    assert.equal(filas[0].cantidad, '100')
  })

  test('un periodo cerrado no recibe papeles y la fecha tiene que caer dentro', async ({
    client,
  }) => {
    const { token, usuario } = await prepararCuenta(
      client,
      'admin.papel.cierre@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const datos = await escenario(usuario.id)
    const cuerpo = {
      actividadId: datos.actividad.id,
      fuenteEmisionId: datos.fuente.id,
      alcanceId: datos.alcance.id,
      actividadEmisionId: datos.actividadEmision.id,
      unidadId: datos.unidad.id,
      cantidad: '100',
    }

    const cerrado = await client
      .post('/api/v1/datos-actividad-carbono')
      .bearerToken(token)
      .json({ ...cuerpo, periodoId: datos.cerrado.id })
    cerrado.assertStatus(409)

    const fuera = await client
      .post('/api/v1/datos-actividad-carbono')
      .bearerToken(token)
      .json({ ...cuerpo, periodoId: datos.periodo.id, fechaDato: '2026-05-01' })
    fuera.assertStatus(422)
  })

  test('rechaza una fuente que no está vinculada a la actividad de emisión', async ({ client }) => {
    const { token, usuario } = await prepararCuenta(
      client,
      'admin.papel.fuente@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const datos = await escenario(usuario.id)
    const response = await client.post('/api/v1/datos-actividad-carbono').bearerToken(token).json({
      actividadId: datos.actividad.id,
      periodoId: datos.periodo.id,
      fuenteEmisionId: datos.fuenteNoVinculada.id,
      alcanceId: datos.alcance.id,
      actividadEmisionId: datos.actividadEmision.id,
      unidadId: datos.unidad.id,
      cantidad: '10',
    })
    response.assertStatus(422)
  })

  test('limita lectura, actualización y creación al ámbito organizacional asignado', async ({
    client,
    assert,
  }) => {
    const cuentaA = await prepararCuenta(
      client,
      'responsable.papel.a@huellacarbono.test',
      'RESPONSABLE_AMBIENTAL'
    )
    const cuentaB = await prepararCuenta(
      client,
      'responsable.papel.b@huellacarbono.test',
      'RESPONSABLE_AMBIENTAL'
    )
    await habilitarPermisos('RESPONSABLE_AMBIENTAL', [
      'organizacion.ver',
      'organizacion.editar',
      'sede.ver',
      'sede.editar',
      'proceso.ver',
      'proceso.editar',
      'actividad.ver',
      'actividad.editar',
      'dato_actividad_carbono.ver',
      'dato_actividad_carbono.crear',
      'dato_actividad_carbono.editar',
    ])

    const datosA = await escenario(cuentaA.usuario.id)
    const datosB = await escenario(cuentaB.usuario.id)
    await datosA.sede.related('usuarios').attach([cuentaA.usuario.id])
    await datosB.sede.related('usuarios').attach([cuentaB.usuario.id])

    const crearPapel = (token: string, datos: Awaited<ReturnType<typeof escenario>>) =>
      client.post('/api/v1/datos-actividad-carbono').bearerToken(token).json({
        actividadId: datos.actividad.id,
        periodoId: datos.periodo.id,
        fuenteEmisionId: datos.fuente.id,
        alcanceId: datos.alcance.id,
        actividadEmisionId: datos.actividadEmision.id,
        unidadId: datos.unidad.id,
        cantidad: '25',
      })

    const propio = await crearPapel(cuentaA.token, datosA)
    const ajeno = await crearPapel(cuentaB.token, datosB)
    propio.assertStatus(200)
    ajeno.assertStatus(200)
    const propioId = (propio.body() as { data: { id: number } }).data.id
    const ajenoId = (ajeno.body() as { data: { id: number } }).data.id

    const organizacionPropia = await client
      .get(`/api/v1/organizaciones/${datosA.organizacion.id}`)
      .bearerToken(cuentaA.token)
    organizacionPropia.assertStatus(200)
    const sedePropia = await client
      .get(`/api/v1/sedes/${datosA.sede.id}`)
      .bearerToken(cuentaA.token)
    sedePropia.assertStatus(200)
    const procesoPropio = await client
      .get(`/api/v1/procesos/${datosA.proceso.id}`)
      .bearerToken(cuentaA.token)
    procesoPropio.assertStatus(200)
    const actividadesPropias = await client
      .get(`/api/v1/procesos/${datosA.proceso.id}/actividades`)
      .bearerToken(cuentaA.token)
    actividadesPropias.assertStatus(200)

    const lecturaPropia = await client
      .get(`/api/v1/datos-actividad-carbono/${propioId}`)
      .bearerToken(cuentaA.token)
    lecturaPropia.assertStatus(200)
    const actualizacionPropia = await client
      .patch(`/api/v1/datos-actividad-carbono/${propioId}`)
      .bearerToken(cuentaA.token)
      .json({ cantidad: '30' })
    actualizacionPropia.assertStatus(200)

    const lecturaAjena = await client
      .get(`/api/v1/datos-actividad-carbono/${ajenoId}`)
      .bearerToken(cuentaA.token)
    lecturaAjena.assertStatus(404)
    const actualizacionAjena = await client
      .patch(`/api/v1/datos-actividad-carbono/${ajenoId}`)
      .bearerToken(cuentaA.token)
      .json({ cantidad: '999' })
    actualizacionAjena.assertStatus(404)
    const papelSigueIntacto = await client
      .get(`/api/v1/datos-actividad-carbono/${ajenoId}`)
      .bearerToken(cuentaB.token)
    papelSigueIntacto.assertStatus(200)
    assert.equal((papelSigueIntacto.body() as { data: { cantidad: string } }).data.cantidad, '25')

    const altaAjena = await crearPapel(cuentaA.token, datosB)
    altaAjena.assertStatus(404)
    const organizacionAjena = await client
      .get(`/api/v1/organizaciones/${datosB.organizacion.id}`)
      .bearerToken(cuentaA.token)
    organizacionAjena.assertStatus(404)
    const sedesAjenas = await client
      .get(`/api/v1/organizaciones/${datosB.organizacion.id}/sedes`)
      .bearerToken(cuentaA.token)
    sedesAjenas.assertStatus(404)
    const procesosAjenos = await client
      .get(`/api/v1/sedes/${datosB.sede.id}/procesos`)
      .bearerToken(cuentaA.token)
    procesosAjenos.assertStatus(404)
    const procesoAjeno = await client
      .get(`/api/v1/procesos/${datosB.proceso.id}`)
      .bearerToken(cuentaA.token)
    procesoAjeno.assertStatus(404)
    const actividadesAjenas = await client
      .get(`/api/v1/procesos/${datosB.proceso.id}/actividades`)
      .bearerToken(cuentaA.token)
    actividadesAjenas.assertStatus(404)
    const actualizarOrganizacionAjena = await client
      .patch(`/api/v1/organizaciones/${datosB.organizacion.id}`)
      .bearerToken(cuentaA.token)
      .json({ sectorEconomico: 'Tecnologías de la Información y las Comunicaciones (TIC)' })
    actualizarOrganizacionAjena.assertStatus(404)
    const actualizarSedeAjena = await client
      .patch(`/api/v1/sedes/${datosB.sede.id}`)
      .bearerToken(cuentaA.token)
      .json({ nombre: 'Sede intrusa' })
    actualizarSedeAjena.assertStatus(404)
    const actualizarProcesoAjeno = await client
      .patch(`/api/v1/procesos/${datosB.proceso.id}`)
      .bearerToken(cuentaA.token)
      .json({ nombre: 'Proceso intruso' })
    actualizarProcesoAjeno.assertStatus(404)
    const actividadAjena = await client
      .patch(`/api/v1/actividades/${datosB.actividad.id}`)
      .bearerToken(cuentaA.token)
      .json({ nombre: 'Actividad intrusa' })
    actividadAjena.assertStatus(404)
    const listaAjena = await client
      .get(`/api/v1/datos-actividad-carbono?organizacionId=${datosB.organizacion.id}`)
      .bearerToken(cuentaA.token)
    listaAjena.assertStatus(404)
    assert.equal((lecturaPropia.body() as { data: { cantidad: string } }).data.cantidad, '25')
  })
})
