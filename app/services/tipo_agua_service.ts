import TipoAgua from '#models/tipo_agua'
import CatalogoSimpleService, { type PayloadCatalogo } from '#services/catalogo_simple'

const servicio = new CatalogoSimpleService(
  TipoAgua,
  {
    noExiste: 'El tipo de agua no existe',
    yaInactivo: 'El tipo de agua ya está inactivo',
    codigoDuplicado: 'Ya existe un tipo de agua con ese código',
    nombreDuplicado: 'Ya existe un tipo de agua con ese nombre',
    enUso: 'Este tipo de agua ya tiene mediciones registradas',
  },
  [{ tabla: 'dato_hidrico', columna: 'id_tipo_agua', excluirRechazados: true }]
)

export default class TipoAguaService {
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
