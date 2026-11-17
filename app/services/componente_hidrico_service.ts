import ComponenteHidrico from '#models/componente_hidrico'
import CatalogoSimpleService, { type PayloadCatalogo } from '#services/catalogo_simple'

const servicio = new CatalogoSimpleService(
  ComponenteHidrico,
  {
    noExiste: 'El componente hídrico no existe',
    yaInactivo: 'El componente hídrico ya está inactivo',
    codigoDuplicado: 'Ya existe un componente hídrico con ese código',
    nombreDuplicado: 'Ya existe un componente hídrico con ese nombre',
    enUso: 'Este componente hídrico ya se usó en un resultado',
  },
  [{ tabla: 'resultado_hidrico', columna: 'id_componente_hidrico' }]
)

export default class ComponenteHidricoService {
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
