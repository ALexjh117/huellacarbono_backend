import FuenteEmision from '#models/fuente_emision'
import UnidadMedida from '#models/unidad_medida'

export default class ReferenciaService {
  async unidades() {
    const unidades = await UnidadMedida.query().where('estado', true).orderBy('nombre', 'asc')
    return unidades.map((unidad) => ({
      id: unidad.id,
      codigo: unidad.codigo,
      nombre: unidad.nombre,
      simbolo: unidad.simbolo,
      magnitud: unidad.magnitud,
    }))
  }

  async fuentes() {
    const fuentes = await FuenteEmision.query().where('estado', true).orderBy('nombre', 'asc')
    return fuentes.map((fuente) => ({
      id: fuente.id,
      codigo: fuente.codigo,
      nombre: fuente.nombre,
      categoria: fuente.categoria,
    }))
  }
}
