import { test } from '@japa/runner'
import Usuario from '#models/usuario'
import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiClient } from '@japa/api-client'

const PASSWORD = 'Clave1234'

async function createAccount(email: string) {
  return Usuario.create({
    nombres: 'Prueba',
    apellidos: 'Municipio',
    email,
    password: PASSWORD,
    estado: true,
  })
}

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: PASSWORD })
  response.assertStatus(200)
  return (response.body() as { data: { token: string } }).data.token
}

type MunicipioListItem = {
  id: number
  name: string
  code: string
  active: boolean
  department: { id: number; name: string; code: string; active: boolean }
}

test.group('Municipios', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('rechaza el listado sin sesión', async ({ client }) => {
    const response = await client.get('/api/v1/municipios')
    response.assertStatus(401)
  })

  test('lista municipios paginados con su departamento', async ({ client, assert }) => {
    await createAccount('consulta.municipio@huellacarbono.test')
    const token = await login(client, 'consulta.municipio@huellacarbono.test')

    const response = await client
      .get('/api/v1/municipios')
      .bearerToken(token)
      .qs({ page: 1, perPage: 5 })
    response.assertStatus(200)

    const body = response.body() as { data: MunicipioListItem[]; metadata: { total: number } }
    assert.isArray(body.data)
    assert.lengthOf(body.data, 5)
    assert.isAtLeast(body.metadata.total, 5)
    assert.isNumber(body.data[0].id)
    assert.isString(body.data[0].name)
    assert.isString(body.data[0].code)
    assert.equal(body.data[0].active, true)
    assert.isNumber(body.data[0].department.id)
    assert.isString(body.data[0].department.name)
  })

  test('filtra municipios por departamento inexistente con 422', async ({ client }) => {
    await createAccount('filtro.municipio@huellacarbono.test')
    const token = await login(client, 'filtro.municipio@huellacarbono.test')

    const response = await client
      .get('/api/v1/municipios')
      .bearerToken(token)
      .qs({ idDepartamento: 999999 })
    response.assertStatus(422)
  })

  test('lista solo los municipios de un departamento', async ({ client, assert }) => {
    await createAccount('por.departamento@huellacarbono.test')
    const token = await login(client, 'por.departamento@huellacarbono.test')

    const unfiltered = await client.get('/api/v1/municipios').bearerToken(token).qs({ perPage: 1 })
    unfiltered.assertStatus(200)
    const departmentId = (unfiltered.body() as { data: MunicipioListItem[] }).data[0].department.id

    const response = await client
      .get('/api/v1/municipios')
      .bearerToken(token)
      .qs({ idDepartamento: departmentId, perPage: 100 })
    response.assertStatus(200)

    const body = response.body() as { data: MunicipioListItem[] }
    assert.isNotEmpty(body.data)
    for (const municipio of body.data) {
      assert.equal(municipio.department.id, departmentId)
      assert.isString(municipio.department.name)
    }
  })

  test('expone el catálogo de opciones filtrado por departamento', async ({ client, assert }) => {
    await createAccount('opciones.municipio@huellacarbono.test')
    const token = await login(client, 'opciones.municipio@huellacarbono.test')

    const all = await client.get('/api/v1/municipios/options').bearerToken(token)
    all.assertStatus(200)
    const municipios = (all.body() as { data: { municipios: { id: number; name: string }[] } }).data
      .municipios
    assert.isNotEmpty(municipios)
    assert.isNumber(municipios[0].id)
    assert.isString(municipios[0].name)

    const filtered = await client
      .get('/api/v1/municipios/options')
      .bearerToken(token)
      .qs({ idDepartamento: 999999 })
    filtered.assertStatus(422)
  })

  test('devuelve un municipio por id o 404', async ({ client, assert }) => {
    await createAccount('detalle.municipio@huellacarbono.test')
    const token = await login(client, 'detalle.municipio@huellacarbono.test')

    const missing = await client.get('/api/v1/municipios/999999').bearerToken(token)
    missing.assertStatus(404)

    const invalid = await client.get('/api/v1/municipios/abc').bearerToken(token)
    invalid.assertStatus(404)

    const first = await client
      .get('/api/v1/municipios')
      .bearerToken(token)
      .qs({ page: 1, perPage: 1 })
    first.assertStatus(200)
    const id = (first.body() as { data: { id: number }[] }).data[0].id

    const found = await client.get(`/api/v1/municipios/${id}`).bearerToken(token)
    found.assertStatus(200)
    const municipio = (found.body() as { data: MunicipioListItem }).data
    assert.equal(municipio.id, id)
    assert.isString(municipio.name)
    assert.isNumber(municipio.department.id)
  })
})
