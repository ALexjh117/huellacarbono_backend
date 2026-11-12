import { test } from '@japa/runner'
import { PERMISSIONS, SYSTEM_ROLE_SEEDS } from '#data/permission_catalog'
import Permiso from '#models/permiso'
import Rol from '#models/rol'
import Usuario from '#models/usuario'
import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiClient } from '@japa/api-client'

const PASSWORD = 'Clave1234'

async function ensureRoles() {
  const roles = new Map<string, Rol>()

  for (const seed of SYSTEM_ROLE_SEEDS) {
    const existing = await Rol.findBy('nombre', seed.nombre)
    roles.set(seed.nombre, existing ?? (await Rol.create({ ...seed, estado: true })))
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

async function createAccount(email: string, roleId: number, active = true) {
  const user = await Usuario.create({
    nombres: 'Prueba',
    apellidos: 'Usuario',
    email,
    password: PASSWORD,
    estado: active,
  })
  await user.related('roles').attach([roleId])
  return user
}

function payload<T>(response: { body: () => unknown }) {
  return (response.body() as { data: T }).data
}

async function login(client: ApiClient, email: string, password = PASSWORD) {
  const response = await client.post('/api/v1/auth/login').json({ email, password })
  response.assertStatus(200)
  return response.body().data.token as string
}

test.group('Usuarios y roles', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('rechaza el listado sin sesión', async ({ client }) => {
    const response = await client.get('/api/v1/users')
    response.assertStatus(401)
  })

  test('un usuario de consulta no administra usuarios ni roles', async ({ client }) => {
    const roles = await ensureRoles()
    await createAccount('consulta@huellacarbono.test', roles.get('USUARIO_CONSULTA')!.id)
    const token = await login(client, 'consulta@huellacarbono.test')

    const users = await client.get('/api/v1/users').bearerToken(token)
    users.assertStatus(403)

    const created = await client.post('/api/v1/roles').bearerToken(token).json({
      name: 'AUDITOR',
    })
    created.assertStatus(403)
  })

  test('el administrador crea un usuario, le cambia el rol y lo desactiva', async ({
    client,
    assert,
  }) => {
    const roles = await ensureRoles()
    await createAccount('admin.prueba@huellacarbono.test', roles.get('ADMINISTRADOR')!.id)
    const token = await login(client, 'admin.prueba@huellacarbono.test')

    const created = await client
      .post('/api/v1/users')
      .bearerToken(token)
      .json({
        nombres: 'Lucia',
        apellidos: 'Ramirez',
        email: 'lucia.ramirez@huellacarbono.test',
        password: PASSWORD,
        passwordConfirmation: PASSWORD,
        roleIds: [roles.get('USUARIO_CONSULTA')!.id],
      })
    created.assertStatus(200)

    const user = payload<{
      id: number
      email: string
      active: boolean
      roles: { name: string }[]
      permissions: string[]
    }>(created)
    assert.equal(user.email, 'lucia.ramirez@huellacarbono.test')
    assert.equal(user.active, true)
    assert.deepEqual(
      user.roles.map((role) => role.name),
      ['USUARIO_CONSULTA']
    )
    assert.deepEqual(user.permissions, [])

    const synced = await client
      .put(`/api/v1/users/${user.id}/roles`)
      .bearerToken(token)
      .json({ roleIds: [roles.get('ANALISTA_AMBIENTAL')!.id] })
    synced.assertStatus(200)
    assert.deepEqual(
      payload<{ roles: { name: string }[] }>(synced).roles.map((role) => role.name),
      ['ANALISTA_AMBIENTAL']
    )

    const disabled = await client
      .patch(`/api/v1/users/${user.id}`)
      .bearerToken(token)
      .json({ active: false })
    disabled.assertStatus(200)
    assert.equal(payload<{ active: boolean }>(disabled).active, false)

    const again = await client
      .patch(`/api/v1/users/${user.id}`)
      .bearerToken(token)
      .json({ active: false })
    again.assertStatus(409)

    const loginDisabled = await client.post('/api/v1/auth/login').json({
      email: 'lucia.ramirez@huellacarbono.test',
      password: PASSWORD,
    })
    loginDisabled.assertStatus(403)
  })

  test('rechaza correo duplicado y desactivar la propia cuenta', async ({ client }) => {
    const roles = await ensureRoles()
    const admin = await createAccount(
      'admin.propio@huellacarbono.test',
      roles.get('ADMINISTRADOR')!.id
    )
    const token = await login(client, 'admin.propio@huellacarbono.test')

    const duplicate = await client
      .post('/api/v1/users')
      .bearerToken(token)
      .json({
        nombres: 'Otro',
        apellidos: 'Admin',
        email: 'admin.propio@huellacarbono.test',
        password: PASSWORD,
        passwordConfirmation: PASSWORD,
        roleIds: [roles.get('ADMINISTRADOR')!.id],
      })
    duplicate.assertStatus(422)

    const self = await client.patch(`/api/v1/users/${admin.id}`).bearerToken(token).json({
      active: false,
    })
    self.assertStatus(422)
  })

  test('protege el rol de sistema y deja crear un rol propio', async ({ client, assert }) => {
    const roles = await ensureRoles()
    await createAccount('admin.roles@huellacarbono.test', roles.get('ADMINISTRADOR')!.id)
    const token = await login(client, 'admin.roles@huellacarbono.test')

    const catalog = await client.get('/api/v1/permissions').bearerToken(token)
    catalog.assertStatus(200)
    const codes = payload<{ permissions: { code: string }[] }>(catalog).permissions.map(
      (item) => item.code
    )
    assert.include(codes, 'usuario.ver')
    assert.include(codes, 'rol.editar')

    const created = await client.post('/api/v1/roles').bearerToken(token).json({
      name: 'AUDITOR',
      description: 'Solo consulta interna',
    })
    created.assertStatus(200)
    const role = payload<{ system: boolean; permissions: string[] }>(created)
    assert.equal(role.system, false)
    assert.deepEqual(role.permissions, [])

    const renamed = await client
      .patch(`/api/v1/roles/${roles.get('ADMINISTRADOR')!.id}`)
      .bearerToken(token)
      .json({ name: 'SUPERADMIN' })
    renamed.assertStatus(422)
  })

  test('guarda permisos de un rol y conserva un administrador', async ({ client, assert }) => {
    const roles = await ensureRoles()
    await createAccount('admin.permisos@huellacarbono.test', roles.get('ADMINISTRADOR')!.id)
    const token = await login(client, 'admin.permisos@huellacarbono.test')

    const created = await client.post('/api/v1/roles').bearerToken(token).json({
      name: 'AUDITOR_PERMISOS',
    })
    created.assertStatus(200)
    const roleId = payload<{ id: number }>(created).id

    const granted = await client
      .put(`/api/v1/roles/${roleId}/permissions`)
      .bearerToken(token)
      .json({ codes: ['usuario.ver'] })
    granted.assertStatus(200)
    assert.deepEqual(payload<{ permissions: string[] }>(granted).permissions, ['usuario.ver'])

    const locked = await client
      .put(`/api/v1/roles/${roles.get('ADMINISTRADOR')!.id}/permissions`)
      .bearerToken(token)
      .json({ codes: [] })
    locked.assertStatus(409)

    const unknown = await client
      .put(`/api/v1/roles/${roleId}/permissions`)
      .bearerToken(token)
      .json({ codes: ['informe.ver'] })
    unknown.assertStatus(422)
  })
})
