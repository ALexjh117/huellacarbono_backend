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
    if (!existing) await Permiso.create({ codigo: permission.code, nombre: permission.name })
  }

  for (const [nombre, codigos] of [
    ['ADMINISTRADOR', PERMISSIONS.map((permission) => permission.code)],
    [
      'ADMIN_CENTRO',
      PERMISSIONS.filter((permission) =>
        (permission.roles as readonly string[]).includes('ADMIN_CENTRO')
      ).map((permission) => permission.code),
    ],
    [
      'ANALISTA_AMBIENTAL',
      PERMISSIONS.filter((permission) =>
        (permission.roles as readonly string[]).includes('ANALISTA_AMBIENTAL')
      ).map((permission) => permission.code),
    ],
  ] as const) {
    const rol = roles.get(nombre)!
    const permisos = await Permiso.query().whereIn('codigo', codigos)
    await rol.load('permisos')
    const asignados = new Set(rol.permisos.map((permiso) => permiso.codigo))
    const faltantes = permisos.filter((permiso) => !asignados.has(permiso.codigo))
    if (faltantes.length) await rol.related('permisos').attach(faltantes.map((permiso) => permiso.id))
  }

  return roles
}

async function cuenta(email: string, roleId: number, centroId?: number) {
  const user = await Usuario.create({
    nombres: 'Prueba',
    apellidos: 'Usuario',
    email,
    password: PASSWORD,
    estado: true,
    centroId: centroId ?? null,
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
  return response.body().data.token as string
}

async function municipioLibre() {
  const usados = new Set((await Departamento.all()).map((item) => item.codigo))
  let codigo = '89'
  for (let indice = 0; indice < 100; indice += 1) {
    const candidato = String(indice).padStart(2, '0')
    if (!usados.has(candidato)) {
      codigo = candidato
      break
    }
  }
  const departamento = await Departamento.create({
    codigo,
    nombre: `Departamento ${codigo}`,
    estado: true,
  })
  return Municipio.create({
    departamentoId: departamento.id,
    codigo: `${codigo}001`,
    nombre: `Municipio ${codigo}`,
    estado: true,
  })
}

test.group('Centros, propiedad y periodos', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('el administrador del centro crea profesionales y cada uno ve solo sus organizaciones', async ({
    client,
    assert,
  }) => {
    const roles = await prepararRoles()
    await cuenta('general.centro@huellacarbono.test', roles.get('ADMINISTRADOR')!.id)
    const general = await login(client, 'general.centro@huellacarbono.test')
    const marca = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`

    const regional = await client.post('/api/v1/regionales').bearerToken(general).json({
      codigo: `R${marca}`.slice(0, 10),
      nombre: `Regional ${marca}`,
    })
    regional.assertStatus(200)
    const regionalId = datos<{ id: number }>(regional).id

    const centro = await client.post('/api/v1/centros').bearerToken(general).json({
      regionalId,
      codigo: `C${marca}`,
      nombre: `Centro ${marca}`,
    })
    centro.assertStatus(200)
    const centroId = datos<{ id: number }>(centro).id

    const adminCentro = await client.post('/api/v1/users').bearerToken(general).json({
      nombres: 'Ana',
      apellidos: 'Centro',
      email: `ana.centro.${marca}@huellacarbono.test`,
      password: PASSWORD,
      passwordConfirmation: PASSWORD,
      roleIds: [roles.get('ADMIN_CENTRO')!.id],
      centroId,
    })
    adminCentro.assertStatus(200)
    assert.equal(datos<{ centro: { id: number } }>(adminCentro).centro.id, centroId)

    const tokenCentro = await login(client, `ana.centro.${marca}@huellacarbono.test`)
    const analista = await client.post('/api/v1/users').bearerToken(tokenCentro).json({
      nombres: 'Juan',
      apellidos: 'Analista',
      email: `juan.${marca}@huellacarbono.test`,
      password: PASSWORD,
      passwordConfirmation: PASSWORD,
      roleIds: [roles.get('ANALISTA_AMBIENTAL')!.id],
    })
    analista.assertStatus(200)
    assert.equal(datos<{ centro: { id: number } }>(analista).centro.id, centroId)

    const otro = await client.post('/api/v1/users').bearerToken(tokenCentro).json({
      nombres: 'Pedro',
      apellidos: 'Analista',
      email: `pedro.${marca}@huellacarbono.test`,
      password: PASSWORD,
      passwordConfirmation: PASSWORD,
      roleIds: [roles.get('ANALISTA_AMBIENTAL')!.id],
    })
    otro.assertStatus(200)

    const perfilProhibido = await client.post('/api/v1/users').bearerToken(tokenCentro).json({
      nombres: 'Ilegal',
      apellidos: 'Admin',
      email: `ilegal.${marca}@huellacarbono.test`,
      password: PASSWORD,
      passwordConfirmation: PASSWORD,
      roleIds: [roles.get('ADMINISTRADOR')!.id],
    })
    perfilProhibido.assertStatus(403)

    const municipio = await municipioLibre()
    const tokenJuan = await login(client, `juan.${marca}@huellacarbono.test`)
    const creada = await client.post('/api/v1/organizaciones').bearerToken(tokenJuan).json({
      municipioId: municipio.id,
      nombre: `Éxito ${marca}`,
      nit: `900${marca}`.slice(0, 20),
      tipo: 'EMPRESA',
    })
    creada.assertStatus(200)
    const organizacionId = datos<{ id: number }>(creada).id

    const periodo = await client
      .post(`/api/v1/organizaciones/${organizacionId}/periodos`)
      .bearerToken(tokenJuan)
      .json({
        nombre: 'Año 2026',
        fechaInicio: '2026-01-01',
        fechaFin: '2026-12-31',
      })
    periodo.assertStatus(200)
    const periodoId = datos<{ id: number; estado: string }>(periodo).id
    assert.equal(datos<{ estado: string }>(periodo).estado, 'ABIERTO')

    const editado = await client.patch(`/api/v1/periodos/${periodoId}`).bearerToken(tokenJuan).json({
      nombre: 'Año gravable 2026',
      fechaInicio: '2026-01-01',
      fechaFin: '2026-06-30',
    })
    editado.assertStatus(200)
    assert.equal(datos<{ nombre: string }>(editado).nombre, 'Año gravable 2026')

    const cruce = await client
      .post(`/api/v1/organizaciones/${organizacionId}/periodos`)
      .bearerToken(tokenJuan)
      .json({
        nombre: 'Semestre cruzado',
        fechaInicio: '2026-06-01',
        fechaFin: '2026-12-31',
      })
    cruce.assertStatus(409)

    const tokenPedro = await login(client, `pedro.${marca}@huellacarbono.test`)
    const ajena = await client.get(`/api/v1/organizaciones/${organizacionId}`).bearerToken(tokenPedro)
    ajena.assertStatus(404)

    const listado = await client.get('/api/v1/organizaciones').bearerToken(tokenPedro)
    listado.assertStatus(200)
    const ids = datos<{ id: number }[]>(listado).map((item) => item.id)
    assert.notInclude(ids, organizacionId)

    const propia = await client.post('/api/v1/organizaciones').bearerToken(tokenPedro).json({
      municipioId: municipio.id,
      nombre: `Éxito ${marca}`,
      nit: `901${marca}`.slice(0, 20),
      tipo: 'EMPRESA',
    })
    propia.assertStatus(200)
    const propiaId = datos<{ id: number }>(propia).id
    assert.notEqual(propiaId, organizacionId)

    const periodoPropio = await client
      .post(`/api/v1/organizaciones/${propiaId}/periodos`)
      .bearerToken(tokenPedro)
      .json({
        nombre: 'Año 2026',
        fechaInicio: '2026-03-01',
        fechaFin: '2026-03-31',
      })
    periodoPropio.assertStatus(200)
  })
})
