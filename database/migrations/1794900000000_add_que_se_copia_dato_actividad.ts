import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * «Qué se copia» del módulo de datos de actividad.
 *
 * La tabla `dato_actividad_carbono` ya existía con `fuente_dato` (el
 * «Documento», evidencia de la que se copió la cantidad) y `observacion`,
 * pero no tenía un campo para el tipo de dato o documento del que se obtuvo
 * el valor. Se agrega como columna nullable para no alterar filas existentes;
 * la API la exige al crear un registro nuevo.
 */
export default class extends BaseSchema {
  async up() {
    await this.schema.raw(`
      ALTER TABLE dato_actividad_carbono
        ADD COLUMN IF NOT EXISTS que_se_copia VARCHAR(255)
    `)
  }

  async down() {
    await this.schema.raw(`
      ALTER TABLE dato_actividad_carbono
        DROP COLUMN IF EXISTS que_se_copia
    `)
  }
}
