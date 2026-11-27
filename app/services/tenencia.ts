import Actividad from '#models/actividad'
import Organizacion from '#models/organizacion'
import Proceso from '#models/proceso'
import Sede from '#models/sede'
import Usuario from '#models/usuario'
import { Exception } from '@adonisjs/core/exceptions'

export const ROL_GENERAL = 'ADMINISTRADOR'
export const ROL_CENTRO = 'ADMIN_CENTRO'

export type Alcance = {
  usuarioId: number
  centroId: number | null
  general: boolean
  adminCentro: boolean
}

export function esAdministradorGeneral(alcance: Alcance) {
  return alcance.general && alcance.centroId === null
}

export async function alcanceDe(usuarioId: number): Promise<Alcance> {
  const usuario = await Usuario.query()
    .where('id', usuarioId)
    .preload('roles', (roles) => {
      roles.where('estado', true)
    })
    .first()

  if (!usuario) {
    throw new Exception('No autenticado', { status: 401, code: 'E_UNAUTHORIZED' })
  }

  const nombres = new Set(usuario.roles.map((rol) => rol.nombre))
  const general = nombres.has(ROL_GENERAL)

  return {
    usuarioId: usuario.id,
    centroId: usuario.centroId,
    general,
    adminCentro: !general && nombres.has(ROL_CENTRO),
  }
}

function esDueno(duenoId: number | null, alcance: Alcance) {
  if (esAdministradorGeneral(alcance)) return true
  return duenoId !== null && duenoId === alcance.usuarioId
}

export async function organizacionVisible(id: number, alcance: Alcance) {
  const organizacion = await Organizacion.find(id)
  if (!organizacion || !esDueno(organizacion.usuarioId, alcance)) {
    throw new Exception('La organización no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  return organizacion
}

export async function sedeVisible(id: number, alcance: Alcance) {
  const sede = await Sede.find(id)
  if (!sede) {
    throw new Exception('La sede no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  const organizacion = await Organizacion.find(sede.organizacionId)
  if (!organizacion || !esDueno(organizacion.usuarioId, alcance)) {
    throw new Exception('La sede no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  return sede
}

export async function procesoVisible(id: number, alcance: Alcance) {
  const proceso = await Proceso.find(id)
  if (!proceso) {
    throw new Exception('El proceso no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  const sede = await Sede.find(proceso.sedeId)
  if (!sede) {
    throw new Exception('El proceso no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  const organizacion = await Organizacion.find(sede.organizacionId)
  if (!organizacion || !esDueno(organizacion.usuarioId, alcance)) {
    throw new Exception('El proceso no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  return proceso
}

export async function actividadVisible(id: number, alcance: Alcance) {
  const actividad = await Actividad.find(id)
  if (!actividad) {
    throw new Exception('La actividad no existe', { status: 404, code: 'E_NOT_FOUND' })
  }
  try {
    await procesoVisible(actividad.procesoId, alcance)
  } catch (error) {
    if (error instanceof Exception && error.status === 404) {
      throw new Exception('La actividad no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    throw error
  }
  return actividad
}
