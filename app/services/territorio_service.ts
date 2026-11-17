import Departamento from '#models/departamento'
import Municipio from '#models/municipio'
import { Exception } from '@adonisjs/core/exceptions'

export default class TerritorioService {
  async departamentos() {
    return Departamento.query().where('estado', true).orderBy('nombre', 'asc')
  }

  async municipios(departamentoId: number) {
    const departamento = await Departamento.query()
      .where('id', departamentoId)
      .where('estado', true)
      .first()

    if (!departamento) {
      throw new Exception('El departamento no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    return Municipio.query()
      .where('departamentoId', departamentoId)
      .where('estado', true)
      .preload('departamento')
      .orderBy('nombre', 'asc')
  }
}
