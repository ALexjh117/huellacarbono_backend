import { test } from '@japa/runner'
import { PERMISSIONS, SYSTEM_ROLE_SEEDS } from '#data/permission_catalog'
import Actividad from '#models/actividad'
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
  const sede = await Sede.create({ organizacionId: organizacion.id, nombre: 'Planta', estado: true })
  const proceso = await Proceso.create({ sedeId: sede.id, nombre: 'Produccion', estado: true })
  const actividad = await Actividad.create({ procesoId: proceso.id, nombre: 'Caldera', estado: true })
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
  const alcance = await AlcanceEmision.create({
    codigo: `1P${codigo}`,
    nombre: `Alcance 1 papel ${codigo}`,
    estado: true,
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

  return { organizacion, actividad, unidad, fuente, alcance, periodo, cerrado }
}

test.group('Papeles de carbono', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('rechaza el papel sin sesión', async ({ client }) => {
    const response = await client.post('/api/v1/datos-actividad-carbono').json({})
    response.assertStatus(401)
  })

  test('un rol sin permiso no registra papeles', async ({ client }) => {
    const { token } = await prepararCuenta(client, 'consulta.papel@huellacarbono.test', 'USUARIO_CONSULTA')
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
    const { token, usuario } = await prepararCuenta(client, 'admin.papel@huellacarbono.test', 'ADMINISTRADOR')
    const datos = await escenario(usuario.id)

    const response = await client.post('/api/v1/datos-actividad-carbono').bearerToken(token).json({
      actividadId: datos.actividad.id,
      periodoId: datos.periodo.id,
      fuenteEmisionId: datos.fuente.id,
      alcanceId: datos.alcance.id,
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

  test('un periodo cerrado no recibe papeles y la fecha tiene que caer dentro', async ({ client }) => {
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
})
