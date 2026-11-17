import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export type UsoCatalogo = {
  tabla: string
  columna: string
  excluirRechazados?: boolean
  soloActivos?: boolean
}

export function normalizarCodigo(valor: string) {
  return valor.trim().toUpperCase()
}

export function limpiar(valor: string | null | undefined) {
  if (valor === undefined) return undefined
  if (valor === null) return null
  const texto = valor.trim()
  return texto.length ? texto : null
}

export function aFecha(valor: string) {
  const fecha = DateTime.fromISO(valor, { zone: 'utc' }).startOf('day')
  if (!fecha.isValid) {
    throw new Exception('Usa una fecha válida con el formato AAAA-MM-DD', {
      status: 422,
      code: 'E_VALIDATION',
    })
  }
  return fecha
}

export function decimalTexto(valor: string) {
  if (!valor.includes('.')) return valor
  const limpio = valor.replace(/0+$/, '').replace(/\.$/, '')
  return limpio.length ? limpio : '0'
}

export function fechaTexto(fecha: DateTime | null) {
  if (!fecha) return null
  return fecha.toFormat('yyyy-MM-dd')
}

export function assertVigencia(inicio: DateTime, fin: DateTime | null) {
  if (fin && fin < inicio) {
    throw new Exception('La fecha fin de vigencia no puede ser anterior a la fecha de inicio', {
      status: 422,
      code: 'E_VALIDATION',
    })
  }
}

export async function estaEnUso(id: number, usos: UsoCatalogo[]) {
  for (const uso of usos) {
    const consulta = db.from(uso.tabla).where(uso.columna, id)
    if (uso.excluirRechazados) consulta.whereNot('estado_registro', 'RECHAZADO')
    if (uso.soloActivos) consulta.where('estado', true)
    const total = await consulta.count('* as total')
    if (Number(total[0]?.total ?? 0) > 0) return true
  }
  return false
}

export async function exigirActivo(
  tabla: string,
  columnaId: string,
  id: number,
  noExiste: string,
  inactivo: string
) {
  const fila = await db.from(tabla).where(columnaId, id).first()
  if (!fila) throw new Exception(noExiste, { status: 404, code: 'E_NOT_FOUND' })
  if (!fila.estado) throw new Exception(inactivo, { status: 409, code: 'E_CONFLICT' })
}
