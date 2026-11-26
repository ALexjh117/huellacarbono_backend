import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * El metro cúbico estándar de gas ya estaba cargado con magnitud propia.
 * Su factor base es 1000 L, el mismo del metro cúbico: 1 m³st = 1 m³.
 * Con otra magnitud el motor rechazaba la conversión de los factores de gas.
 *
 * Sólo reclasifica esa fila. No cambia el factor ni crea unidades.
 */
export default class extends BaseSchema {
  async up() {
    await this.db.rawQuery(`
      UPDATE unidad_medida
         SET magnitud = 'Volumen'
       WHERE codigo = 'UM-M3ST'
         AND simbolo = 'm³st'
         AND factor_base = 1000
         AND magnitud = 'Volumen estándar de gas'
    `)
  }

  async down() {
    await this.db.rawQuery(`
      UPDATE unidad_medida
         SET magnitud = 'Volumen estándar de gas'
       WHERE codigo = 'UM-M3ST'
         AND simbolo = 'm³st'
         AND factor_base = 1000
         AND magnitud = 'Volumen'
    `)
  }
}
