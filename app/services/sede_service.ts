import { Exception } from '@adonisjs/core/exceptions'
import Organizacion from '#models/organizacion'
import Sede from '#models/sede'

type Filtros = { organizacionId?: number; search?: string; estado?: boolean }

type SedePayload = Partial<{
  nombre: string
  estado: boolean
  codigo: string | null
  direccion: string | null
  telefono: string | null
  correo: string | null
  responsableNombre: string | null
  responsableCargo: string | null
  responsableCorreo: string | null
  responsableTelefono: string | null
}>

export default class SedeService {
  async listar(filtros: Filtros) {
    const query = Sede.query()
      .preload('organizacion')
      .orderBy('organizacionId', 'asc')
      .orderBy('nombre', 'asc')

    if (filtros.organizacionId) query.where('organizacionId', filtros.organizacionId)
    if (filtros.estado !== undefined) query.where('estado', filtros.estado)
    if (filtros.search) {
      const termino = `%${filtros.search}%`
      query.where((grupo) => {
        grupo.whereILike('nombre', termino).orWhereILike('codigo', termino)
      })
    }

    return query
  }

  async obtener(id: number) {
    const sede = await Sede.query().where('id', id).preload('organizacion').first()
    if (!sede) {
      throw new Exception('La sede no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return sede
  }

  async crear(payload: SedePayload & { organizacionId: number; nombre: string }) {
    const organizacion = await Organizacion.find(payload.organizacionId)
    if (!organizacion) {
      throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    if (!organizacion.estado) {
      throw new Exception('La organización está inactiva', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }

    if (payload.codigo) await this.validarCodigoUnico(payload.organizacionId, payload.codigo)

    const sede = await Sede.create({ ...payload, estado: true })
    return this.obtener(sede.id)
  }

  async actualizar(id: number, payload: SedePayload) {
    const sede = await this.buscar(id)

    if (payload.codigo && payload.codigo !== sede.codigo) {
      await this.validarCodigoUnico(sede.organizacionId, payload.codigo, sede.id)
    }

    if (payload.estado === true && !sede.estado) {
      const organizacion = await Organizacion.find(sede.organizacionId)
      if (!organizacion?.estado) {
        throw new Exception('No se puede reactivar una sede de una organización inactiva', {
          status: 422,
          code: 'E_VALIDATION_ERROR',
        })
      }
    }

    sede.merge(payload)
    await sede.save()
    return this.obtener(id)
  }

  async eliminar(id: number) {
    const sede = await this.buscar(id)
    if (sede.estado) {
      sede.estado = false
      await sede.save()
    }
  }

  private async buscar(id: number) {
    const sede = await Sede.find(id)
    if (!sede) {
      throw new Exception('La sede no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return sede
  }

  private async validarCodigoUnico(organizacionId: number, codigo: string, ignorarId?: number) {
    const query = Sede.query().where('organizacionId', organizacionId).where('codigo', codigo)
    if (ignorarId) query.whereNot('id', ignorarId)

    if (await query.first()) {
      throw new Exception('Ya existe una sede con ese código en la organización', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }
}