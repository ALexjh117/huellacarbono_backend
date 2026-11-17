import { BaseModel, column } from '@adonisjs/lucid/orm'

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

  /**
   * factor_base es DECIMAL(24, 12). PostgreSQL lo devuelve como texto para
   * no perder precisión, por lo que se conserva como string.
   */
  @column({ columnName: 'factor_base' })
  declare factorBase: string

  @column()
  declare estado: boolean
}
