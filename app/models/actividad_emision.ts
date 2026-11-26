import { BaseModel, belongsTo, hasMany, manyToMany, column } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import AlcanceEmision from '#models/alcance_emision'
import SubcategoriaEmision from '#models/subcategoria_emision'
import FuenteEmision from '#models/fuente_emision'

export default class ActividadEmision extends BaseModel {
  static table = 'actividad_emision'

  @column({ isPrimary: true, columnName: 'id_actividad_emision' })
  declare id: number

  @column({ columnName: 'id_alcance' })
  declare alcanceId: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @belongsTo(() => AlcanceEmision, { foreignKey: 'alcanceId' })
  declare alcance: BelongsTo<typeof AlcanceEmision>

  @hasMany(() => SubcategoriaEmision, { foreignKey: 'actividadEmisionId' })
  declare subcategorias: HasMany<typeof SubcategoriaEmision>

  @manyToMany(() => FuenteEmision, {
    pivotTable: 'actividad_emision_fuente',
    pivotForeignKey: 'id_actividad_emision',
    pivotRelatedForeignKey: 'id_fuente_emision',
    pivotColumns: ['id_subcategoria_emision', 'observacion'],
  })
  declare fuentes: ManyToMany<typeof FuenteEmision>
}
