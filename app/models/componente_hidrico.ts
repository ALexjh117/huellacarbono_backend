import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ComponenteHidrico extends BaseModel {
  static table = 'componente_hidrico'

  @column({ isPrimary: true, columnName: 'id_componente_hidrico' })
  declare id: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare descripcion: string | null

  @column()
  declare estado: boolean
}
