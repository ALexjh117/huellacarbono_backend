import Organizacion from '#models/organizacion'
import Sede from '#models/sede'
import Usuario from '#models/usuario'
import { rethrowDatabaseError } from '#services/database_error'
import { exigirAccesoOrganizacion, exigirAccesoSede } from '#services/access_control'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'

type Texto = string | null | undefined

export type SedePayload = {
  nombre?: string
  codigo?: Texto
  direccion?: Texto
  telefono?: Texto
  correo?: Texto
  responsableNombre?: Texto
  responsableCargo?: Texto
  responsableCorreo?: Texto
  responsableTelefono?: Texto
  active?: boolean
}

function limpiar(valor: Texto): string | null | undefined {
  if (valor === undefined) return undefined
  if (valor === null) return null
  const texto = valor.trim()
  return texto.length ? texto : null
}

export default class SedeService {
  async list(usuarioId: number, organizacionId: number, includeInactive: boolean) {
    await exigirAccesoOrganizacion(usuarioId, organizacionId)
    await this.assertOrganizacion(organizacionId)

    const sedes = Sede.query()
      .where('organizacionId', organizacionId)
      .preload('usuarios', (usuarios) => {
        usuarios.orderBy('nombres', 'asc').orderBy('apellidos', 'asc')
      })
      .withCount('procesos', (procesos) => {
        procesos.where('estado', true)
      })
      .orderBy('nombre', 'asc')

    if (!includeInactive) {
      sedes.where('estado', true)
    }

    return sedes
  }

  async show(id: number, usuarioId: number) {
    await exigirAccesoSede(usuarioId, id)
    const sede = await Sede.query()
      .where('id', id)
      .preload('usuarios', (usuarios) => {
        usuarios.orderBy('nombres', 'asc').orderBy('apellidos', 'asc')
      })
      .first()

    if (!sede) {
      throw new Exception('La sede no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    return sede
  }

  async create(usuarioId: number, organizacionId: number, payload: SedePayload) {
    await exigirAccesoOrganizacion(usuarioId, organizacionId)
    await this.assertOrganizacionActiva(organizacionId)
    const nombre = payload.nombre!.trim()
    const codigo = limpiar(payload.codigo) ?? null
    await this.assertNombreLibre(organizacionId, nombre)
    await this.assertCodigoLibre(organizacionId, codigo)

    try {
      const sede = await Sede.create({
        organizacionId,
        nombre,
        codigo,
        direccion: limpiar(payload.direccion) ?? null,
        telefono: limpiar(payload.telefono) ?? null,
        correo: limpiar(payload.correo) ?? null,
        responsableNombre: limpiar(payload.responsableNombre) ?? null,
        responsableCargo: limpiar(payload.responsableCargo) ?? null,
        responsableCorreo: limpiar(payload.responsableCorreo) ?? null,
        responsableTelefono: limpiar(payload.responsableTelefono) ?? null,
        estado: true,
      })
      return await this.show(sede.id, usuarioId)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la sede')
    }
  }

  async update(id: number, usuarioId: number, payload: SedePayload) {
    const sede = await this.show(id, usuarioId)

    if (payload.active === false && !sede.estado) {
      throw new Exception('La sede ya está inactiva', { status: 409, code: 'E_CONFLICT' })
    }

    if (payload.active === false) {
      const procesos = await db
        .from('proceso')
        .where('id_sede', sede.id)
        .where('estado', true)
        .count('* as total')
      if (Number(procesos[0]?.total ?? 0) > 0) {
        throw new Exception('Desactiva primero los procesos de esta sede', {
          status: 409,
          code: 'E_CONFLICT',
        })
      }
    }

    if (payload.active === true) {
      await this.assertOrganizacionActiva(sede.organizacionId)
    }

    const nombre = payload.nombre?.trim() ?? sede.nombre
    const codigo = payload.codigo !== undefined ? (limpiar(payload.codigo) ?? null) : sede.codigo

    if (payload.nombre !== undefined) {
      await this.assertNombreLibre(sede.organizacionId, nombre, sede.id)
    }
    if (payload.codigo !== undefined) {
      await this.assertCodigoLibre(sede.organizacionId, codigo, sede.id)
    }

    if (payload.nombre !== undefined) sede.nombre = nombre
    if (payload.codigo !== undefined) sede.codigo = codigo
    this.asignar(sede, 'direccion', payload.direccion)
    this.asignar(sede, 'telefono', payload.telefono)
    this.asignar(sede, 'correo', payload.correo)
    this.asignar(sede, 'responsableNombre', payload.responsableNombre)
    this.asignar(sede, 'responsableCargo', payload.responsableCargo)
    this.asignar(sede, 'responsableCorreo', payload.responsableCorreo)
    this.asignar(sede, 'responsableTelefono', payload.responsableTelefono)
    if (payload.active !== undefined) sede.estado = payload.active

    try {
      await sede.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la sede')
    }

    return this.show(sede.id, usuarioId)
  }

  async syncUsuarios(id: number, usuarioId: number, userIds: number[]) {
    const sede = await this.show(id, usuarioId)
    if (!sede.estado) {
      throw new Exception('No se pueden asignar usuarios a una sede inactiva', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    const unicos = [...new Set(userIds)]
    if (unicos.length) {
      const encontrados = await Usuario.query().whereIn('id', unicos).where('estado', true)
      if (encontrados.length !== unicos.length) {
        throw new Exception('Hay un usuario que no existe o está inactivo', {
          status: 422,
          code: 'E_VALIDATION_ERROR',
        })
      }
    }

    try {
      await sede.related('usuarios').sync(unicos)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudieron asignar los usuarios')
    }

    return this.show(sede.id, usuarioId)
  }

  private asignar(
    sede: Sede,
    campo:
      | 'direccion'
      | 'telefono'
      | 'correo'
      | 'responsableNombre'
      | 'responsableCargo'
      | 'responsableCorreo'
      | 'responsableTelefono',
    valor: Texto
  ) {
    if (valor === undefined) return
    sede[campo] = limpiar(valor) ?? null
  }

  private async assertOrganizacion(id: number) {
    const organizacion = await Organizacion.find(id)
    if (!organizacion) {
      throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return organizacion
  }

  private async assertOrganizacionActiva(id: number) {
    const organizacion = await this.assertOrganizacion(id)
    if (!organizacion.estado) {
      throw new Exception('La organización está inactiva', { status: 409, code: 'E_CONFLICT' })
    }
  }

  private async assertNombreLibre(organizacionId: number, nombre: string, exceptoId?: number) {
    const consulta = Sede.query()
      .where('organizacionId', organizacionId)
      .whereRaw('lower(nombre) = lower(?)', [nombre])

    if (exceptoId) consulta.whereNot('id', exceptoId)

    if (await consulta.first()) {
      throw new Exception('Ya existe una sede con ese nombre en esta organización', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }

  private async assertCodigoLibre(
    organizacionId: number,
    codigo: string | null,
    exceptoId?: number
  ) {
    if (!codigo) return

    const consulta = Sede.query()
      .where('organizacionId', organizacionId)
      .whereRaw('lower(codigo) = lower(?)', [codigo])

    if (exceptoId) consulta.whereNot('id', exceptoId)

    if (await consulta.first()) {
      throw new Exception('Ya existe una sede con ese código en esta organización', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }
}
