import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * La tabla la consulta factores y parámetros.
 * El CRUD de unidades de medida vive en otro módulo.
 */
export default class UnidadMedida extends BaseModel {
  static table = 'unidad_medida'

  @column({ isPrimary: true, columnName: 'id_unidad' })
  declare id: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare simbolo: string

  @column()
  declare magnitud: string

  @column({ columnName: 'factor_base' })
  declare factorBase: string

  @column()
  declare estado: boolean
}
