import Municipio from '#models/municipio'
import Organizacion from '#models/organizacion'
import Sede from '#models/sede'
import { rethrowDatabaseError } from '#services/database_error'
import { Exception } from '@adonisjs/core/exceptions'

type Texto = string | null | undefined

export type OrganizacionPayload = {
  municipioId?: number
  nombre?: string
  nombreCorto?: Texto
  nit?: string
  tipo?: string
  sectorEconomico?: Texto
  correo?: Texto
  telefono?: Texto
  direccion?: Texto
  representanteNombre?: Texto
  representanteTipoDocumento?: Texto
  representanteNumeroDocumento?: Texto
  representanteCorreo?: Texto
  representanteTelefono?: Texto
  active?: boolean
}

type ListQuery = {
  page: number
  perPage: number
  includeInactive: boolean
  departamentoId?: number
  municipioId?: number
  q?: string
}

function limpiar(valor: Texto): string | null | undefined {
  if (valor === undefined) return undefined
  if (valor === null) return null
  const texto = valor.trim()
  return texto.length ? texto : null
}

function patron(valor: string) {
  return `%${valor.replace(/[%_\\]/g, '')}%`
}

export default class OrganizacionService {
  async list(query: ListQuery) {
    const organizaciones = Organizacion.query()
      .preload('municipio', (municipio) => municipio.preload('departamento'))
      .withCount('sedes', (sedes) => {
        sedes.where('estado', true)
      })
      .orderBy('nombre', 'asc')

    if (!query.includeInactive) {
      organizaciones.where('estado', true)
    }
    if (query.municipioId) {
      organizaciones.where('municipioId', query.municipioId)
    }
    if (query.departamentoId) {
      organizaciones.whereHas('municipio', (municipio) => {
        municipio.where('departamentoId', query.departamentoId!)
      })
    }
    if (query.q) {
      const busqueda = patron(query.q)
      organizaciones.where((filtro) => {
        filtro
          .whereILike('nombre', busqueda)
          .orWhereILike('nombreCorto', busqueda)
          .orWhereILike('nit', busqueda)
      })
    }

    return organizaciones.paginate(query.page, query.perPage)
  }

