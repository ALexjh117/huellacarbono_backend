import { decimalTexto, fechaTexto } from '#services/catalogo_reglas'
import { rethrowDatabaseError } from '#services/database_error'
import AccionReduccion from '#models/accion_reduccion'
import CalculoCarbono from '#models/calculo_carbono'
import type { FilaOmitida } from '#models/calculo_carbono'
import DatoActividadCarbono from '#models/dato_actividad_carbono'
import FactorEmision from '#models/factor_emision'
import MetodologiaVersion from '#models/metodologia_version'
import Organizacion from '#models/organizacion'
import PeriodoMedicion from '#models/periodo_medicion'
import ResultadoCarbono from '#models/resultado_carbono'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

type CrearPayload = {
  organizacionId: number
  periodoId: number
  versionId: number
  observacion?: string | null
  unidadesProducidas?: string | null
  unidadFuncional?: string | null
}

type AccionPayload = {
  fuenteEmisionId?: number | null
  estrategia: string
  indicador: string
  meta: string
}

export type GrupoEmision = {
  nombre: string
  valorCo2e: string
  porcentaje: number
}

const ESCALA_CANTIDAD = 8
const ESCALA_FACTOR = 12
const ESCALA_RESULTADO = 8

function aEntero(valor: string, escala: number): bigint {
  const negativo = valor.trim().startsWith('-')
  const limpio = valor.trim().replace('-', '')
  const [enteroRaw, fracRaw = ''] = limpio.split('.')
  const entero = enteroRaw.replace(/\D/g, '') || '0'
  const frac = fracRaw.replace(/\D/g, '')
  const base = BigInt(`${entero}${frac.slice(0, escala).padEnd(escala, '0')}`)
  const siguiente = frac[escala] ?? '0'
  const redondeado = siguiente >= '5' ? base + 1n : base
  return negativo ? -redondeado : redondeado
}

function desdeEntero(numero: bigint, escala: number): string {
  const negativo = numero < 0n
  const absoluto = (negativo ? -numero : numero).toString().padStart(escala + 1, '0')
  const corte = absoluto.length - escala
  const entero = absoluto.slice(0, corte).replace(/^0+(?=\d)/, '')
  const frac = absoluto.slice(corte).replace(/0+$/, '')
  const cuerpo = frac ? `${entero}.${frac}` : entero
  return negativo && cuerpo !== '0' ? `-${cuerpo}` : cuerpo
}

export function multiplicarEmision(cantidad: string, factor: string): string {
  const producto = aEntero(cantidad, ESCALA_CANTIDAD) * aEntero(factor, ESCALA_FACTOR)
  const quitar = ESCALA_CANTIDAD + ESCALA_FACTOR - ESCALA_RESULTADO
  const divisor = 10n ** BigInt(quitar)
  const mitad = divisor / 2n
  const ajustado = producto >= 0n ? (producto + mitad) / divisor : (producto - mitad) / divisor
  return desdeEntero(ajustado, ESCALA_RESULTADO)
}

export function dividirEmision(numerador: string, divisor: string): string {
  const n = aEntero(numerador, ESCALA_RESULTADO)
  const d = aEntero(divisor, ESCALA_RESULTADO)
  if (d <= 0n) {
    throw new Exception('La cantidad de unidades tiene que ser mayor que cero', {
      status: 422,
      code: 'E_VALIDATION',
    })
  }
  const escala = 10n ** BigInt(ESCALA_RESULTADO)
  const producto = n * escala
  const mitad = d / 2n
  const ajustado = producto >= 0n ? (producto + mitad) / d : (producto - mitad) / d
  return desdeEntero(ajustado, ESCALA_RESULTADO)
}

export function toneladasDesdeKg(totalKg: string): string {
  return dividirEmision(totalKg, '1000')
}

export function intensidadDesde(totalKg: string, unidades: string): string {
  return dividirEmision(totalKg, unidades)
}

function sumarEmision(valores: string[]): string {
  const total = valores.reduce((acumulado, valor) => acumulado + aEntero(valor, ESCALA_RESULTADO), 0n)
  return desdeEntero(total, ESCALA_RESULTADO)
}

function porcentaje(parte: string, total: string): number {
  const base = Number(total)
  if (!base) return 0
  return Math.round((Number(parte) / base) * 1000) / 10
}

