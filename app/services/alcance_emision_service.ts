import AlcanceEmision from '#models/alcance_emision'
import CatalogoSimpleService, { type PayloadCatalogo } from '#services/catalogo_simple'

const servicio = new CatalogoSimpleService(
  AlcanceEmision,
  {
    noExiste: 'El alcance de emisión no existe',
    yaInactivo: 'El alcance de emisión ya está inactivo',
    codigoDuplicado: 'Ya existe un alcance de emisión con ese código',
    nombreDuplicado: 'Ya existe un alcance de emisión con ese nombre',
    enUso: 'Este alcance ya tiene datos o resultados de carbono',
  },
  [
    { tabla: 'dato_actividad_carbono', columna: 'id_alcance', excluirRechazados: true },
    { tabla: 'resultado_carbono', columna: 'id_alcance' },
  ]
)

export default class AlcanceEmisionService {
  list(includeInactive: boolean) {
    return servicio.list(includeInactive)
  }

  show(id: number) {
    return servicio.show(id)
  }

  create(payload: PayloadCatalogo) {
    return servicio.create(payload)
  }

  update(id: number, payload: PayloadCatalogo) {
    return servicio.update(id, payload)
  }
}
