import { test } from '@japa/runner'
import { PERMISSIONS, SYSTEM_ROLE_SEEDS } from '#data/permission_catalog'
import {
  ACTIVIDADES_EMISION,
  FUENTES_EMISION_DOCUMENTALES,
} from '#data/catalogo_actividades_emision'
import FactorEmision from '#models/factor_emision'
import FuenteEmision from '#models/fuente_emision'
import ImportacionFactor from '#models/importacion_factor'
import Metodologia from '#models/metodologia'
import MetodologiaVersion from '#models/metodologia_version'
import Permiso from '#models/permiso'
import Rol from '#models/rol'
import UnidadMedida from '#models/unidad_medida'
import Usuario from '#models/usuario'
import UnidadMedidaCatalogoService from '#services/unidad_medida_catalogo_service'
import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'

/**
 * Todos los valores de factores de este archivo son sintéticos: prueban el
 * flujo de carga y no son datos oficiales.
 */
const PASSWORD = 'Clave1234'
const FUENTE_SINTETICA = 'Documento sintético de prueba; no usar como dato oficial'

type FilaRespuesta = {
  fila: number
  accion: 'INSERTAR' | 'DUPLICADO' | 'RECHAZADO'
  mensaje: string | null
  factorEmisionId: number | null
}
type ImportacionRespuesta = {
  id: number
  estado: string
  versionId: number
  totalFilas: number
  porInsertar: number
  insertados: number
  duplicados: number
  rechazados: number
  filas: FilaRespuesta[]
}

async function prepararCuenta(client: ApiClient, email: string, rolNombre: string) {
  const roles = new Map<string, Rol>()
  for (const seed of SYSTEM_ROLE_SEEDS) {
    const existing = await Rol.findBy('nombre', seed.nombre)
    roles.set(seed.nombre, existing ?? (await Rol.create({ ...seed, estado: true })))
  }
  for (const permission of PERMISSIONS) {
    await Permiso.updateOrCreate({ codigo: permission.code }, { nombre: permission.name })
  }
  const rol = roles.get(rolNombre)!
  const codigos = PERMISSIONS.filter((permission) =>
    (permission.roles as readonly string[]).includes(rolNombre)
  ).map((permission) => permission.code)
  if (codigos.length) {
    await rol.load('permisos')
    const asignados = new Set(rol.permisos.map((permiso) => permiso.codigo))
    const faltantes = await Permiso.query().whereIn(
      'codigo',
      codigos.filter((codigo) => !asignados.has(codigo))
    )
    if (faltantes.length) await rol.related('permisos').attach(faltantes.map((p) => p.id))
  }
  const usuario = await Usuario.create({
    nombres: 'Prueba',
    apellidos: 'Importacion',
    email,
    password: PASSWORD,
    estado: true,
  })
  await usuario.related('roles').attach([rol.id])
  const response = await client.post('/api/v1/auth/login').json({ email, password: PASSWORD })
  response.assertStatus(200)
  return (response.body() as { data: { token: string } }).data.token
}

async function version(sufijo: string) {
  await new UnidadMedidaCatalogoService().sincronizar({ aplicar: true })
  const metodologia = await Metodologia.create({
    codigo: `IMP-${sufijo}`,
    nombre: `Metodología sintética ${sufijo}`,
    tipo: 'CARBONO',
    estado: true,
  })
  return MetodologiaVersion.create({
    metodologiaId: metodologia.id,
    numeroVersion: '2026',
    fechaInicioVigencia: DateTime.fromISO('2026-01-01'),
    estado: true,
  })
}

const fila = (cambios: Record<string, unknown> = {}) => ({
  codigo: 'IMP-GAS-01',
  nombre: 'Gas natural en calderas (sintético)',
  fuenteEmisionCodigo: 'A1-01',
  unidadEntradaCodigo: 'UM-M3',
  unidadSalidaCodigo: 'UM-KG',
  valor: '1.5',
  gas: 'CO2E',
  fuente: FUENTE_SINTETICA,
  institucionResponsable: 'Fixture de pruebas',
  anioPublicacion: 2026,
  anioAplicacion: 2026,
  fechaInicioVigencia: '2026-01-01',
  ...cambios,
})