function textoPlano(valor: string) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function plantillaReduccion(nombre: string, categoria: string | null) {
  const texto = textoPlano(`${nombre} ${categoria ?? ''}`)
  if (/electr|energia|kwh|luz/.test(texto)) {
    return {
      estrategia: 'Iluminación LED y equipos eficientes',
      indicador: 'kWh/mes',
      meta: 'Reducir el consumo eléctrico 10%.',
    }
  }
  if (/residu|organic|compost/.test(texto)) {
    return {
      estrategia: 'Implementar compostaje y separar los residuos',
      indicador: 'kg aprovechados',
      meta: 'Aprovechar 70% de los residuos.',
    }
  }
  if (/gasolina|diesel|combust/.test(texto)) {
    return {
      estrategia: 'Optimizar recorridos y mantenimiento vehicular',
      indicador: 'Litros/km',
      meta: 'Reducir el combustible 8%.',
    }
  }
  if (/gas natural|caldera/.test(texto)) {
    return {
      estrategia: 'Ajustar la caldera y revisar fugas de gas',
      indicador: 'm³/mes',
      meta: 'Reducir el consumo de gas 10%.',
    }
  }
  if (/transport|logistic/.test(texto)) {
    return {
      estrategia: 'Optimizar rutas y cargas',
      indicador: 'kg CO2e por t·km',
      meta: 'Bajar el transporte del periodo.',
    }
  }
  if (/carton|material|empaque/.test(texto)) {
    return {
      estrategia: 'Reducir el peso del material e incorporar reciclado',
      indicador: 'kg de material por unidad',
      meta: 'Bajar el material por unidad.',
    }
  }
  return {
    estrategia: `Medir y reducir ${nombre}`,
    indicador: 'kg CO2e',
    meta: `Reducir la emisión de ${nombre}.`,
  }
}

export function proponerReduccion(
  lineas: {
    fuenteEmisionId: number
    fuenteNombre: string
    categoria: string | null
    valorCo2e: string
  }[]
): AccionPayload[] {
  if (!lineas.length) return []
  const total = sumarEmision(lineas.map((linea) => linea.valorCo2e))
  const mapa = new Map<number, { nombre: string; categoria: string | null; valores: string[] }>()
  for (const linea of lineas) {
    const actual = mapa.get(linea.fuenteEmisionId) ?? {
      nombre: linea.fuenteNombre,
      categoria: linea.categoria,
      valores: [],
    }
    actual.valores.push(linea.valorCo2e)
    mapa.set(linea.fuenteEmisionId, actual)
  }

  return [...mapa.entries()]
    .map(([fuenteEmisionId, grupo]) => {
      const valor = sumarEmision(grupo.valores)
      const plantilla = plantillaReduccion(grupo.nombre, grupo.categoria)
      const aporte = `Aporta ${decimalTexto(valor)} kg CO2e (${porcentaje(valor, total)}%).`
      return {
        fuenteEmisionId,
        estrategia: plantilla.estrategia,
        indicador: plantilla.indicador,
        meta: `${plantilla.meta} ${aporte}`.slice(0, 255),
        valor,
      }
    })
    .sort((a, b) => Number(b.valor) - Number(a.valor))
    .map(({ valor: _valor, ...accion }) => accion)
}

function agrupar(lineas: { nombre: string; valorCo2e: string }[], total: string): GrupoEmision[] {
  const mapa = new Map<string, string[]>()
  for (const linea of lineas) {
    const lista = mapa.get(linea.nombre) ?? []
    lista.push(linea.valorCo2e)
    mapa.set(linea.nombre, lista)
  }
  return [...mapa.entries()].map(([nombre, valores]) => {
    const valorCo2e = sumarEmision(valores)
    return { nombre, valorCo2e, porcentaje: porcentaje(valorCo2e, total) }
  })
}

function conDetalle() {
  return CalculoCarbono.query()
    .preload('organizacion')
    .preload('periodo')
    .preload('unidadResultado')
    .preload('version', (version) => version.preload('metodologia'))
    .preload('resultados', (resultados) => {
      resultados
        .preload('actividad', (actividad) => actividad.preload('proceso'))
        .preload('alcance')
        .preload('fuenteEmision')
        .preload('unidad')
    })
}

