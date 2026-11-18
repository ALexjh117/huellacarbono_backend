import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Actividad from '#models/actividad'
import AlcanceEmision from '#models/alcance_emision'
import FuenteEmision from '#models/fuente_emision'
import PeriodoMedicion from '#models/periodo_medicion'
import UnidadMedida from '#models/unidad_medida'
import Usuario from '#models/usuario'

/**
 * Registro de dato de actividad.
 *
 * Guarda la cantidad tal como aparece en el documento original (ej. 4000 kWh)
 * junto con la actividad, el periodo, la fuente, el alcance y la unidad: no
 * almacena factor de emisión ni resultado CO2e, cálculo que pertenece a
 * `calculo_carbono`.
 *
 * El «proyecto» no tiene columna propia: se deriva de la actividad
 * (actividad → proceso → sede → organizacion) y del periodo
 * (periodo → organizacion), y la API valida que ambos apunten al mismo.
 *
 * `fuente_dato` almacena el «Documento» (evidencia de la que se copió la
 * cantidad) y `que_se_copia` el tipo de dato o documento del que se obtuvo.
 */
export default class DatoActividadCarbono extends BaseModel {
  static table = 'dato_actividad_carbono'

  @column({ isPrimary: true, columnName: 'id_dato_carbono' })
  declare id: number

  @column({ columnName: 'id_actividad' })
  declare idActividad: number

  @column({ columnName: 'id_periodo' })
  declare idPeriodo: number

  @column({ columnName: 'id_fuente_emision' })
  declare idFuenteEmision: number

  @column({ columnName: 'id_alcance' })
  declare idAlcance: number

  @column({ columnName: 'id_unidad' })
  declare idUnidad: number

  @column({ columnName: 'id_usuario_registro' })
  declare idUsuarioRegistro: number

  /** DECIMAL(24, 8): siempre cadena para conservar la precisión original. */
  @column()
  declare cantidad: string

  @column.date({ columnName: 'fecha_dato' })
  declare fechaDato: DateTime | null

  /** «Documento»: evidencia de la que se copió la cantidad. */
  @column({ columnName: 'fuente_dato' })
  declare fuenteDato: string | null

  /** «Qué se copia»: tipo de dato o documento del que se obtuvo la cantidad. */
  @column({ columnName: 'que_se_copia' })
  declare queSeCopia: string | null

  @column()
  declare observacion: string | null

  @column({ columnName: 'estado_registro' })
  declare estadoRegistro: string

  @column.dateTime({ columnName: 'fecha_registro' })
  declare fechaRegistro: DateTime

  @column.dateTime({ columnName: 'fecha_actualizacion' })
  declare fechaActualizacion: DateTime

  @belongsTo(() => Actividad, { foreignKey: 'idActividad' })
  declare actividad: BelongsTo<typeof Actividad>

  @belongsTo(() => PeriodoMedicion, { foreignKey: 'idPeriodo' })
  declare periodo: BelongsTo<typeof PeriodoMedicion>

  @belongsTo(() => FuenteEmision, { foreignKey: 'idFuenteEmision' })
  declare fuenteEmision: BelongsTo<typeof FuenteEmision>

  @belongsTo(() => AlcanceEmision, { foreignKey: 'idAlcance' })
  declare alcance: BelongsTo<typeof AlcanceEmision>

  @belongsTo(() => UnidadMedida, { foreignKey: 'idUnidad' })
  declare unidadMedida: BelongsTo<typeof UnidadMedida>

  @belongsTo(() => Usuario, { foreignKey: 'idUsuarioRegistro' })
  declare usuario: BelongsTo<typeof Usuario>
}
