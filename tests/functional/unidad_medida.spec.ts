import { test } from '@japa/runner'
import { PERMISSIONS, SYSTEM_ROLE_SEEDS } from '#data/permission_catalog'
import Permiso from '#models/permiso'
import Rol from '#models/rol'
import Usuario from '#models/usuario'
import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiClient } from '@japa/api-client'

const PASSWORD = 'Clave1234'

type MeasurementUnit = {
  id: number
  code: string
  name: string
  symbol: string
  magnitude: string
  baseFactor: string
  active: boolean
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

async function createUnit(
  client: ApiClient,
  token: string,
  overrides: Record<string, unknown> = {}
) {
  return client
    .post('/api/v1/measurement-units')
    .bearerToken(token)
    .json({
      codigo: 'KG',
      nombre: 'Kilogramo',
      simbolo: 'kg',
      magnitud: 'Masa',
      factorBase: '1',
      ...overrides,
    })
}

test.group('Unidades de medida', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('rechaza el listado sin sesión', async ({ client }) => {
    const response = await client.get('/api/v1/measurement-units')
    response.assertStatus(401)
  })

  test('un usuario de consulta no administra unidades de medida', async ({ client }) => {
    const roles = await ensureAdmin()
    await createAccount('consulta.unidad@huellacarbono.test', roles.get('USUARIO_CONSULTA')!.id)
    const token = await login(client, 'consulta.unidad@huellacarbono.test')

    const listed = await client.get('/api/v1/measurement-units').bearerToken(token)
    listed.assertStatus(403)

    const created = await createUnit(client, token, { codigo: 'T', nombre: 'Tonelada' })
    created.assertStatus(403)
  })

  test('el administrador crea, consulta, lista y edita unidades de medida', async ({
    client,
    assert,
  }) => {
    const roles = await ensureAdmin()
    await createAccount('admin.unidad@huellacarbono.test', roles.get('ADMINISTRADOR')!.id)
    const token = await login(client, 'admin.unidad@huellacarbono.test')

    const created = await createUnit(client, token)
    created.assertStatus(200)
    const unit = payload<MeasurementUnit>(created)
    assert.equal(unit.code, 'KG')
    assert.equal(unit.name, 'Kilogramo')
    assert.equal(unit.symbol, 'kg')
    assert.equal(unit.magnitude, 'Masa')
    assert.equal(unit.baseFactor, '1.000000000000')
    assert.equal(unit.active, true)

    const duplicate = await createUnit(client, token, { nombre: 'Otro kilogramo' })
    duplicate.assertStatus(409)

    const shown = await client.get(`/api/v1/measurement-units/${unit.id}`).bearerToken(token)
    shown.assertStatus(200)
    assert.equal(payload<MeasurementUnit>(shown).code, 'KG')

    const missing = await client.get('/api/v1/measurement-units/99999999').bearerToken(token)
    missing.assertStatus(404)

    const invalidId = await client.get('/api/v1/measurement-units/abc').bearerToken(token)
    invalidId.assertStatus(404)

    const listed = await client.get('/api/v1/measurement-units').bearerToken(token)
    listed.assertStatus(200)
    assert.isTrue(
      payload<MeasurementUnit[]>(listed).some((item) => item.code === 'KG' && item.active)
    )

    const renamed = await client
      .patch(`/api/v1/measurement-units/${unit.id}`)
      .bearerToken(token)
      .json({ nombre: 'Kilogramo (kg)' })
    renamed.assertStatus(200)
    assert.equal(payload<MeasurementUnit>(renamed).name, 'Kilogramo (kg)')
    assert.equal(payload<MeasurementUnit>(renamed).code, 'KG')

    const other = await createUnit(client, token, {
      codigo: 'M',
      nombre: 'Metro',
      simbolo: 'm',
      magnitud: 'Longitud',
    })
    other.assertStatus(200)

    const duplicatedCode = await client
      .patch(`/api/v1/measurement-units/${unit.id}`)
      .bearerToken(token)
      .json({ codigo: 'M' })
    duplicatedCode.assertStatus(409)
  })

  test('desactiva sin borrar y reactiva una unidad de medida', async ({ client, assert }) => {
    const roles = await ensureAdmin()
    await createAccount('admin.desactiva@huellacarbono.test', roles.get('ADMINISTRADOR')!.id)
    const token = await login(client, 'admin.desactiva@huellacarbono.test')

    const created = await createUnit(client, token)
    created.assertStatus(200)
    const unit = payload<MeasurementUnit>(created)

    const disabled = await client.delete(`/api/v1/measurement-units/${unit.id}`).bearerToken(token)
    disabled.assertStatus(200)
    assert.equal(payload<MeasurementUnit>(disabled).active, false)

    const again = await client.delete(`/api/v1/measurement-units/${unit.id}`).bearerToken(token)
    again.assertStatus(409)

    const missing = await client.delete('/api/v1/measurement-units/99999999').bearerToken(token)
    missing.assertStatus(404)

    const shown = await client.get(`/api/v1/measurement-units/${unit.id}`).bearerToken(token)
    shown.assertStatus(200)
    assert.equal(payload<MeasurementUnit>(shown).active, false)

    const listed = await client.get('/api/v1/measurement-units').bearerToken(token)
    listed.assertStatus(200)
    assert.isFalse(payload<MeasurementUnit[]>(listed).some((item) => item.code === 'KG'))

    const listedAll = await client
      .get('/api/v1/measurement-units?includeInactive=true')
      .bearerToken(token)
    listedAll.assertStatus(200)
    assert.isTrue(
      payload<MeasurementUnit[]>(listedAll).some(
        (item) => item.code === 'KG' && item.active === false
      )
    )

    const reactivated = await client
      .patch(`/api/v1/measurement-units/${unit.id}`)
      .bearerToken(token)
      .json({ active: true })
    reactivated.assertStatus(200)
    assert.equal(payload<MeasurementUnit>(reactivated).active, true)
  })

  test('conserva la precisión de factorBase con más de 15 dígitos significativos', async ({
    client,
    assert,
  }) => {
    const roles = await ensureAdmin()
    await createAccount('admin.precision@huellacarbono.test', roles.get('ADMINISTRADOR')!.id)
    const token = await login(client, 'admin.precision@huellacarbono.test')

    // 24 dígitos significativos: Number sólo conserva 15, por lo que la
    // respuesta sería "123456789012.3457" si el valor hubiera pasado por Number.
    const completo = '123456789012.345678901234'
    const created = await createUnit(client, token, {
      codigo: 'PRECISION24',
      factorBase: completo,
    })
    created.assertStatus(200)
    const unit = payload<MeasurementUnit>(created)
    assert.equal(unit.baseFactor, completo)
    assert.notEqual(unit.baseFactor, String(Number(completo)))

    const shown = await client.get(`/api/v1/measurement-units/${unit.id}`).bearerToken(token)
    shown.assertStatus(200)
    assert.equal(payload<MeasurementUnit>(shown).baseFactor, completo)

    // 22 dígitos significativos: la conversión numérica truncaría los decimales.
    const largo = '1234567890.123456789012'
    const other = await createUnit(client, token, { codigo: 'PRECISION22', factorBase: largo })
    other.assertStatus(200)
    assert.equal(payload<MeasurementUnit>(other).baseFactor, largo)
    assert.notEqual(payload<MeasurementUnit>(other).baseFactor, String(Number(largo)))

    // el menor positivo representable con la escala del campo
    const minimo = '0.000000000001'
    const tiny = await createUnit(client, token, { codigo: 'MINIMO', factorBase: minimo })
    tiny.assertStatus(200)
    assert.equal(payload<MeasurementUnit>(tiny).baseFactor, minimo)

    // actualizar sin perder precisión
    const actualizado = '9876543210.098765432109'
    const patched = await client
      .patch(`/api/v1/measurement-units/${unit.id}`)
      .bearerToken(token)
      .json({ factorBase: actualizado })
    patched.assertStatus(200)
    assert.equal(payload<MeasurementUnit>(patched).baseFactor, actualizado)

    // un número JSON ya habría perdido precisión al parsearse: se rechaza
    const asNumber = await client
      .patch(`/api/v1/measurement-units/${unit.id}`)
      .bearerToken(token)
      .json({ factorBase: 123456789012.3456789 })
    asNumber.assertStatus(422)

    // límites del DECIMAL(24,12): ni 13 decimales ni 13 dígitos enteros caben
    const decimals = await createUnit(client, token, {
      codigo: 'DEC13',
      factorBase: '0.1234567890123',
    })
    decimals.assertStatus(422)

    const integers = await createUnit(client, token, {
      codigo: 'INT13',
      factorBase: '1234567890123.5',
    })
    integers.assertStatus(422)
  })

  test('valida campos, longitudes y factorBase de la unidad de medida', async ({
    client,
    assert,
  }) => {
    const roles = await ensureAdmin()
    await createAccount('admin.valida@huellacarbono.test', roles.get('ADMINISTRADOR')!.id)
    const token = await login(client, 'admin.valida@huellacarbono.test')

    const zero = await createUnit(client, token, { factorBase: '0' })
    zero.assertStatus(422)

    const negative = await createUnit(client, token, { factorBase: '-2' })
    negative.assertStatus(422)

    const notNumber = await createUnit(client, token, { factorBase: 'abc' })
    notNumber.assertStatus(422)

    /**
     * factorBase viaja como cadena: un número JSON ya habría perdido
     * precisión al parsearse como Number, por lo que se rechaza.
     */
    const numericJson = await createUnit(client, token, { factorBase: 1 })
    numericJson.assertStatus(422)

    const tooManyDecimals = await createUnit(client, token, {
      factorBase: '0.1234567890123',
    })
    tooManyDecimals.assertStatus(422)

    const tooManyIntegers = await createUnit(client, token, {
      factorBase: '1234567890123.5',
    })
    tooManyIntegers.assertStatus(422)

    const emptyName = await createUnit(client, token, { nombre: '' })
    emptyName.assertStatus(422)

    const longCode = await createUnit(client, token, { codigo: 'X'.repeat(31) })
    longCode.assertStatus(422)

    const created = await createUnit(client, token)
    created.assertStatus(200)
    const unit = payload<MeasurementUnit>(created)

    /**
     * El bodyparser global (convertEmptyStringsToNull + trimWhitespaces por
     * defecto) normaliza '' y ' ' a null, y Vine trata null como campo
     * ausente: el valor vacío nunca se almacena. En creación es campo
     * obligatorio, por lo que responde 422.
     */
    const emptySymbol = await client
      .patch(`/api/v1/measurement-units/${unit.id}`)
      .bearerToken(token)
      .json({ simbolo: '' })
    emptySymbol.assertStatus(200)
    assert.equal(payload<MeasurementUnit>(emptySymbol).symbol, 'kg')

    const spaceSymbol = await client
      .patch(`/api/v1/measurement-units/${unit.id}`)
      .bearerToken(token)
      .json({ simbolo: ' ' })
    spaceSymbol.assertStatus(200)
    assert.equal(payload<MeasurementUnit>(spaceSymbol).symbol, 'kg')

    const emptyOnCreate = await createUnit(client, token, { codigo: 'L', simbolo: ' ' })
    emptyOnCreate.assertStatus(422)

    const zeroFactor = await client
      .patch(`/api/v1/measurement-units/${unit.id}`)
      .bearerToken(token)
      .json({ factorBase: '0' })
    zeroFactor.assertStatus(422)

    const missing = await client
      .post('/api/v1/measurement-units')
      .bearerToken(token)
      .json({ codigo: 'L', nombre: 'Litro', magnitud: 'Volumen', factorBase: '1' })
    missing.assertStatus(422)
  })
})
