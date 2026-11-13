import { Exception } from '@adonisjs/core/exceptions'
import Organizacion from '#models/organizacion'
import Sede from '#models/sede'

type Filtros = { search?: string; estado?: boolean; tipo?: string }

type OrganizacionPayload = Partial<{
  nombre: string
  tipo: string
  estado: boolean
  nombreCorto: string | null
  nit: string | null
  sectorEconomico: string | null
  direccion: string | null
  municipioId: number | null
  correo: string | null
  telefono: string | null
  representanteNombre: string | null
  representanteTipoDocumento: string | null
  representanteNumeroDocumento: string | null
  representanteCorreo: string | null
  representanteTelefono: string | null
}>

export default class OrganizacionService {
  async listar(filtros: Filtros) {
    const query = Organizacion.query().orderBy('nombre', 'asc')

    if (filtros.estado !== undefined) query.where('estado', filtros.estado)
    if (filtros.tipo) query.where('tipo', filtros.tipo)
    if (filtros.search) {
      const termino = `%${filtros.search}%`
      query.where((grupo) => {
        grupo
          .whereILike('nombre', termino)
          .orWhereILike('nombreCorto', termino)
          .orWhereILike('nit', termino)
      })
    }

    return query
  }

  async obtener(id: number) {
    const organizacion = await Organizacion.query()
      .where('id', id)
      .preload('sedes', (sedes) => sedes.orderBy('nombre', 'asc'))
      .first()

    if (!organizacion) {
      throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return organizacion
  }

  async crear(payload: OrganizacionPayload & { nombre: string; tipo: string }) {
    const organizacion = await Organizacion.create({ ...payload, estado: true })
    return this.obtener(organizacion.id)
  }

  async actualizar(id: number, payload: OrganizacionPayload) {
    const organizacion = await this.buscar(id)

    if (payload.estado === false && organizacion.estado) {
      await this.validarSinSedesActivas(id)
    }

    organizacion.merge(payload)
    await organizacion.save()
    return this.obtener(id)
  }

  async eliminar(id: number) {
    const organizacion = await this.buscar(id)

    if (organizacion.estado) {
      await this.validarSinSedesActivas(id)
      organizacion.estado = false
      await organizacion.save()
    }
  }

  private async buscar(id: number) {
    const organizacion = await Organizacion.find(id)
    if (!organizacion) {
      throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return organizacion
  }

  private async validarSinSedesActivas(organizacionId: number) {
    const [fila] = await Sede.query()
      .where('organizacionId', organizacionId)
      .where('estado', true)
      .count('* as total')

    if (Number(fila.$extras.total) > 0) {
      throw new Exception(
        'La organización tiene sedes activas. Desactívalas antes de desactivar la organización',
        { status: 409, code: 'E_CONFLICT' }
      )
    }
  }
}