async function unidadId(codigo: string) {
  const unidad = await UnidadMedida.findByOrFail('codigo', codigo)
  return unidad.id
}

async function fuenteId(codigo: string) {
  const fuente = await FuenteEmision.findByOrFail('codigo', codigo)
  return fuente.id
}

function datos(response: { body(): unknown }) {
  return (response.body() as { data: ImportacionRespuesta }).data
}

test.group('Importación trazable de factores de emisión', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('exige sesión y permiso para importar', async ({ client }) => {
    const sinSesion = await client.post('/api/v1/factores-emision/importaciones').json({})
    sinSesion.assertStatus(401)

    const token = await prepararCuenta(
      client,
      'consulta.importacion@huellacarbono.test',
      'USUARIO_CONSULTA'
    )
    const sinPermiso = await client
      .post('/api/v1/factores-emision/importaciones')
      .bearerToken(token)
      .json({ versionId: 1, origen: 'X', referencia: 'X', filas: [fila()] })
    sinPermiso.assertStatus(403)
  })

  test('previsualiza fila por fila sin crear factores', async ({ client, assert }) => {
    const token = await prepararCuenta(
      client,
      'admin.importacion.previa@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const v = await version('PREVIA')
    // Factor ya existente: la fila 6 lo duplica y no debe sobrescribirlo.
    const fuenteLuz = await FuenteEmision.findByOrFail('codigo', 'B1-02')
    const existente = await FactorEmision.create({
      versionId: v.id,
      fuenteEmisionId: fuenteLuz.id,
      unidadEntradaId: await unidadId('UM-KWH'),
      unidadSalidaId: await unidadId('UM-KG'),
      codigo: 'EXISTENTE-B1-02',
      nombre: 'Existente',
      valor: '0.3',
      gas: 'CO2E',
      estadoAprobacion: 'PENDIENTE',
      fechaInicioVigencia: DateTime.fromISO('2026-01-01'),
      anioAplicacion: 2026,
      estado: true,
    })

    const response = await client
      .post('/api/v1/factores-emision/importaciones')
      .bearerToken(token)
      .json({
        versionId: v.id,
        origen: 'FIXTURE',
        referencia: 'Archivo sintético de prueba',
        archivo: 'factores_sinteticos.csv',
        filas: [
          fila(),
          fila({
            codigo: 'IMP-LUZ-01',
            nombre: 'Electricidad SIN (sintético)',
            fuenteEmisionCodigo: 'B1-01',
            unidadEntradaCodigo: 'UM-KWH',
            valor: '0.2',
          }),
          fila({ codigo: 'IMP-SIN-FUENTE', fuente: undefined }),
          fila({ codigo: 'IMP-NO-EXISTE', fuenteEmisionCodigo: 'Z9-99' }),
          fila({ codigo: 'IMP-GAS-02', fechaInicioVigencia: '2026-02-01' }),
          fila({
            codigo: 'IMP-LUZ-02',
            fuenteEmisionCodigo: 'B1-02',
            unidadEntradaCodigo: 'UM-KWH',
          }),
          fila({
            codigo: 'IMP-LUZ-KG',
            fuenteEmisionCodigo: 'B1-03',
            unidadEntradaCodigo: 'UM-KG',
          }),
        ],
      })
    response.assertStatus(200)
    const importacion = datos(response)
    assert.equal(importacion.estado, 'PREVISUALIZADA')
    assert.equal(importacion.versionId, v.id)
    assert.equal(importacion.totalFilas, 7)
    assert.equal(importacion.porInsertar, 2)
    assert.equal(importacion.duplicados, 2)
    assert.equal(importacion.rechazados, 3)
    const accion = (numero: number) => importacion.filas.find((f) => f.fila === numero)!
    assert.equal(accion(1).accion, 'INSERTAR')
    assert.equal(accion(2).accion, 'INSERTAR')
    assert.equal(accion(3).accion, 'RECHAZADO')
    assert.match(accion(3).mensaje!, /fuente/)
    assert.equal(accion(4).accion, 'RECHAZADO')
    assert.match(accion(4).mensaje!, /No existe en el catálogo: la fuente Z9-99/)
    assert.equal(accion(5).accion, 'DUPLICADO')
    assert.match(accion(5).mensaje!, /Duplica la fila 1/)
    assert.equal(accion(6).accion, 'DUPLICADO')
    assert.match(accion(6).mensaje!, /vigencia superpuesta/)
    assert.equal(accion(7).accion, 'RECHAZADO')
    assert.match(accion(7).mensaje!, /no es compatible con la metodología/)

    // La previsualización no crea factores ni toca el existente.
    const factores = await FactorEmision.query().where('versionId', v.id)
    assert.lengthOf(factores, 1)
    await existente.refresh()
    assert.equal(existente.valor, '0.300000000000')

    const repetida = await client
      .post('/api/v1/factores-emision/importaciones')
      .bearerToken(token)
      .json({
        versionId: v.id,
        origen: 'FIXTURE',
        referencia: 'Otra referencia, mismo contenido',
        filas: [
          fila(),
          fila({
            codigo: 'IMP-LUZ-01',
            nombre: 'Electricidad SIN (sintético)',
            fuenteEmisionCodigo: 'B1-01',
            unidadEntradaCodigo: 'UM-KWH',
            valor: '0.2',
          }),
          fila({ codigo: 'IMP-SIN-FUENTE', fuente: undefined }),
          fila({ codigo: 'IMP-NO-EXISTE', fuenteEmisionCodigo: 'Z9-99' }),
          fila({ codigo: 'IMP-GAS-02', fechaInicioVigencia: '2026-02-01' }),
          fila({
            codigo: 'IMP-LUZ-02',
            fuenteEmisionCodigo: 'B1-02',
            unidadEntradaCodigo: 'UM-KWH',
          }),
          fila({
            codigo: 'IMP-LUZ-KG',
            fuenteEmisionCodigo: 'B1-03',
            unidadEntradaCodigo: 'UM-KG',
          }),
        ],
      })
    repetida.assertStatus(409)
  })

  test('aplica sólo las filas válidas, en PENDIENTE y con trazabilidad', async ({
    client,
    assert,
  }) => {
    const token = await prepararCuenta(
      client,
      'admin.importacion.aplica@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const v = await version('APLICA')
    const previa = await client
      .post('/api/v1/factores-emision/importaciones')
      .bearerToken(token)
      .json({
        versionId: v.id,
        origen: 'FIXTURE',
        referencia: 'Archivo sintético de prueba',
        filas: [fila(), fila({ codigo: 'IMP-MAL', valor: 'abc' })],
      })
    previa.assertStatus(200)
    const id = datos(previa).id

    const aplicada = await client
      .post(`/api/v1/factores-emision/importaciones/${id}/aplicar`)
      .bearerToken(token)
    aplicada.assertStatus(200)
    const resultado = datos(aplicada)
    assert.equal(resultado.estado, 'PARCIAL')
    assert.equal(resultado.insertados, 1)
    const filaAplicada = resultado.filas.find((f) => f.fila === 1)!
    assert.isNotNull(filaAplicada.factorEmisionId)
    assert.isNull(resultado.filas.find((f) => f.fila === 2)!.factorEmisionId)

    const factor = await FactorEmision.findOrFail(filaAplicada.factorEmisionId)
    assert.equal(factor.estadoAprobacion, 'PENDIENTE')
    assert.equal(factor.importacionId, id)
    assert.equal(factor.origen, 'FIXTURE')
    assert.equal(factor.fuente, FUENTE_SINTETICA)
    assert.equal(factor.institucionResponsable, 'Fixture de pruebas')
    assert.equal(factor.anioPublicacion, 2026)
    assert.equal(factor.anioAplicacion, 2026)
    assert.equal(factor.valor, '1.500000000000')

    const otraVez = await client
      .post(`/api/v1/factores-emision/importaciones/${id}/aplicar`)
      .bearerToken(token)
    otraVez.assertStatus(409)

    const consultada = await client
      .get(`/api/v1/factores-emision/importaciones/${id}`)
      .bearerToken(token)
    consultada.assertStatus(200)
    assert.equal(datos(consultada).estado, 'PARCIAL')

    const lista = await client
      .get(`/api/v1/factores-emision/importaciones?versionId=${v.id}`)
      .bearerToken(token)
    lista.assertStatus(200)
    const importaciones = (lista.body() as { data: ImportacionRespuesta[] }).data
    assert.deepEqual(
      importaciones.map((item) => item.id),
      [id]
    )
  })

  test('no aplica nada si una fila dejó de ser válida tras la previsualización', async ({
    client,
    assert,
  }) => {
    const token = await prepararCuenta(
      client,
      'admin.importacion.revalida@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const v = await version('REVALIDA')
    const previa = await client
      .post('/api/v1/factores-emision/importaciones')
      .bearerToken(token)
      .json({
        versionId: v.id,
        origen: 'FIXTURE',
        referencia: 'Archivo sintético de prueba',
        filas: [
          fila(),
          fila({
            codigo: 'IMP-LUZ-01',
            fuenteEmisionCodigo: 'B1-01',
            unidadEntradaCodigo: 'UM-KWH',
          }),
        ],
      })
    previa.assertStatus(200)
    const id = datos(previa).id
    assert.equal(datos(previa).porInsertar, 2)

    // Entre la previsualización y la aplicación alguien crea un factor equivalente.
    const manual = await client
      .post('/api/v1/factores-emision')
      .bearerToken(token)
      .json({
        versionId: v.id,
        fuenteEmisionId: await fuenteId('B1-01'),
        unidadEntradaId: await unidadId('UM-KWH'),
        unidadSalidaId: await unidadId('UM-KG'),
        codigo: 'MANUAL-LUZ',
        nombre: 'Manual',
        valor: '0.1',
        anioAplicacion: 2026,
        fechaInicioVigencia: '2026-01-01',
      })
    manual.assertStatus(200)

    const aplicada = await client
      .post(`/api/v1/factores-emision/importaciones/${id}/aplicar`)
      .bearerToken(token)
    aplicada.assertStatus(409)
    assert.match(JSON.stringify(aplicada.body()), /No se aplicó nada/)

    const factores = await FactorEmision.query().where('versionId', v.id)
    assert.deepEqual(
      factores.map((factor) => factor.codigo),
      ['MANUAL-LUZ']
    )
    const importacion = await ImportacionFactor.findOrFail(id)
    assert.equal(importacion.estado, 'PREVISUALIZADA')
  })

  test('una importación rechazada no se puede aplicar', async ({ client, assert }) => {
    const token = await prepararCuenta(
      client,
      'admin.importacion.rechaza@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const v = await version('RECHAZA')
    const previa = await client
      .post('/api/v1/factores-emision/importaciones')
      .bearerToken(token)
      .json({
        versionId: v.id,
        origen: 'FIXTURE',
        referencia: 'Archivo sintético de prueba',
        filas: [fila()],
      })
    const id = datos(previa).id

    const rechazada = await client
      .post(`/api/v1/factores-emision/importaciones/${id}/rechazar`)
      .bearerToken(token)
    rechazada.assertStatus(200)
    assert.equal(datos(rechazada).estado, 'RECHAZADA')

    const aplicada = await client
      .post(`/api/v1/factores-emision/importaciones/${id}/aplicar`)
      .bearerToken(token)
    aplicada.assertStatus(409)
    assert.lengthOf(await FactorEmision.query().where('versionId', v.id), 0)

    const inexistente = await client
      .get('/api/v1/factores-emision/importaciones/99999999')
      .bearerToken(token)
    inexistente.assertStatus(404)
  })

  test('valida el envoltorio de la importación', async ({ client }) => {
    const token = await prepararCuenta(
      client,
      'admin.importacion.valida@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const sinFilas = await client
      .post('/api/v1/factores-emision/importaciones')
      .bearerToken(token)
      .json({ versionId: 1, origen: 'FIXTURE', referencia: 'Referencia', filas: [] })
    sinFilas.assertStatus(422)

    const sinReferencia = await client
      .post('/api/v1/factores-emision/importaciones')
      .bearerToken(token)
      .json({ versionId: 1, origen: 'FIXTURE', filas: [fila()] })
    sinReferencia.assertStatus(422)
  })
})

test.group('Cobertura de factores por versión', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('clasifica cada fuente según sus factores en la versión', async ({ client, assert }) => {
    const token = await prepararCuenta(
      client,
      'admin.cobertura@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const v = await version('COBERTURA')
    const kg = await UnidadMedida.findByOrFail('codigo', 'UM-KG')
    const crear = async (codigoFuente: string, unidad: string, estadoAprobacion: string) =>
      FactorEmision.create({
        versionId: v.id,
        fuenteEmisionId: await fuenteId(codigoFuente),
        unidadEntradaId: await unidadId(unidad),
        unidadSalidaId: kg.id,
        codigo: `COB-${codigoFuente}`,
        nombre: `Cobertura ${codigoFuente}`,
        valor: '1',
        gas: 'CO2E',
        estadoAprobacion: estadoAprobacion as 'APROBADO' | 'PENDIENTE',
        fuente: FUENTE_SINTETICA,
        institucionResponsable: 'Fixture de pruebas',
        anioPublicacion: 2026,
        anioAplicacion: DateTime.utc().year,
        fechaInicioVigencia: DateTime.utc().startOf('year'),
        estado: true,
      })
    await crear('A1-01', 'UM-M3', 'APROBADO')
    await crear('B1-01', 'UM-KWH', 'PENDIENTE')

    const response = await client
      .get(`/api/v1/factores-emision/cobertura?versionId=${v.id}`)
      .bearerToken(token)
    response.assertStatus(200)
    const cobertura = (
      response.body() as {
        data: {
          totalFuentes: number
          porAlcance: { total: number; CON_FACTOR_APROBADO: number }[]
          fuentes: { fuenteCodigo: string; estado: string }[]
        }
      }
    ).data
    const estado = (codigo: string) =>
      cobertura.fuentes.find((fuente) => fuente.fuenteCodigo === codigo)?.estado
    assert.equal(estado('A1-01'), 'CON_FACTOR_APROBADO')
    assert.equal(estado('B1-01'), 'SOLO_PENDIENTES')
    assert.equal(estado('C1-01'), 'SIN_FACTOR')
    assert.isAtLeast(cobertura.totalFuentes, 191)
    assert.equal(
      cobertura.porAlcance.reduce((suma, grupo) => suma + grupo.total, 0),
      cobertura.totalFuentes
    )
    assert.equal(
      cobertura.porAlcance.reduce((suma, grupo) => suma + grupo.CON_FACTOR_APROBADO, 0),
      1
    )

    const inexistente = await client
      .get('/api/v1/factores-emision/cobertura?versionId=99999999')
      .bearerToken(token)
    inexistente.assertStatus(404)
  })
})

test.group('Importación: atomicidad e integridad', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const previsualizar = (client: ApiClient, token: string, cuerpo: Record<string, unknown>) =>
    client.post('/api/v1/factores-emision/importaciones').bearerToken(token).json(cuerpo)

  test('PARCIAL: las filas descartadas en la previsualización no generan factores', async ({
    client,
    assert,
  }) => {
    const token = await prepararCuenta(
      client,
      'admin.integridad.parcial@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const v = await version('PARCIAL')
    const previa = await previsualizar(client, token, {
      versionId: v.id,
      origen: 'FIXTURE',
      referencia: 'Archivo sintético de prueba',
      filas: [
        fila(),
        fila({ codigo: 'IMP-DUP', fechaInicioVigencia: '2026-03-01' }),
        fila({ codigo: 'IMP-SIN-INSTITUCION', institucionResponsable: undefined }),
      ],
    })
    previa.assertStatus(200)
    const importacion = datos(previa)
    assert.equal(importacion.porInsertar, 1)
    assert.equal(importacion.duplicados, 1)
    assert.equal(importacion.rechazados, 1)

    const aplicada = await client
      .post(`/api/v1/factores-emision/importaciones/${importacion.id}/aplicar`)
      .bearerToken(token)
    aplicada.assertStatus(200)
    assert.equal(datos(aplicada).estado, 'PARCIAL')
    assert.equal(datos(aplicada).insertados, 1)

    const factores = await FactorEmision.query().where('versionId', v.id)
    assert.deepEqual(
      factores.map((factor) => factor.codigo),
      ['IMP-GAS-01']
    )
  })

  test('fallo durante la aplicación: no queda ningún factor de esa operación', async ({
    client,
    assert,
  }) => {
    const token = await prepararCuenta(
      client,
      'admin.integridad.atomica@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const v = await version('ATOMICA')
    const previa = await previsualizar(client, token, {
      versionId: v.id,
      origen: 'FIXTURE',
      referencia: 'Archivo sintético de prueba',
      filas: [
        fila(),
        fila({ codigo: 'IMP-LUZ-01', fuenteEmisionCodigo: 'B1-01', unidadEntradaCodigo: 'UM-KWH' }),
        fila({ codigo: 'IMP-ACPM-01', fuenteEmisionCodigo: 'A1-06', unidadEntradaCodigo: 'UM-L' }),
      ],
    })
    previa.assertStatus(200)
    const id = datos(previa).id
    assert.equal(datos(previa).porInsertar, 3)

    // Simula un fallo de base de datos en la segunda inserción, después de que
    // la primera ya se escribió dentro de la transacción.
    const createReal = FactorEmision.create
    const crearOriginal = createReal.bind(FactorEmision)
    let llamadas = 0
    FactorEmision.create = (async (...argumentos: Parameters<typeof crearOriginal>) => {
      llamadas += 1
      if (llamadas === 2) {
        throw Object.assign(new Error('fallo simulado de inserción'), { code: '23505' })
      }
      return crearOriginal(...argumentos)
    }) as unknown as typeof FactorEmision.create
    let aplicada
    try {
      aplicada = await client
        .post(`/api/v1/factores-emision/importaciones/${id}/aplicar`)
        .bearerToken(token)
    } finally {
      FactorEmision.create = createReal
    }
    aplicada.assertStatus(409)
    assert.equal(llamadas, 2)

    // La primera inserción se revirtió con el resto de la operación.
    assert.lengthOf(await FactorEmision.query().where('versionId', v.id), 0)
    const importacion = await ImportacionFactor.query()
      .where('id', id)
      .preload('detalles')
      .firstOrFail()
    assert.equal(importacion.estado, 'PREVISUALIZADA')
    assert.equal(importacion.insertados, 0)
    assert.isTrue(importacion.detalles.every((detalle) => detalle.factorEmisionId === null))

    // Corregida la causa, la misma importación se puede aplicar completa.
    const reintento = await client
      .post(`/api/v1/factores-emision/importaciones/${id}/aplicar`)
      .bearerToken(token)
    reintento.assertStatus(200)
    assert.equal(datos(reintento).estado, 'APLICADA')
    assert.lengthOf(await FactorEmision.query().where('versionId', v.id), 3)
  })

  test('el hash impide repetir un contenido aplicado o rechazado', async ({ client, assert }) => {
    const token = await prepararCuenta(
      client,
      'admin.integridad.hash@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const v = await version('HASH')
    const cuerpo = (referencia: string, filas: Record<string, unknown>[]) => ({
      versionId: v.id,
      origen: 'FIXTURE',
      referencia,
      filas,
    })

    const aplicada = await previsualizar(client, token, cuerpo('Primera', [fila()]))
    aplicada.assertStatus(200)
    await client
      .post(`/api/v1/factores-emision/importaciones/${datos(aplicada).id}/aplicar`)
      .bearerToken(token)
      .then((respuesta) => respuesta.assertStatus(200))

    // Mismo contenido (otra referencia, claves en otro orden): mismo hash.
    const { codigo, ...resto } = fila()
    const reordenada = await previsualizar(
      client,
      token,
      cuerpo('Otra referencia', [{ ...resto, codigo }])
    )
    reordenada.assertStatus(409)
    assert.match(JSON.stringify(reordenada.body()), /ya se cargó en la importación/)

    const rechazable = fila({
      codigo: 'IMP-LUZ-01',
      fuenteEmisionCodigo: 'B1-01',
      unidadEntradaCodigo: 'UM-KWH',
    })
    const previaRechazada = await previsualizar(client, token, cuerpo('Rechazar', [rechazable]))
    previaRechazada.assertStatus(200)
    await client
      .post(`/api/v1/factores-emision/importaciones/${datos(previaRechazada).id}/rechazar`)
      .bearerToken(token)
      .then((respuesta) => respuesta.assertStatus(200))
    const repetidaRechazada = await previsualizar(client, token, cuerpo('Rechazar', [rechazable]))
    repetidaRechazada.assertStatus(409)

    // Contenido distinto con el mismo factor: hash nuevo, pero la fila sale
    // DUPLICADO contra la base y no hay nada que aplicar.
    const variante = await previsualizar(
      client,
      token,
      cuerpo('Variante', [fila({ nombre: 'Mismo factor, otro nombre' })])
    )
    variante.assertStatus(200)
    assert.equal(datos(variante).porInsertar, 0)
    assert.equal(datos(variante).filas![0].accion, 'DUPLICADO')
    const sinFilas = await client
      .post(`/api/v1/factores-emision/importaciones/${datos(variante).id}/aplicar`)
      .bearerToken(token)
    sinFilas.assertStatus(422)

    const factores = await FactorEmision.query().where('versionId', v.id)
    assert.deepEqual(
      factores.map((factor) => factor.codigo),
      ['IMP-GAS-01']
    )
  })

  test('dos importaciones distintas con el mismo factor: sólo se aplica la primera', async ({
    client,
    assert,
  }) => {
    const token = await prepararCuenta(
      client,
      'admin.integridad.dos@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const v = await version('DOS')
    const base = { versionId: v.id, origen: 'FIXTURE', referencia: 'Archivo sintético' }
    const primera = await previsualizar(client, token, { ...base, filas: [fila()] })
    const segunda = await previsualizar(client, token, {
      ...base,
      filas: [
        fila({ codigo: 'IMP-GAS-OTRO' }),
        fila({ codigo: 'IMP-LUZ-01', fuenteEmisionCodigo: 'B1-01', unidadEntradaCodigo: 'UM-KWH' }),
      ],
    })
    primera.assertStatus(200)
    segunda.assertStatus(200)
    assert.equal(datos(segunda).porInsertar, 2)

    await client
      .post(`/api/v1/factores-emision/importaciones/${datos(primera).id}/aplicar`)
      .bearerToken(token)
      .then((respuesta) => respuesta.assertStatus(200))
    const conflicto = await client
      .post(`/api/v1/factores-emision/importaciones/${datos(segunda).id}/aplicar`)
      .bearerToken(token)
    conflicto.assertStatus(409)

    // Ni siquiera la fila B1-01, que no tenía conflicto, se insertó.
    const factores = await FactorEmision.query().where('versionId', v.id)
    assert.deepEqual(
      factores.map((factor) => factor.codigo),
      ['IMP-GAS-01']
    )
  })
})

test.group('Cobertura: catálogo completo y separación por versión', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('incluye las 191 fuentes y no mezcla versiones ni estados', async ({ client, assert }) => {
    const token = await prepararCuenta(
      client,
      'admin.cobertura.versiones@huellacarbono.test',
      'ADMINISTRADOR'
    )
    const v1 = await version('COB-V1')
    const v2 = await version('COB-V2')
    const kg = await unidadId('UM-KG')
    const hoy = DateTime.utc().startOf('day')
    const factor = async (
      versionId: number,
      codigoFuente: string,
      unidad: string,
      cambios: Record<string, unknown>
    ) =>
      FactorEmision.create({
        versionId,
        fuenteEmisionId: await fuenteId(codigoFuente),
        unidadEntradaId: await unidadId(unidad),
        unidadSalidaId: kg,
        codigo: `COB-${versionId}-${codigoFuente}`,
        nombre: `Cobertura ${codigoFuente}`,
        valor: '1',
        gas: 'CO2E',
        estadoAprobacion: 'APROBADO',
        fuente: FUENTE_SINTETICA,
        institucionResponsable: 'Fixture de pruebas',
        anioPublicacion: 2026,
        anioAplicacion: hoy.year,
        fechaInicioVigencia: hoy.minus({ years: 1 }),
        estado: true,
        ...cambios,
      })
    // Versión 1
    await factor(v1.id, 'A1-01', 'UM-M3', {})
    await factor(v1.id, 'A1-02', 'UM-M3', { estadoAprobacion: 'PENDIENTE' })
    await factor(v1.id, 'A1-03', 'UM-M3', { estadoAprobacion: 'RECHAZADO' })
    await factor(v1.id, 'A1-04', 'UM-M3', { fechaFinVigencia: hoy.minus({ days: 1 }) })
    await factor(v1.id, 'A1-05', 'UM-M3', { estadoAprobacion: 'PENDIENTE', estado: false })
    // Versión 2: aprobado para una fuente que en la versión 1 no tiene nada.
    await factor(v2.id, 'B1-01', 'UM-KWH', {})

    const consultar = async (versionId: number) => {
      const response = await client
        .get(`/api/v1/factores-emision/cobertura?versionId=${versionId}`)
        .bearerToken(token)
      response.assertStatus(200)
      return (
        response.body() as {
          data: {
            totalFuentes: number
            porAlcance: { alcanceCodigo: string; total: number }[]
            fuentes: {
              fuenteCodigo: string
              estado: string
              aprobadosVigentes: number
              aprobadosNoVigentes: number
              pendientes: number
            }[]
          }
        }
      ).data
    }

    const cobertura1 = await consultar(v1.id)
    const codigosCatalogo = FUENTES_EMISION_DOCUMENTALES.map((fuente) => fuente.codigo).sort()
    assert.lengthOf(codigosCatalogo, 191)
    assert.equal(cobertura1.totalFuentes, 191)
    assert.deepEqual(
      cobertura1.fuentes.map((fuente) => fuente.fuenteCodigo).sort(),
      codigosCatalogo
    )
    assert.deepEqual(
      Object.fromEntries(cobertura1.porAlcance.map((grupo) => [grupo.alcanceCodigo, grupo.total])),
      Object.fromEntries(
        Object.entries(
          FUENTES_EMISION_DOCUMENTALES.reduce<Record<string, number>>((conteo, fuente) => {
            const alcance = `ALCANCE-${ACTIVIDADES_EMISION.find((actividad) => actividad.codigo === fuente.actividad)!.alcance}`
            conteo[alcance] = (conteo[alcance] ?? 0) + 1
            return conteo
          }, {})
        )
      )
    )

    const en = (datosCobertura: typeof cobertura1, codigo: string) =>
      datosCobertura.fuentes.find((fuente) => fuente.fuenteCodigo === codigo)!
    assert.equal(en(cobertura1, 'A1-01').estado, 'CON_FACTOR_APROBADO')
    assert.equal(en(cobertura1, 'A1-02').estado, 'SOLO_PENDIENTES')
    // Rechazado: no cuenta como pendiente ni como aprobado.
    assert.equal(en(cobertura1, 'A1-03').estado, 'SIN_FACTOR')
    assert.equal(en(cobertura1, 'A1-03').pendientes, 0)
    // Aprobado pero vencido: visible aparte, no como vigente.
    assert.equal(en(cobertura1, 'A1-04').estado, 'SIN_FACTOR')
    assert.equal(en(cobertura1, 'A1-04').aprobadosNoVigentes, 1)
    // Inactivo: no cuenta.
    assert.equal(en(cobertura1, 'A1-05').estado, 'SIN_FACTOR')
    // B1-01 sólo tiene factor en la versión 2.
    assert.equal(en(cobertura1, 'B1-01').estado, 'SIN_FACTOR')

    const cobertura2 = await consultar(v2.id)
    assert.equal(cobertura2.totalFuentes, 191)
    assert.equal(en(cobertura2, 'B1-01').estado, 'CON_FACTOR_APROBADO')
    assert.equal(en(cobertura2, 'A1-01').estado, 'SIN_FACTOR')
    assert.equal(en(cobertura2, 'A1-02').estado, 'SIN_FACTOR')
  })
})
