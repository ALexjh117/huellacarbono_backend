import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Proceso from '#models/proceso'

/**
 * Actividad medida (ej. «Caldera»). Cuelga de un proceso y, por la cadena
 * proceso → sede → organizacion, pertenece a un proyecto concreto: los
 * datos de actividad solo aceptan actividades de ese proyecto.
 */
export default class Actividad extends BaseModel {
  static table = 'actividad'

  @column({ isPrimary: true, columnName: 'id_actividad' })
  declare id: number

  @column({ columnName: 'id_proceso' })
  declare idProceso: number

  @column()
  declare nombre: string

  @column()
  declare descripcion: string | null

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'fecha_creacion' })
  declare fechaCreacion: DateTime

  @belongsTo(() => Proceso, { foreignKey: 'idProceso' })
  declare proceso: BelongsTo<typeof Proceso>
}
