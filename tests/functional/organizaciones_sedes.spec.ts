import { test } from '@japa/runner'
import { PERMISSIONS, SYSTEM_ROLE_SEEDS } from '#data/permission_catalog'
import Departamento from '#models/departamento'
import Municipio from '#models/municipio'
import Permiso from '#models/permiso'
import Rol from '#models/rol'
import Usuario from '#models/usuario'
import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiClient } from '@japa/api-client'

const PASSWORD = 'Clave1234'

async function prepararRoles() {
  const roles = new Map<string, Rol>()

  for (const seed of SYSTEM_ROLE_SEEDS) {
    const existing = await Rol.findBy('nombre', seed.nombre)
    roles.set(seed.nombre, existing ?? (await Rol.create({ ...seed, estado: true })))
  }

  for (const permission of PERMISSIONS) {
    const existing = await Permiso.findBy('codigo', permission.code)
    if (!existing) {
      await Permiso.create({ codigo: permission.code, nombre: permission.name })
    }
  }

  const admin = roles.get('ADMINISTRADOR')!
  const permisos = await Permiso.query().whereIn(
    'codigo',
    PERMISSIONS.map((permission) => permission.code)
  )
  await admin.load('permisos')
  const asignados = new Set(admin.permisos.map((permiso) => permiso.codigo))
  const faltantes = permisos.filter((permiso) => !asignados.has(permiso.codigo))
  if (faltantes.length > 0) {
    await admin.related('permisos').attach(faltantes.map((permiso) => permiso.id))
  }

  return roles
}

async function crearCuenta(email: string, roleId: number) {
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

function datos<T>(response: { body: () => unknown }) {
  return (response.body() as { data: T }).data
}

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: PASSWORD })
  response.assertStatus(200)
  return datos<{ token: string }>(response).token
}

async function territorioDePrueba() {
  const departamentos = await Departamento.all()
  const usados = new Set(departamentos.map((departamento) => departamento.codigo))
  let codigo = ''
  for (let indice = 0; indice < 100; indice += 1) {
    const candidato = String(indice).padStart(2, '0')
    if (!usados.has(candidato)) {
      codigo = candidato
      break
    }
  }

  const departamento = await Departamento.create({
    codigo,
    nombre: `Departamento prueba ${codigo}`,
    estado: true,
  })
  const popayan = await Municipio.create({
    departamentoId: departamento.id,
    codigo: `${codigo}001`,
    nombre: `Municipio ${codigo} A`,
    estado: true,
  })
  const cali = await Municipio.create({
    departamentoId: departamento.id,
    codigo: `${codigo}002`,
    nombre: `Municipio ${codigo} B`,
    estado: true,
  })

  return { departamento, popayan, cali }
}

