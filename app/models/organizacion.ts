import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

/**
 * Empresa u organización medida por la plataforma.
 *
 * En el módulo de datos de actividad cumple el rol de «proyecto»: no existe
 * una tabla `proyecto` en el esquema y el selector de contexto de la
 * plataforma apunta a esta misma entidad. Toda validación de pertenencia
 * resuelve contra `id_organizacion`.
 */
export default class Organizacion extends BaseModel {
  static table = 'organizacion'

  @column({ isPrimary: true, columnName: 'id_organizacion' })
  declare id: number

  @column({ columnName: 'id_municipio' })
  declare idMunicipio: number

  @column()
  declare direccion: string | null

  @column()
  declare nombre: string

  @column({ columnName: 'nombre_corto' })
  declare nombreCorto: string | null

  @column()
  declare nit: string

  @column()
  declare tipo: string

  @column({ columnName: 'sector_economico' })
  declare sectorEconomico: string | null

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime
}
