import { test } from '@japa/runner'
import { PERMISSIONS, SYSTEM_ROLE_SEEDS } from '#data/permission_catalog'
import Actividad from '#models/actividad'
import Departamento from '#models/departamento'
import FuenteEmision from '#models/fuente_emision'
import Municipio from '#models/municipio'
import Organizacion from '#models/organizacion'
import Permiso from '#models/permiso'
import Proceso from '#models/proceso'
import Rol from '#models/rol'
import Sede from '#models/sede'
import UnidadMedida from '#models/unidad_medida'
import Usuario from '#models/usuario'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import type { ApiClient } from '@japa/api-client'

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
    apellidos: 'Catalogo',
    email,
    password: PASSWORD,
    estado: true,
  })
  await user.related('roles').attach([rol.id])

  const response = await client.post('/api/v1/auth/login').json({ email, password: PASSWORD })
  response.assertStatus(200)
  const cuerpo = response.body() as { data: { token: string } }
  return { token: cuerpo.data.token, usuario: user }
}

function datos<T>(response: { body: () => unknown }) {
  return (response.body() as { data: T }).data
}

async function cadenaOperativa(usuarioId: number) {
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
    nombre: `Depto catalogo ${codigo}`,
    estado: true,
  })
  const municipio = await Municipio.create({
    departamentoId: departamento.id,
    codigo: `${codigo}901`,
    nombre: `Municipio catalogo ${codigo}`,
    estado: true,
  })
  const organizacion = await Organizacion.create({
    municipioId: municipio.id,
    nombre: `Org catalogo ${codigo}`,
    nit: `8${codigo}01`,
    tipo: 'EMPRESA',
    estado: true,
  })
  const sede = await Sede.create({
    organizacionId: organizacion.id,
    nombre: 'Sede catalogo',
    codigo: 'CAT',
    estado: true,
  })
  const proceso = await Proceso.create({
    sedeId: sede.id,
    nombre: 'Proceso catalogo',
    estado: true,
  })
  const actividad = await Actividad.create({
    procesoId: proceso.id,
    nombre: 'Actividad catalogo',
    estado: true,
  })
  const unidad = await UnidadMedida.create({
    codigo: `M3${codigo}`,
    nombre: `Metro cubico ${codigo}`,
    simbolo: 'm³',
    magnitud: 'Volumen',
    factorBase: '1',
    estado: true,
  })
  const fuente = await FuenteEmision.create({
    codigo: `ELEC${codigo}`,
    nombre: `Electricidad ${codigo}`,
    categoria: 'Energía',
    estado: true,
  })
  const periodo = await db
    .table('periodo_medicion')
    .insert({
      id_organizacion: organizacion.id,
      nombre: `2024-${codigo}`,
      fecha_inicio: '2024-01-01',
      fecha_fin: '2024-12-31',
      estado: 'ABIERTO',
    })
    .returning('id_periodo')
  const periodoId = Number(
    typeof periodo[0] === 'object' ? periodo[0].id_periodo : periodo[0]
  )

  return { actividad, unidad, fuente, periodoId, usuarioId, codigo }
}

