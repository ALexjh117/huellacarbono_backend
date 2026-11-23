import { UNIDADES_MEDIDA_CATALOGO, type UnidadCatalogo } from '#data/unidades_medida_catalogo'
import UnidadMedida from '#models/unidad_medida'
import { normalizarMagnitud } from '#services/emissions/unit_conversion_service'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export type ResultadoUnidad = {
  codigo: string
  simbolo: string
  magnitud: string
  estado: 'CREADA' | 'POR_CREAR' | 'ENCONTRADA' | 'REQUIERE_REVISION'
  idUnidad: number | null
  detalle: string
}

export type ReporteCatalogoUnidades = {
  aplicado: boolean
  creadas: ResultadoUnidad[]
  porCrear: ResultadoUnidad[]
  encontradas: ResultadoUnidad[]
  requierenRevision: ResultadoUnidad[]
}

const DECIMAL_24_12 = /^\d{1,12}(?:\.\d{1,12})?$/

/** Forma canónica de un decimal para comparar '1' con '1.000000000000'. */
export function decimalCanonico(valor: string) {
  const texto = String(valor).trim()
  if (!/^\d+(?:\.\d+)?$/.test(texto)) return texto
  const [entero, fraccion = ''] = texto.split('.')
  const enteroLimpio = entero.replace(/^0+(?=\d)/, '')
  const fraccionLimpia = fraccion.replace(/0+$/, '')
  return fraccionLimpia ? `${enteroLimpio}.${fraccionLimpia}` : enteroLimpio
}

/** Comprueba que el catálogo declarado cumpla DECIMAL(24,12) > 0 y sin duplicados. */
export function validarCatalogo(catalogo: readonly UnidadCatalogo[]) {
  const errores: string[] = []
  const codigos = new Set<string>()
  const claves = new Set<string>()
  for (const unidad of catalogo) {
    if (!DECIMAL_24_12.test(unidad.factorBase) || !/[1-9]/.test(unidad.factorBase)) {
      errores.push(`${unidad.codigo}: factor base inválido (${unidad.factorBase})`)
    }
    if (codigos.has(unidad.codigo)) errores.push(`${unidad.codigo}: código repetido`)
    codigos.add(unidad.codigo)
    const clave = `${normalizarMagnitud(unidad.magnitud)}|${unidad.simbolo.toLocaleLowerCase()}`
    if (claves.has(clave)) errores.push(`${unidad.codigo}: símbolo repetido en su magnitud`)
    claves.add(clave)
  }
  return errores
}

/**
 * Sincroniza el catálogo de unidades de forma idempotente y no destructiva:
 * - Crea sólo las unidades que no existen (por código ni por símbolo+magnitud).
 * - Nunca actualiza, reactiva ni borra filas existentes: si una unidad ya
 *   existe con otro factor base, inactiva o con conflicto de código, la
 *   informa como REQUIERE_REVISION para que una persona decida.
 * - Con `aplicar: false` sólo informa lo que haría (simulación).
 */
export default class UnidadMedidaCatalogoService {
  async sincronizar(
    options: {
      aplicar: boolean
      client?: TransactionClientContract
      catalogo?: readonly UnidadCatalogo[]
    } = { aplicar: false }
  ): Promise<ReporteCatalogoUnidades> {
    const catalogo = options.catalogo ?? UNIDADES_MEDIDA_CATALOGO
    const errores = validarCatalogo(catalogo)
    if (errores.length) {
      throw new Error(`El catálogo de unidades es inválido: ${errores.join('; ')}`)
    }

    const consulta = options.client
      ? UnidadMedida.query({ client: options.client })
      : UnidadMedida.query()
    const existentes = await consulta.orderBy('id', 'asc')

    const reporte: ReporteCatalogoUnidades = {
      aplicado: options.aplicar,
      creadas: [],
      porCrear: [],
      encontradas: [],
      requierenRevision: [],
    }

    for (const unidad of catalogo) {
      const base = {
        codigo: unidad.codigo,
        simbolo: unidad.simbolo,
        magnitud: unidad.magnitud,
      }
      const magnitud = normalizarMagnitud(unidad.magnitud)
      const porCodigo = existentes.find((fila) => fila.codigo === unidad.codigo)
      const porSimbolo = existentes.filter(
        (fila) =>
          normalizarMagnitud(fila.magnitud) === magnitud &&
          fila.simbolo.trim().toLocaleLowerCase() === unidad.simbolo.toLocaleLowerCase()
      )

      if (porCodigo && normalizarMagnitud(porCodigo.magnitud) !== magnitud) {
        reporte.requierenRevision.push({
          ...base,
          estado: 'REQUIERE_REVISION',
          idUnidad: porCodigo.id,
          detalle: `El código ${unidad.codigo} ya lo usa una unidad de magnitud ${porCodigo.magnitud}`,
        })
        continue
      }

      const coincidencias = porCodigo
        ? [porCodigo, ...porSimbolo.filter((fila) => fila.id !== porCodigo.id)]
        : porSimbolo

      if (coincidencias.length > 1) {
        reporte.requierenRevision.push({
          ...base,
          estado: 'REQUIERE_REVISION',
          idUnidad: coincidencias[0].id,
          detalle: `Hay ${coincidencias.length} unidades equivalentes (ids ${coincidencias
            .map((fila) => fila.id)
            .join(', ')}); no se crea otra`,
        })
        continue
      }

      const existente = coincidencias[0]
      if (existente) {
        const problemas: string[] = []
        if (decimalCanonico(existente.factorBase) !== decimalCanonico(unidad.factorBase)) {
          problemas.push(
            `factor base ${decimalCanonico(existente.factorBase)} distinto del esperado ${unidad.factorBase}`
          )
        }
        if (!existente.estado) problemas.push('está inactiva')
        reporte[problemas.length ? 'requierenRevision' : 'encontradas'].push({
          ...base,
          estado: problemas.length ? 'REQUIERE_REVISION' : 'ENCONTRADA',
          idUnidad: existente.id,
          detalle: problemas.length
            ? `Unidad existente «${existente.nombre}» (código ${existente.codigo}): ${problemas.join('; ')}. No se modificó.`
            : `Unidad existente «${existente.nombre}» (código ${existente.codigo})`,
        })
        continue
      }

      if (!options.aplicar) {
        reporte.porCrear.push({
          ...base,
          estado: 'POR_CREAR',
          idUnidad: null,
          detalle: `Se crearía con factor base ${unidad.factorBase}`,
        })
        continue
      }

      const creada = await UnidadMedida.create(
        {
          codigo: unidad.codigo,
          nombre: unidad.nombre,
          simbolo: unidad.simbolo,
          magnitud: unidad.magnitud,
          factorBase: unidad.factorBase,
          estado: true,
        },
        options.client ? { client: options.client } : undefined
      )
      existentes.push(creada)
      reporte.creadas.push({
        ...base,
        estado: 'CREADA',
        idUnidad: creada.id,
        detalle: `Creada con factor base ${unidad.factorBase}`,
      })
    }

    return reporte
  }
}
