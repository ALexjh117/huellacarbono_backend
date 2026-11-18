import Actividad from '#models/actividad'
import AlcanceEmision from '#models/alcance_emision'
import FuenteEmision from '#models/fuente_emision'
import Organizacion from '#models/organizacion'
import PeriodoMedicion from '#models/periodo_medicion'

/**
 * Catálogos que alimentan el módulo de datos de actividad.
 *
 * Ninguno de estos endpoints existía antes: se agregan como lecturas de solo
 * consulta para que los selectores consuman datos reales (no listas
 * ficticias). No crean ni modifican registros.
 *
 * Actividades y periodos se filtran por proyecto para que un selector jamás
 * muestre datos de otra organización; fuentes y alcances son catálogos
 * globales.
 */
export default class CatalogosService {
  /** Proyectos activos. «Proyecto» equivale a `organizacion` (no hay tabla `proyecto`). */
  async proyectos() {
    const organizaciones = await Organizacion.query().where('estado', true).orderBy('nombre', 'asc')

    // Varias organizaciones comparten nombre y NIT (p. ej. sedes del mismo
    // instituto): `shortName` y `address` permiten distinguirlas en el
    // selector global de proyecto.
    return organizaciones.map((organizacion) => ({
      id: organizacion.id,
      name: organizacion.nombre,
      shortName: organizacion.nombreCorto,
      address: organizacion.direccion,
      nit: organizacion.nit,
      active: organizacion.estado,
    }))
  }

  /**
   * Actividades del proyecto, activas, con su proceso y sede precargados:
   * la relación facilita identificar cada actividad en el selector.
   */
  async actividades(projectId: number) {
    const actividades = await Actividad.query()
      .where('estado', true)
      .whereHas('proceso', (proceso) =>
        proceso.whereHas('sede', (sede) => sede.where('organizacionId', projectId))
      )
      .preload('proceso', (proceso) => proceso.preload('sede'))
      .orderBy('nombre', 'asc')

    return actividades.map((actividad) => ({
      id: actividad.id,
      name: actividad.nombre,
      processName: actividad.proceso?.nombre ?? null,
      sedeName: actividad.proceso?.sede?.nombre ?? null,
    }))
  }

  /** Periodos del proyecto. Se listan todos (incluidos cerrados) para poder consultar datos históricos. */
  async periodos(projectId: number) {
    const periodos = await PeriodoMedicion.query()
      .where('idOrganizacion', projectId)
      .orderBy('fecha_inicio', 'desc')

    return periodos.map((periodo) => ({
      id: periodo.id,
      name: periodo.nombre,
      startDate: periodo.fechaInicio.toISODate(),
      endDate: periodo.fechaFin.toISODate(),
      status: periodo.estado,
    }))
  }

  /** Fuentes de emisión activas (catálogo global). */
  async fuentesEmision() {
    const fuentes = await FuenteEmision.query().where('estado', true).orderBy('nombre', 'asc')

    return fuentes.map((fuente) => ({
      id: fuente.id,
      code: fuente.codigo,
      name: fuente.nombre,
      category: fuente.categoria,
    }))
  }

  /** Alcances de emisión activos (catálogo global). */
  async alcances() {
    const alcances = await AlcanceEmision.query().where('estado', true).orderBy('codigo', 'asc')

    return alcances.map((alcance) => ({
      id: alcance.id,
      code: alcance.codigo,
      name: alcance.nombre,
      description: alcance.descripcion,
    }))
  }
}