test.group('Catálogos paramétricos', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('rechaza el listado de tipos de agua sin sesión', async ({ client }) => {
    const response = await client.get('/api/v1/tipos-agua')
    response.assertStatus(401)
  })

  test('un rol sin permiso no consulta los catálogos', async ({ client }) => {
    const { token } = await prepararCuenta(client, 'consulta.catalogo@huellacarbono.test', 'USUARIO_CONSULTA')
    const response = await client.get('/api/v1/tipos-agua').bearerToken(token)
    response.assertStatus(403)
  })

  test('el tipo de agua se crea, no se duplica y no se apaga si tiene mediciones', async ({
    client,
    assert,
  }) => {
    const { token, usuario } = await prepararCuenta(
      client,
      'admin.catalogo@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const creado = await client.post('/api/v1/tipos-agua').bearerToken(token).json({
      codigo: 'acueducto',
      nombre: 'Agua de acueducto',
      descripcion: 'Agua potable de la red',
    })
    creado.assertStatus(200)
    const tipo = datos<{ id: number; codigo: string; active: boolean }>(creado)
    assert.equal(tipo.codigo, 'ACUEDUCTO')
    assert.isTrue(tipo.active)

    const repetido = await client.post('/api/v1/tipos-agua').bearerToken(token).json({
      codigo: 'ACUEDUCTO',
      nombre: 'Otro nombre de agua',
    })
    repetido.assertStatus(409)

    const nombre = await client.post('/api/v1/tipos-agua').bearerToken(token).json({
      codigo: 'POZO',
      nombre: 'agua de acueducto',
    })
    nombre.assertStatus(409)

    const cadena = await cadenaOperativa(usuario.id)
    await db.table('dato_hidrico').insert({
      id_actividad: cadena.actividad.id,
      id_periodo: cadena.periodoId,
      id_tipo_agua: tipo.id,
      id_unidad: cadena.unidad.id,
      id_usuario_registro: usuario.id,
      cantidad: 10,
      estado_registro: 'REGISTRADO',
    })

    const bloqueado = await client
      .patch(`/api/v1/tipos-agua/${tipo.id}`)
      .bearerToken(token)
      .json({ active: false })
    bloqueado.assertStatus(409)
  })

  test('componente hídrico y alcance de emisión aceptan un alta simple', async ({ client, assert }) => {
    const { token } = await prepararCuenta(client, 'admin.simple@huellacarbono.test', 'ADMINISTRADOR')

    const componente = await client.post('/api/v1/componentes-hidricos').bearerToken(token).json({
      codigo: 'azul',
      nombre: 'Agua azul',
      descripcion: 'Consumo de agua superficial o subterránea',
    })
    componente.assertStatus(200)
    assert.equal(datos<{ codigo: string }>(componente).codigo, 'AZUL')

    const alcance = await client.post('/api/v1/alcances-emision').bearerToken(token).json({
      codigo: 'alcance-2',
      nombre: 'Alcance 2',
      descripcion: 'Energía comprada',
    })
    alcance.assertStatus(200)
    assert.equal(datos<{ nombre: string }>(alcance).nombre, 'Alcance 2')
  })

  test('la metodología conserva versiones y no se apaga mientras estén activas', async ({
    client,
    assert,
  }) => {
    const { token } = await prepararCuenta(client, 'admin.metodo@huellacarbono.test', 'ADMINISTRADOR')
    const metodologia = await client.post('/api/v1/metodologias').bearerToken(token).json({
      codigo: 'iso-14046',
      nombre: 'ISO 14046',
      tipo: 'HIDRICA',
      entidadFuente: 'ISO',
    })
    metodologia.assertStatus(200)
    const creada = datos<{ id: number; tipo: string; versionesActivas: number }>(metodologia)
    assert.equal(creada.tipo, 'HIDRICA')
    assert.equal(creada.versionesActivas, 0)

    const invalida = await client
      .post(`/api/v1/metodologias/${creada.id}/versiones`)
      .bearerToken(token)
      .json({
        numeroVersion: '2014',
        fechaInicioVigencia: '2014-01-01',
        fechaFinVigencia: '2013-12-31',
      })
    invalida.assertStatus(422)

    const version = await client
      .post(`/api/v1/metodologias/${creada.id}/versiones`)
      .bearerToken(token)
      .json({
        numeroVersion: '2014',
        fechaInicioVigencia: '2014-01-01',
        descripcion: 'Edición vigente',
      })
    version.assertStatus(200)
    const creadaVersion = datos<{ fechaInicioVigencia: string; numeroVersion: string }>(version)
    assert.equal(creadaVersion.numeroVersion, '2014')
    assert.equal(creadaVersion.fechaInicioVigencia, '2014-01-01')

    const bloqueada = await client
      .patch(`/api/v1/metodologias/${creada.id}`)
      .bearerToken(token)
      .json({ active: false })
    bloqueada.assertStatus(409)
  })

  test('el factor y el parámetro quedan ligados a una versión vigente', async ({ client, assert }) => {
    const { token } = await prepararCuenta(client, 'admin.factor@huellacarbono.test', 'ADMINISTRADOR')
    const cadena = await cadenaOperativa(1)
    const metodologia = await client.post('/api/v1/metodologias').bearerToken(token).json({
      codigo: `fecoc-${cadena.codigo}`,
      nombre: `FECOC ${cadena.codigo}`,
      tipo: 'CARBONO',
    })
    const metodologiaId = datos<{ id: number }>(metodologia).id
    const version = await client
      .post(`/api/v1/metodologias/${metodologiaId}/versiones`)
      .bearerToken(token)
      .json({ numeroVersion: '2024', fechaInicioVigencia: '2024-01-01' })
    const versionId = datos<{ id: number }>(version).id

    const opciones = await client.get('/api/v1/factores-emision/opciones').bearerToken(token)
    opciones.assertStatus(200)
    const listas = datos<{ fuentes: { id: number }[]; unidades: { id: number }[] }>(opciones)
    assert.isAtLeast(listas.fuentes.length, 1)
    assert.isAtLeast(listas.unidades.length, 1)

    const factor = await client.post('/api/v1/factores-emision').bearerToken(token).json({
      versionId,
      fuenteEmisionId: cadena.fuente.id,
      unidadEntradaId: cadena.unidad.id,
      unidadSalidaId: cadena.unidad.id,
      codigo: 'fe-elec',
      nombre: 'Electricidad Colombia',
      valor: '0.126',
      fuente: 'UPME',
      region: 'Colombia',
      fechaInicioVigencia: '2024-01-01',
    })
    factor.assertStatus(200)
    const creado = datos<{ codigo: string; valor: string; fuenteEmisionNombre: string }>(factor)
    assert.equal(creado.codigo, 'FE-ELEC')
    assert.equal(creado.valor, '0.126')
    assert.include(creado.fuenteEmisionNombre, 'Electricidad')

    const repetido = await client.post('/api/v1/factores-emision').bearerToken(token).json({
      versionId,
      fuenteEmisionId: cadena.fuente.id,
      unidadEntradaId: cadena.unidad.id,
      unidadSalidaId: cadena.unidad.id,
      codigo: 'FE-ELEC',
      nombre: 'Otro factor',
      valor: '0.110',
      fechaInicioVigencia: '2024-01-01',
    })
    repetido.assertStatus(409)

    const parametro = await client.post('/api/v1/parametros-hidricos').bearerToken(token).json({
      versionId,
      unidadId: cadena.unidad.id,
      codigo: 'escasez-cauca',
      nombre: 'Factor de escasez del Cauca',
      valor: '1.25',
      fuente: 'IDEAM',
      fechaInicioVigencia: '2024-01-01',
    })
    parametro.assertStatus(200)
    assert.equal(datos<{ codigo: string; unidadSimbolo: string }>(parametro).codigo, 'ESCASEZ-CAUCA')
    assert.equal(datos<{ unidadSimbolo: string }>(parametro).unidadSimbolo, 'm³')
  })
})
