import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import ActividadEmision from '#models/actividad_emision'

/**
 * La tabla la consultan los factores de emisión.
 * El CRUD de fuentes de emisión vive en otro módulo.
 */
export default class FuenteEmision extends BaseModel {
  static table = 'fuente_emision'

  @column({ isPrimary: true, columnName: 'id_fuente_emision' })
  declare id: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare categoria: string | null

  @column()
  declare descripcion: string | null

  @column()
  declare estado: boolean

  /** Legacy direct classification retained while the pivot is canonical for new code. */
  @column({ columnName: 'id_actividad_emision' })
  declare actividadEmisionDirectaId: number | null

  /** Legacy direct classification retained while the pivot is canonical for new code. */
  @column({ columnName: 'id_subcategoria_emision' })
  declare subcategoriaEmisionDirectaId: number | null

  @manyToMany(() => ActividadEmision, {
    pivotTable: 'actividad_emision_fuente',
    pivotForeignKey: 'id_fuente_emision',
    pivotRelatedForeignKey: 'id_actividad_emision',
    pivotColumns: ['id_subcategoria_emision', 'observacion'],
  })
  declare actividadesEmision: ManyToMany<typeof ActividadEmision>
}