  async show(id: number) {
    const organizacion = await Organizacion.query()
      .where('id', id)
      .preload('municipio', (municipio) => municipio.preload('departamento'))
      .withCount('sedes', (sedes) => {
        sedes.where('estado', true)
      })
      .first()

    if (!organizacion) {
      throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    return organizacion
  }

  async create(payload: OrganizacionPayload) {
    const municipioId = payload.municipioId!
    const nombre = payload.nombre!.trim()
    const nombreCorto = limpiar(payload.nombreCorto) ?? null

    await this.assertMunicipioActivo(municipioId)
    await this.assertNombreLibre(municipioId, nombre)
    await this.assertCortoLibre(municipioId, nombreCorto)

    try {
      const organizacion = await Organizacion.create({
        municipioId,
        nombre,
        nombreCorto,
        nit: payload.nit!.trim(),
        tipo: payload.tipo!,
        sectorEconomico: limpiar(payload.sectorEconomico) ?? null,
        correo: limpiar(payload.correo) ?? null,
        telefono: limpiar(payload.telefono) ?? null,
        direccion: limpiar(payload.direccion) ?? null,
        representanteNombre: limpiar(payload.representanteNombre) ?? null,
        representanteTipoDocumento: limpiar(payload.representanteTipoDocumento) ?? null,
        representanteNumeroDocumento: limpiar(payload.representanteNumeroDocumento) ?? null,
        representanteCorreo: limpiar(payload.representanteCorreo) ?? null,
        representanteTelefono: limpiar(payload.representanteTelefono) ?? null,
        estado: true,
      })
      return await this.show(organizacion.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la organización')
    }
  }

  async update(id: number, payload: OrganizacionPayload) {
    const organizacion = await Organizacion.find(id)
    if (!organizacion) {
      throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    if (payload.active === false && !organizacion.estado) {
      throw new Exception('La organización ya está inactiva', { status: 409, code: 'E_CONFLICT' })
    }

    if (payload.active === false) {
      const sedesActivas = await Sede.query()
        .where('organizacionId', organizacion.id)
        .where('estado', true)
        .first()
      if (sedesActivas) {
        throw new Exception('Desactiva primero las sedes de esta organización', {
          status: 409,
          code: 'E_CONFLICT',
        })
      }
    }

    const municipioId = payload.municipioId ?? organizacion.municipioId
    const nombre = payload.nombre?.trim() ?? organizacion.nombre
    const nombreCorto =
      payload.nombreCorto !== undefined ? (limpiar(payload.nombreCorto) ?? null) : organizacion.nombreCorto

    if (payload.municipioId !== undefined) {
      await this.assertMunicipioActivo(municipioId)
    }
    if (payload.nombre !== undefined || payload.municipioId !== undefined) {
      await this.assertNombreLibre(municipioId, nombre, organizacion.id)
    }
    if (payload.nombreCorto !== undefined || payload.municipioId !== undefined) {
      await this.assertCortoLibre(municipioId, nombreCorto, organizacion.id)
    }

    if (payload.municipioId !== undefined) organizacion.municipioId = municipioId
    if (payload.nombre !== undefined) organizacion.nombre = nombre
    if (payload.nombreCorto !== undefined) organizacion.nombreCorto = nombreCorto
    if (payload.nit !== undefined) organizacion.nit = payload.nit.trim()
    if (payload.tipo !== undefined) organizacion.tipo = payload.tipo
    this.asignar(organizacion, 'sectorEconomico', payload.sectorEconomico)
    this.asignar(organizacion, 'correo', payload.correo)
    this.asignar(organizacion, 'telefono', payload.telefono)
    this.asignar(organizacion, 'direccion', payload.direccion)
    this.asignar(organizacion, 'representanteNombre', payload.representanteNombre)
    this.asignar(organizacion, 'representanteTipoDocumento', payload.representanteTipoDocumento)
    this.asignar(organizacion, 'representanteNumeroDocumento', payload.representanteNumeroDocumento)
    this.asignar(organizacion, 'representanteCorreo', payload.representanteCorreo)
    this.asignar(organizacion, 'representanteTelefono', payload.representanteTelefono)
    if (payload.active !== undefined) organizacion.estado = payload.active

    try {
      await organizacion.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la organización')
    }

    return this.show(organizacion.id)
  }

  private asignar(
    organizacion: Organizacion,
    campo:
      | 'sectorEconomico'
      | 'correo'
      | 'telefono'
      | 'direccion'
      | 'representanteNombre'
      | 'representanteTipoDocumento'
      | 'representanteNumeroDocumento'
      | 'representanteCorreo'
      | 'representanteTelefono',
    valor: Texto
  ) {
    if (valor === undefined) return
    organizacion[campo] = limpiar(valor) ?? null
  }

  private async assertMunicipioActivo(municipioId: number) {
    const municipio = await Municipio.query()
      .where('id', municipioId)
      .where('estado', true)
      .preload('departamento')
      .first()

    if (!municipio || !municipio.departamento?.estado) {
      throw new Exception('El municipio no existe o está inactivo', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }
  }

  private async assertNombreLibre(municipioId: number, nombre: string, exceptoId?: number) {
    const consulta = Organizacion.query()
      .where('municipioId', municipioId)
      .whereRaw('lower(nombre) = lower(?)', [nombre])

    if (exceptoId) consulta.whereNot('id', exceptoId)

    if (await consulta.first()) {
      throw new Exception('Ya existe una organización con ese nombre en este municipio', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }

  private async assertCortoLibre(
    municipioId: number,
    nombreCorto: string | null,
    exceptoId?: number
  ) {
    if (!nombreCorto) return

    const consulta = Organizacion.query()
      .where('municipioId', municipioId)
      .whereRaw('lower(nombre_corto) = lower(?)', [nombreCorto])

    if (exceptoId) consulta.whereNot('id', exceptoId)

    if (await consulta.first()) {
      throw new Exception('Ya existe una organización con ese nombre corto en este municipio', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }
}
