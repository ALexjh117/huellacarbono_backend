import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(
      'ALTER TABLE organizacion DROP CONSTRAINT IF EXISTS organizacion_id_municipio_nombre_unique'
    )
    this.schema.raw('DROP INDEX IF EXISTS uq_organizacion_nombre_corto')
    this.schema.raw(`
      CREATE UNIQUE INDEX uq_organizacion_dueno_nombre
        ON organizacion (id_usuario, id_municipio, lower(nombre))
    `)
    this.schema.raw(`
      CREATE UNIQUE INDEX uq_organizacion_dueno_corto
        ON organizacion (id_usuario, id_municipio, lower(nombre_corto))
        WHERE nombre_corto IS NOT NULL
    `)
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS uq_organizacion_dueno_nombre')
    this.schema.raw('DROP INDEX IF EXISTS uq_organizacion_dueno_corto')
    this.schema.raw(`
      ALTER TABLE organizacion
        ADD CONSTRAINT organizacion_id_municipio_nombre_unique UNIQUE (id_municipio, nombre)
    `)
    this.schema.raw(`
      CREATE UNIQUE INDEX uq_organizacion_nombre_corto
        ON organizacion (id_municipio, nombre_corto)
        WHERE nombre_corto IS NOT NULL
    `)
  }
}
