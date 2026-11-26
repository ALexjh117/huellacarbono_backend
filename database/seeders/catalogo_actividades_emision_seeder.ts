import AlcanceEmision from '#models/alcance_emision'
import ActividadEmision from '#models/actividad_emision'
import FuenteEmision from '#models/fuente_emision'
import SubcategoriaEmision from '#models/subcategoria_emision'
import {
  ACTIVIDADES_EMISION,
  FUENTES_EMISION_DOCUMENTALES,
  OBSERVACIONES_CODIGOS_FUENTE,
  SUBCATEGORIAS_EMISION,
} from '#data/catalogo_actividades_emision'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

const OBSERVACIONES = new Map<string, string>(
  OBSERVACIONES_CODIGOS_FUENTE.map((fila) => [fila.actividad, fila.nota])
)

export default class CatalogoActividadesEmisionSeeder extends BaseSeeder {
  async run() {
    await db.transaction(async (trx) => {
      const alcances = new Map<string, AlcanceEmision>()
      for (const [numero, codigo, nombre] of [
        ['1', 'ALCANCE-1', 'Alcance 1'],
        ['2', 'ALCANCE-2', 'Alcance 2'],
        ['3', 'ALCANCE-3', 'Alcance 3'],
      ]) {
        const porCodigo = await AlcanceEmision.query({ client: trx })
          .where('codigo', codigo)
          .first()
        const porNombre = await AlcanceEmision.query({ client: trx })
          .where('nombre', nombre)
          .first()
        if (porCodigo && porNombre && porCodigo.id !== porNombre.id) {
          throw new Error(
            `El código ${codigo} y el nombre "${nombre}" apuntan a alcances diferentes; se cancela la carga.`
          )
        }

        const existente = porCodigo ?? porNombre
        if (existente) {
          if (existente.codigo !== codigo || existente.nombre !== nombre || !existente.estado) {
            throw new Error(
              `El alcance esperado (${codigo}, "${nombre}") ya existe con datos incompatibles; se conserva y se cancela la carga.`
            )
          }
          alcances.set(numero, existente)
          continue
        }

        const creado = await AlcanceEmision.create(
          { codigo, nombre, estado: true },
          { client: trx }
        )
        alcances.set(numero, creado)
      }

      const actividades = new Map<string, ActividadEmision>()
      for (const fila of ACTIVIDADES_EMISION) {
        const alcance = alcances.get(fila.alcance)!
        const existente = await ActividadEmision.query({ client: trx })
          .where('codigo', fila.codigo)
          .first()
        if (existente) {
          if (
            existente.alcanceId !== alcance.id ||
            existente.nombre !== fila.nombre ||
            !existente.estado
          ) {
            throw new Error(
              `La actividad ${fila.codigo} existe con alcance, nombre o estado incompatible; se conserva y se cancela la carga.`
            )
          }
          actividades.set(fila.codigo, existente)
          continue
        }
        const creada = await ActividadEmision.create(
          { alcanceId: alcance.id, codigo: fila.codigo, nombre: fila.nombre, estado: true },
          { client: trx }
        )
        actividades.set(fila.codigo, creada)
      }

      const subcategorias = new Map<string, SubcategoriaEmision>()
      for (const fila of SUBCATEGORIAS_EMISION) {
        const actividad = actividades.get(fila.actividad)!
        const existente = await SubcategoriaEmision.query({ client: trx })
          .where('actividadEmisionId', actividad.id)
          .where('codigo', fila.codigo)
          .first()
        if (existente) {
          if (existente.nombre !== fila.nombre || !existente.estado) {
            throw new Error(
              `La subcategoría ${fila.actividad}/${fila.codigo} existe con nombre o estado incompatible; se conserva y se cancela la carga.`
            )
          }
          subcategorias.set(`${fila.actividad}:${fila.codigo}`, existente)
          continue
        }
        const creada = await SubcategoriaEmision.create(
          {
            actividadEmisionId: actividad.id,
            codigo: fila.codigo,
            nombre: fila.nombre,
            estado: true,
          },
          { client: trx }
        )
        subcategorias.set(`${fila.actividad}:${fila.codigo}`, creada)
      }

      for (const fila of FUENTES_EMISION_DOCUMENTALES) {
        const actividad = actividades.get(fila.actividad)!
        const subcategoria = fila.subcategoria
          ? subcategorias.get(`${fila.actividad}:${fila.subcategoria}`)!
          : null
        let fuente = await FuenteEmision.query({ client: trx }).where('codigo', fila.codigo).first()
        if (fuente) {
          if (fuente.nombre !== fila.nombre || !fuente.estado) {
            throw new Error(
              `La fuente ${fila.codigo} existe con nombre o estado incompatible; se conserva y se cancela la carga.`
            )
          }
          if (
            (fuente.actividadEmisionDirectaId !== null &&
              fuente.actividadEmisionDirectaId !== undefined &&
              Number(fuente.actividadEmisionDirectaId) !== Number(actividad.id)) ||
            (fuente.subcategoriaEmisionDirectaId !== null &&
              fuente.subcategoriaEmisionDirectaId !== undefined &&
              Number(fuente.subcategoriaEmisionDirectaId) !== Number(subcategoria?.id ?? 0))
          ) {
            throw new Error(
              `La fuente ${fila.codigo} tiene una clasificación directa histórica diferente; se conserva y se cancela la carga.`
            )
          }
        } else {
          fuente = await FuenteEmision.create(
            { codigo: fila.codigo, nombre: fila.nombre, estado: true },
            { client: trx }
          )
        }
        const observacion = OBSERVACIONES.get(fila.actividad) ?? null
        const vinculo = await trx
          .from('actividad_emision_fuente')
          .where('id_actividad_emision', actividad.id)
          .where('id_fuente_emision', fuente.id)
          .first()

        if (vinculo) {
          if (
            Number(vinculo.id_subcategoria_emision ?? 0) !== Number(subcategoria?.id ?? 0) ||
            (vinculo.observacion ?? null) !== observacion
          ) {
            throw new Error(
              `El vínculo de la fuente ${fila.codigo} ya existe con una subcategoría u observación diferente; se conserva y se cancela la carga.`
            )
          }
          continue
        }

        await trx.table('actividad_emision_fuente').insert({
          id_actividad_emision: actividad.id,
          id_fuente_emision: fuente.id,
          id_subcategoria_emision: subcategoria?.id ?? null,
          observacion,
        })
      }
    })
  }
}
