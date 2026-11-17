import { test } from '@japa/runner'
import { PERMISSIONS, SYSTEM_ROLE_SEEDS } from '#data/permission_catalog'
import Departamento from '#models/departamento'
import Municipio from '#models/municipio'
import Organizacion from '#models/organizacion'
import Permiso from '#models/permiso'
import Rol from '#models/rol'
import Sede from '#models/sede'
import Usuario from '#models/usuario'
import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiClient } from '@japa/api-client'

const PASSWORD = 'Clave1234'

async function prepararAdmin(client: ApiClient, email: string) {
  const roles = new Map<string, Rol>()
  for (const seed of SYSTEM_ROLE_SEEDS) {
    const existing = await Rol.findBy('nombre', seed.nombre)
    roles.set(seed.nombre, existing ?? (await Rol.create({ ...seed, estado: true })))
  }
  for (const permission of PERMISSIONS) {
    const existing = await Permiso.findBy('codigo', permission.code)
    if (!existing) await Permiso.create({ codigo: permission.code, nombre: permission.name })
  }
  const admin = roles.get('ADMINISTRADOR')!
  const permisos = await Permiso.query().whereIn(
    'codigo',
    PERMISSIONS.map((permission) => permission.code)
  )
  await admin.load('permisos')
  const asignados = new Set(admin.permisos.map((permiso) => permiso.codigo))
  const faltantes = permisos.filter((permiso) => !asignados.has(permiso.codigo))
  if (faltantes.length) await admin.related('permisos').attach(faltantes.map((permiso) => permiso.id))

  const user = await Usuario.create({
    nombres: 'Prueba',
    apellidos: 'Proceso',
    email,
    password: PASSWORD,
    estado: true,
  })
  await user.related('roles').attach([admin.id])

  const response = await client.post('/api/v1/auth/login').json({ email, password: PASSWORD })
  response.assertStatus(200)
  return response.body().data.token as string
}

async function sedeDePrueba() {
  const usados = new Set((await Departamento.all()).map((item) => item.codigo))
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
    nombre: `Depto proceso ${codigo}`,
    estado: true,
  })
  const municipio = await Municipio.create({
    departamentoId: departamento.id,
    codigo: `${codigo}901`,
    nombre: `Municipio proceso ${codigo}`,
    estado: true,
  })
  const organizacion = await Organizacion.create({
    municipioId: municipio.id,
    nombre: `Org proceso ${codigo}`,
    nit: `9${codigo}01`,
    tipo: 'EMPRESA',
    estado: true,
  })
  return Sede.create({
    organizacionId: organizacion.id,
    nombre: 'Planta',
    codigo: 'PLANTA',
    estado: true,
  })
}

function datos<T>(response: { body: () => unknown }) {
  return (response.body() as { data: T }).data
}

test.group('Procesos y actividades', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('rechaza el listado sin sesión', async ({ client }) => {
    const response = await client.get('/api/v1/sedes/1/procesos')
    response.assertStatus(401)
  })

  test('un proceso de la sede agrupa actividades y no se apaga si quedan activas', async ({
    client,
    assert,
  }) => {
    const token = await prepararAdmin(client, 'admin.proceso@huellacarbono.test')
    const sede = await sedeDePrueba()

    const creado = await client
      .post(`/api/v1/sedes/${sede.id}/procesos`)
      .bearerToken(token)
      .json({ nombre: 'Formación', descripcion: 'Actividades de formación' })
    creado.assertStatus(200)
    const proceso = datos<{ id: number; sedeId: number; actividadesActivas: number }>(creado)
    assert.equal(proceso.sedeId, sede.id)
    assert.equal(proceso.actividadesActivas, 0)

    const repetido = await client
      .post(`/api/v1/sedes/${sede.id}/procesos`)
      .bearerToken(token)
      .json({ nombre: 'formación' })
    repetido.assertStatus(409)

    const actividad = await client
      .post(`/api/v1/procesos/${proceso.id}/actividades`)
      .bearerToken(token)
      .json({ nombre: 'Uso de energía', descripcion: 'Consumo eléctrico de los ambientes' })
    actividad.assertStatus(200)
    const creada = datos<{ id: number; procesoId: number }>(actividad)
    assert.equal(creada.procesoId, proceso.id)

    const actividadRepetida = await client
      .post(`/api/v1/procesos/${proceso.id}/actividades`)
      .bearerToken(token)
      .json({ nombre: 'uso de energía' })
    actividadRepetida.assertStatus(409)

    const bloqueado = await client
      .patch(`/api/v1/procesos/${proceso.id}`)
      .bearerToken(token)
      .json({ active: false })
    bloqueado.assertStatus(409)

    const apagada = await client
      .patch(`/api/v1/actividades/${creada.id}`)
      .bearerToken(token)
      .json({ active: false })
    apagada.assertStatus(200)

    const apagado = await client
      .patch(`/api/v1/procesos/${proceso.id}`)
      .bearerToken(token)
      .json({ active: false })
    apagado.assertStatus(200)
    assert.equal(datos<{ active: boolean }>(apagado).active, false)
  })
})
