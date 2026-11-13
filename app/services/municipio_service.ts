import Departamento from '#models/departamento'
import Municipio from '#models/municipio'
import { Exception } from '@adonisjs/core/exceptions'

export type ListMunicipiosQuery = {
  page: number
  perPage: number
  includeInactive: boolean
  idDepartamento?: number
}

/**
 * Municipios del padrón DIVIPOLA. La tabla es un catálogo de referencia que se
 * carga desde `database/seeders/territorio_seeder.ts`, por lo que este servicio
 * solo expone operaciones de consulta.
 */
export default class MunicipioService {
  async list(query: ListMunicipiosQuery) {
    const municipios = Municipio.query()
      .preload('departamento')
      .orderBy('id_departamento', 'asc')
      .orderBy('nombre', 'asc')

    if (!query.includeInactive) {
      municipios.where('estado', true)
    }

    if (query.idDepartamento !== undefined) {
      await this.assertDepartamento(query.idDepartamento)
      municipios.where('id_departamento', query.idDepartamento)
    }

    return municipios.paginate(query.page, query.perPage)
  }

  async show(id: number) {
    const municipio = await Municipio.query().where('id', id).preload('departamento').first()

    if (!municipio) {
      throw new Exception('El municipio no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    return municipio
  }

  async options(idDepartamento?: number) {
    if (idDepartamento !== undefined) {
      await this.assertDepartamento(idDepartamento)
    }

    const query = Municipio.query()
      .where('estado', true)
      .preload('departamento')
      .orderBy('id_departamento', 'asc')
      .orderBy('nombre', 'asc')

    if (idDepartamento !== undefined) {
      query.where('id_departamento', idDepartamento)
    }

    const municipios = await query

    return municipios.map((municipio) => ({
      id: municipio.id,
      name: municipio.nombre,
      code: municipio.codigo,
      department: {
        id: municipio.departamento.id,
        name: municipio.departamento.nombre,
      },
    }))
  }

  private async assertDepartamento(id: number) {
    const departamento = await Departamento.find(id)
    if (!departamento) {
      throw new Exception('El departamento no existe', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }
  }
}