test.group('Organizaciones y sedes', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('rechaza el listado sin sesión', async ({ client }) => {
    const response = await client.get('/api/v1/organizaciones')
    response.assertStatus(401)
  })

  test('un usuario de consulta no administra organizaciones', async ({ client }) => {
    const roles = await prepararRoles()
    await crearCuenta('consulta.org@huellacarbono.test', roles.get('USUARIO_CONSULTA')!.id)
    const token = await login(client, 'consulta.org@huellacarbono.test')

    const listado = await client.get('/api/v1/organizaciones').bearerToken(token)
    listado.assertStatus(403)

    const creada = await client.post('/api/v1/organizaciones').bearerToken(token).json({
      municipioId: 1,
      nombre: 'No debe crearse',
      nit: '900',
      tipo: 'EMPRESA',
    })
    creada.assertStatus(403)
  })

  test('el administrador recorre departamento, organización, sede y usuarios', async ({
    client,
    assert,
  }) => {
    const roles = await prepararRoles()
    const admin = await crearCuenta('admin.org@huellacarbono.test', roles.get('ADMINISTRADOR')!.id)
    const operativo = await crearCuenta(
      'operativo.org@huellacarbono.test',
      roles.get('USUARIO_CONSULTA')!.id
    )
    const token = await login(client, 'admin.org@huellacarbono.test')
    const { departamento, popayan, cali } = await territorioDePrueba()

    const departamentos = await client.get('/api/v1/territorio/departamentos').bearerToken(token)
    departamentos.assertStatus(200)
    const listaDepartamentos = datos<{ codigo: string }[]>(departamentos)
    assert.isTrue(listaDepartamentos.some((item) => item.codigo === departamento.codigo))

    const municipios = await client
      .get(`/api/v1/territorio/municipios?departamentoId=${departamento.id}`)
      .bearerToken(token)
    municipios.assertStatus(200)
    assert.lengthOf(datos<{ id: number }[]>(municipios), 2)

    const creada = await client.post('/api/v1/organizaciones').bearerToken(token).json({
      municipioId: popayan.id,
      nombre: 'Servicio Nacional de Aprendizaje',
      nombreCorto: 'SENA',
      nit: '899999034-1',
      tipo: 'INSTITUCION_EDUCATIVA',
      sectorEconomico: 'Servicios Sociales, Salud y Educación',
      direccion: 'Carrera 5',
      representanteNombre: 'Representante de prueba',
      representanteTipoDocumento: 'CC',
      representanteNumeroDocumento: '1000000001',
    })
    creada.assertStatus(200)
    const organizacion = datos<{
      id: number
      nit: string
      municipio: { id: number; departamento: { id: number } }
      sedesActivas: number
    }>(creada)
    assert.equal(organizacion.nit, '899999034-1')
    assert.equal(organizacion.municipio.id, popayan.id)
    assert.equal(organizacion.municipio.departamento.id, departamento.id)
    assert.equal(organizacion.sedesActivas, 0)

    const duplicada = await client.post('/api/v1/organizaciones').bearerToken(token).json({
      municipioId: popayan.id,
      nombre: 'servicio nacional de aprendizaje',
      nit: '111',
      tipo: 'EMPRESA',
    })
    duplicada.assertStatus(409)

    const otroMunicipio = await client.post('/api/v1/organizaciones').bearerToken(token).json({
      municipioId: cali.id,
      nombre: 'Servicio Nacional de Aprendizaje',
      nit: '899999034-1',
      tipo: 'INSTITUCION_EDUCATIVA',
    })
    otroMunicipio.assertStatus(200)

    const sede = await client
      .post(`/api/v1/organizaciones/${organizacion.id}/sedes`)
      .bearerToken(token)
      .json({
        nombre: 'CTPI',
        codigo: 'CTPI',
        responsableNombre: 'Subdirector CTPI',
        responsableCargo: 'Subdirector',
      })
    sede.assertStatus(200)
    const creadaSede = datos<{ id: number; organizacionId: number; usuarios: unknown[] }>(sede)
    assert.equal(creadaSede.organizacionId, organizacion.id)
    assert.deepEqual(creadaSede.usuarios, [])

    const sedeRepetida = await client
      .post(`/api/v1/organizaciones/${organizacion.id}/sedes`)
      .bearerToken(token)
      .json({ nombre: 'ctpi' })
    sedeRepetida.assertStatus(409)

    const comercio = await client
      .post(`/api/v1/organizaciones/${organizacion.id}/sedes`)
      .bearerToken(token)
      .json({ nombre: 'Comercio', codigo: 'COMERCIO' })
    comercio.assertStatus(200)

    const asignada = await client
      .put(`/api/v1/sedes/${creadaSede.id}/usuarios`)
      .bearerToken(token)
      .json({ userIds: [operativo.id, admin.id] })
    asignada.assertStatus(200)
    const usuarios = datos<{ usuarios: { id: number }[] }>(asignada).usuarios.map(
      (usuario) => usuario.id
    )
    assert.deepEqual(
      usuarios.sort((a, b) => a - b),
      [admin.id, operativo.id].sort((a, b) => a - b)
    )

    const bloqueada = await client
      .patch(`/api/v1/organizaciones/${organizacion.id}`)
      .bearerToken(token)
      .json({ active: false })
    bloqueada.assertStatus(409)

    const sedeApagada = await client
      .patch(`/api/v1/sedes/${creadaSede.id}`)
      .bearerToken(token)
      .json({ active: false })
    sedeApagada.assertStatus(200)

    const comercioApagado = await client
      .patch(`/api/v1/sedes/${datos<{ id: number }>(comercio).id}`)
      .bearerToken(token)
      .json({ active: false })
    comercioApagado.assertStatus(200)

    const apagada = await client
      .patch(`/api/v1/organizaciones/${organizacion.id}`)
      .bearerToken(token)
      .json({ active: false })
    apagada.assertStatus(200)
    assert.equal(datos<{ active: boolean }>(apagada).active, false)

    const otraVez = await client
      .patch(`/api/v1/organizaciones/${organizacion.id}`)
      .bearerToken(token)
      .json({ active: false })
    otraVez.assertStatus(409)
  })
})