export default class CalculoCarbonoService {
  async list(organizacionId?: number) {
    const consulta = CalculoCarbono.query()
      .preload('organizacion')
      .preload('periodo')
      .preload('unidadResultado')
      .preload('version', (version) => version.preload('metodologia'))
      .orderBy('fechaCalculo', 'desc')
    if (organizacionId) consulta.where('organizacionId', organizacionId)
    return consulta.limit(100)
  }

  async show(id: number) {
    const calculo = await conDetalle().where('id', id).first()
    if (!calculo) {
      throw new Exception('El cálculo de carbono no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return calculo
  }

  async opciones(organizacionId: number) {
    const organizacion = await Organizacion.find(organizacionId)
    if (!organizacion) {
      throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const periodos = await PeriodoMedicion.query()
      .where('organizacionId', organizacionId)
      .whereNot('estado', 'BLOQUEADO')
      .orderBy('fechaInicio', 'desc')

    const versiones = await MetodologiaVersion.query()
      .where('estado', true)
      .whereHas('metodologia', (metodologia) => {
        metodologia.where('tipo', 'CARBONO').where('estado', true)
      })
      .preload('metodologia')
      .orderBy('fechaInicioVigencia', 'desc')

    return { periodos, versiones }
  }

  async crear(usuarioId: number, payload: CrearPayload) {
    const periodo = await PeriodoMedicion.query()
      .where('id', payload.periodoId)
      .where('organizacionId', payload.organizacionId)
      .first()
    if (!periodo) {
      throw new Exception('El periodo no pertenece a esa organización', {
        status: 404,
        code: 'E_NOT_FOUND',
      })
    }
    if (periodo.estado === 'BLOQUEADO') {
      throw new Exception('El periodo está bloqueado y no se puede calcular', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    const version = await MetodologiaVersion.query()
      .where('id', payload.versionId)
      .where('estado', true)
      .preload('metodologia')
      .first()
    if (!version || !version.metodologia.estado || version.metodologia.tipo !== 'CARBONO') {
      throw new Exception('La versión de metodología de carbono no existe o está inactiva', {
        status: 404,
        code: 'E_NOT_FOUND',
      })
    }

    const datos = await DatoActividadCarbono.query()
      .where('periodoId', periodo.id)
      .whereNot('estadoRegistro', 'RECHAZADO')
      .whereHas('actividad', (actividad) => {
        actividad.whereHas('proceso', (proceso) => {
          proceso.whereHas('sede', (sede) => {
            sede.where('organizacionId', payload.organizacionId)
          })
        })
      })
      .preload('actividad')
      .preload('fuenteEmision')
      .preload('unidad')
      .preload('alcance')

    if (!datos.length) {
      throw new Exception('Ese periodo no tiene papeles de carbono para calcular', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }

    const calculadas: {
      dato: DatoActividadCarbono
      factor: FactorEmision
      valor: string
    }[] = []
    const omitidos: FilaOmitida[] = []

    for (const dato of datos) {
      const fecha = dato.fechaDato ?? periodo.fechaInicio
      const factores = await FactorEmision.query()
        .where('versionId', version.id)
        .where('fuenteEmisionId', dato.fuenteEmisionId)
        .where('unidadEntradaId', dato.unidadId)
        .where('estado', true)
        .where('fecha_inicio_vigencia', '<=', fecha.toISODate()!)
        .where((consulta) => {
          consulta
            .whereNull('fecha_fin_vigencia')
            .orWhere('fecha_fin_vigencia', '>=', fecha.toISODate()!)
        })
        .preload('unidadSalida')

      if (factores.length !== 1) {
        omitidos.push({
          datoId: dato.id,
          actividadNombre: dato.actividad.nombre,
          fuenteNombre: dato.fuenteEmision.nombre,
          cantidad: decimalTexto(dato.cantidad),
          unidadSimbolo: dato.unidad.simbolo,
          motivo:
            factores.length === 0
              ? 'No hay un factor de esa versión para esta fuente y esta unidad'
              : 'Hay más de un factor vigente para esta fuente y esta unidad',
        })
        continue
      }

      calculadas.push({
        dato,
        factor: factores[0],
        valor: multiplicarEmision(dato.cantidad, factores[0].valor),
      })
    }

    const unidades = new Set(calculadas.map((fila) => fila.factor.unidadSalidaId))
    const mismaUnidad = unidades.size === 1
    const total = mismaUnidad && calculadas.length ? sumarEmision(calculadas.map((fila) => fila.valor)) : null
    const notaOmitidos = omitidos.length
      ? omitidos.length === 1
        ? '1 papel no entró en la suma.'
        : `${omitidos.length} papeles no entraron en la suma.`
      : null
    const observacion = [payload.observacion?.trim(), notaOmitidos].filter(Boolean).join(' ') || null
    const unidadesProducidas = payload.unidadesProducidas?.trim() || null
    const unidadFuncional = unidadesProducidas ? payload.unidadFuncional?.trim() || 'unidades' : null
    if (payload.unidadFuncional?.trim() && !unidadesProducidas) {
      throw new Exception('Falta la cantidad de unidades para calcular la intensidad', {
        status: 422,
        code: 'E_VALIDATION',
      })
    }
    if (unidadesProducidas) intensidadDesde(total ?? '0', unidadesProducidas)

    try {
      const calculo = await db.transaction(async (trx) => {
        const creado = await CalculoCarbono.create(
          {
            organizacionId: payload.organizacionId,
            periodoId: periodo.id,
            versionId: version.id,
            usuarioId,
            unidadResultadoId: mismaUnidad ? calculadas[0].factor.unidadSalidaId : null,
            fechaCalculo: DateTime.utc(),
            estado: 'CALCULADO',
            totalCo2e: total,
            unidadesProducidas,
            unidadFuncional,
            observacion,
          },
          { client: trx }
        )

        for (const fila of calculadas) {
          await ResultadoCarbono.create(
            {
              calculoCarbonoId: creado.id,
              actividadId: fila.dato.actividadId,
              alcanceId: fila.dato.alcanceId,
              fuenteEmisionId: fila.dato.fuenteEmisionId,
              unidadId: fila.factor.unidadSalidaId,
              valorCo2e: fila.valor,
            },
            { client: trx }
          )
          await trx.table('calculo_carbono_dato').insert({
            id_calculo_carbono: creado.id,
            id_dato_carbono: fila.dato.id,
          })
        }

        const factoresUsados = new Map<number, string>()
        for (const fila of calculadas) factoresUsados.set(fila.factor.id, fila.factor.valor)
        for (const [factorId, valor] of factoresUsados) {
          await trx.table('calculo_carbono_factor').insert({
            id_calculo_carbono: creado.id,
            id_factor_emision: factorId,
            valor_aplicado: valor,
          })
        }

        const propuestas = proponerReduccion(
          calculadas.map((fila) => ({
            fuenteEmisionId: fila.dato.fuenteEmisionId,
            fuenteNombre: fila.dato.fuenteEmision.nombre,
            categoria: fila.dato.fuenteEmision.categoria,
            valorCo2e: fila.valor,
          }))
        )
        for (const accion of propuestas) {
          await AccionReduccion.create(
            {
              calculoCarbonoId: creado.id,
              fuenteEmisionId: accion.fuenteEmisionId ?? null,
              estrategia: accion.estrategia,
              indicador: accion.indicador,
              meta: accion.meta,
            },
            { client: trx }
          )
        }

        return creado
      })

      const completo = await this.show(calculo.id)
      completo.omitidos = omitidos
      return completo
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo guardar el cálculo de carbono')
    }
  }

  async resumen(organizacionId: number) {
    const organizacion = await Organizacion.find(organizacionId)
    if (!organizacion) {
      throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const calculos = await CalculoCarbono.query()
      .where('organizacionId', organizacionId)
      .whereNotNull('totalCo2e')
      .preload('periodo')
      .preload('unidadResultado')
      .preload('resultados', (resultados) => {
        resultados.preload('alcance').preload('fuenteEmision')
      })
      .orderBy('fechaCalculo', 'desc')

    const vistos = new Set<number>()
    const unicos: CalculoCarbono[] = []
    for (const calculo of calculos) {
      if (vistos.has(calculo.periodoId)) continue
      vistos.add(calculo.periodoId)
      unicos.push(calculo)
    }

    const periodos = unicos
      .slice()
      .sort((a, b) => a.periodo.fechaInicio.toMillis() - b.periodo.fechaInicio.toMillis())
      .map((calculo) => this.ficha(calculo))

    return {
      organizacionId: organizacion.id,
      organizacionNombre: organizacion.nombre,
      ultimo: unicos[0] ? this.ficha(unicos[0]) : null,
      periodos,
    }
  }

  async informe(id: number) {
    const calculo = await CalculoCarbono.query()
      .where('id', id)
      .preload('organizacion')
      .preload('periodo')
      .preload('unidadResultado')
      .preload('version', (version) => version.preload('metodologia'))
      .preload('resultados', (resultados) => {
        resultados
          .preload('actividad', (actividad) => {
            actividad.preload('proceso', (proceso) => proceso.preload('sede'))
          })
          .preload('alcance')
          .preload('fuenteEmision')
          .preload('unidad')
      })
      .first()
    if (!calculo) {
      throw new Exception('El cálculo de carbono no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const puentes = await db
      .from('calculo_carbono_dato')
      .where('id_calculo_carbono', id)
      .select('id_dato_carbono')
    const datoIds = puentes.map((fila) => Number(fila.id_dato_carbono))
    const papeles = datoIds.length
      ? await DatoActividadCarbono.query()
          .whereIn('id', datoIds)
          .preload('actividad', (actividad) => actividad.preload('proceso'))
          .preload('unidad')
          .preload('alcance')
      : []

    const factores = await db
      .from('calculo_carbono_factor as puente')
      .join('factor_emision as factor', 'factor.id_factor_emision', 'puente.id_factor_emision')
      .join('fuente_emision as fuente', 'fuente.id_fuente_emision', 'factor.id_fuente_emision')
      .join('unidad_medida as entrada', 'entrada.id_unidad', 'factor.id_unidad_entrada')
      .where('puente.id_calculo_carbono', id)
      .select(
        'fuente.nombre as fuente',
        'puente.valor_aplicado as valor',
        'entrada.simbolo as unidad',
        'factor.fuente as documento'
      )

    const ficha = calculo.totalCo2e ? this.ficha(calculo) : null
    const sedes = [
      ...new Set(
        calculo.resultados
          .map((linea) => linea.actividad?.proceso?.sede?.nombre)
          .filter((nombre): nombre is string => Boolean(nombre))
      ),
    ]

    return {
      titulo: 'Informe de huella de carbono',
      organizacionNombre: calculo.organizacion.nombre,
      nit: calculo.organizacion.nit,
      sector: calculo.organizacion.sectorEconomico,
      sedes,
      periodoNombre: calculo.periodo.nombre,
      fechaInicio: fechaTexto(calculo.periodo.fechaInicio),
      fechaFin: fechaTexto(calculo.periodo.fechaFin),
      metodologiaNombre: calculo.version.metodologia.nombre,
      numeroVersion: calculo.version.numeroVersion,
      totalCo2e: ficha?.totalCo2e ?? null,
      toneladasCo2e: ficha?.toneladasCo2e ?? null,
      unidadResultado: ficha?.unidadResultado ?? null,
      unidadesProducidas: ficha?.unidadesProducidas ?? null,
      unidadFuncional: ficha?.unidadFuncional ?? null,
      intensidadCo2e: ficha?.intensidadCo2e ?? null,
      observacion: calculo.observacion,
      papeles: papeles.map((papel) => ({
        actividad: papel.actividad.nombre,
        proceso: papel.actividad.proceso.nombre,
        cantidad: decimalTexto(papel.cantidad),
        unidad: papel.unidad.simbolo,
        documento: papel.fuenteDato,
        alcance: papel.alcance.nombre,
      })),
      factores: factores.map((factor) => ({
        fuente: String(factor.fuente),
        valor: decimalTexto(String(factor.valor)),
        unidad: String(factor.unidad),
        documento: factor.documento ? String(factor.documento) : null,
      })),
      porAlcance: ficha?.porAlcance ?? [],
      porFuente: ficha?.porFuente ?? [],
      lineas: calculo.resultados.map((linea) => ({
        actividad: linea.actividad?.nombre ?? '',
        proceso: linea.actividad?.proceso?.nombre ?? '',
        alcance: linea.alcance?.nombre ?? '',
        fuente: linea.fuenteEmision?.nombre ?? '',
        valorCo2e: decimalTexto(linea.valorCo2e),
        unidad: linea.unidad?.simbolo ?? '',
      })),
      acciones: (await this.listarReduccion(id)).map((accion) => ({
        fuente: accion.fuenteNombre,
        estrategia: accion.estrategia,
        indicador: accion.indicador,
        meta: accion.meta,
      })),
    }
  }

  async listarReduccion(id: number) {
    const calculo = await CalculoCarbono.find(id)
    if (!calculo) {
      throw new Exception('El cálculo de carbono no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    let acciones = await AccionReduccion.query()
      .where('calculoCarbonoId', id)
      .preload('fuenteEmision')
      .orderBy('id', 'asc')

    if (!acciones.length) {
      const completo = await conDetalle().where('id', id).first()
      const propuestas = proponerReduccion(
        (completo?.resultados ?? []).map((linea) => ({
          fuenteEmisionId: linea.fuenteEmisionId,
          fuenteNombre: linea.fuenteEmision?.nombre ?? 'Fuente',
          categoria: linea.fuenteEmision?.categoria ?? null,
          valorCo2e: linea.valorCo2e,
        }))
      )
      if (propuestas.length) {
        await db.transaction(async (trx) => {
          for (const accion of propuestas) {
            await AccionReduccion.create(
              {
                calculoCarbonoId: id,
                fuenteEmisionId: accion.fuenteEmisionId ?? null,
                estrategia: accion.estrategia,
                indicador: accion.indicador,
                meta: accion.meta,
              },
              { client: trx }
            )
          }
        })
        acciones = await AccionReduccion.query()
          .where('calculoCarbonoId', id)
          .preload('fuenteEmision')
          .orderBy('id', 'asc')
      }
    }

    return acciones.map((accion) => ({
      id: accion.id,
      fuenteEmisionId: accion.fuenteEmisionId,
      fuenteNombre: accion.fuenteEmision?.nombre ?? null,
      estrategia: accion.estrategia,
      indicador: accion.indicador,
      meta: accion.meta,
    }))
  }

  async guardarReduccion(id: number, acciones: AccionPayload[]) {
    const calculo = await this.show(id)
    const fuentes = new Set(calculo.resultados.map((linea) => linea.fuenteEmisionId))
    for (const accion of acciones) {
      if (accion.fuenteEmisionId && !fuentes.has(accion.fuenteEmisionId)) {
        throw new Exception('Esa fuente no está en el cálculo', { status: 422, code: 'E_VALIDATION' })
      }
    }

    try {
      await db.transaction(async (trx) => {
        await AccionReduccion.query({ client: trx }).where('calculoCarbonoId', id).delete()
        for (const accion of acciones) {
          await AccionReduccion.create(
            {
              calculoCarbonoId: id,
              fuenteEmisionId: accion.fuenteEmisionId ?? null,
              estrategia: accion.estrategia.trim(),
              indicador: accion.indicador.trim(),
              meta: accion.meta.trim(),
            },
            { client: trx }
          )
        }
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo guardar el plan de reducción')
    }

    return this.listarReduccion(id)
  }

  private ficha(calculo: CalculoCarbono) {
    const total = calculo.totalCo2e ?? '0'
    const porAlcance = agrupar(
      calculo.resultados.map((linea) => ({
        nombre: linea.alcance?.nombre ?? 'Sin alcance',
        valorCo2e: linea.valorCo2e,
      })),
      total
    )
    const porFuente = agrupar(
      calculo.resultados.map((linea) => ({
        nombre: linea.fuenteEmision?.nombre ?? 'Sin fuente',
        valorCo2e: linea.valorCo2e,
      })),
      total
    )
    return {
      id: calculo.id,
      periodoId: calculo.periodoId,
      periodoNombre: calculo.periodo.nombre,
      fechaInicio: fechaTexto(calculo.periodo.fechaInicio),
      totalCo2e: decimalTexto(total),
      toneladasCo2e: decimalTexto(toneladasDesdeKg(total)),
      intensidadCo2e: calculo.unidadesProducidas
        ? decimalTexto(intensidadDesde(total, calculo.unidadesProducidas))
        : null,
      unidadesProducidas: calculo.unidadesProducidas
        ? decimalTexto(calculo.unidadesProducidas)
        : null,
      unidadFuncional: calculo.unidadFuncional,
      unidadResultado: calculo.unidadResultado?.simbolo ?? null,
      porAlcance,
      porFuente,
    }
  }
}

export function periodoVisible(periodo: PeriodoMedicion) {
  return {
    id: periodo.id,
    nombre: periodo.nombre,
    fechaInicio: fechaTexto(periodo.fechaInicio),
    fechaFin: fechaTexto(periodo.fechaFin),
    estado: periodo.estado,
  }
}
