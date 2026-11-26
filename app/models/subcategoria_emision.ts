import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ActividadEmision from '#models/actividad_emision'

export default class SubcategoriaEmision extends BaseModel {
  static table = 'subcategoria_emision'

  @column({ isPrimary: true, columnName: 'id_subcategoria' })
  declare id: number

  @column({ columnName: 'id_actividad_emision' })
  declare actividadEmisionId: number

  @column()
  declare codigo: string | null

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @belongsTo(() => ActividadEmision, { foreignKey: 'actividadEmisionId' })
  declare actividadEmision: BelongsTo<typeof ActividadEmision>
}
