import { BaseSchema } from '@adonisjs/lucid/schema'

const OBJECT_NAMES = [
  'metodologia_version_referencia_documental_check',
  'factor_emision_anio_aplicacion_check',
  'factor_emision_aprobado_trazabilidad_check',
]

export default class extends BaseSchema {
  async up() {
    const requiredColumns = [
      ['metodologia_version', 'id_version', 'bigint'],
      ['metodologia_version', 'fecha_inicio_vigencia', 'date'],
      ['factor_emision', 'id_factor_emision', 'bigint'],
      ['factor_emision', 'estado_aprobacion', 'character varying'],
      ['factor_emision', 'fuente', 'character varying'],
      ['factor_emision', 'institucion_responsable', 'character varying'],
      ['factor_emision', 'anio_publicacion', 'smallint'],
      ['factor_emision', 'anio_aplicacion', 'integer'],
      ['resultado_carbono', 'id_resultado_carbono', 'bigint'],
      ['resultado_carbono', 'id_factor_emision', 'bigint'],
    ]
    const columns = await this.db.rawQuery(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND (table_name, column_name) IN (${requiredColumns
          .map(([table, column]) => `('${table}', '${column}')`)
          .join(',')})
    `)
    const actualColumns = new Map(
      (columns.rows as { table_name: string; column_name: string; data_type: string }[]).map(
        (column) => [`${column.table_name}.${column.column_name}`, column.data_type]
      )
    )
    const incompatible = requiredColumns.filter(
      ([table, column, type]) => actualColumns.get(`${table}.${column}`) !== type
    )
    if (incompatible.length) {
      throw new Error(
        `Columnas base ausentes o incompatibles para la trazabilidad documental: ${incompatible
          .map(([table, column, type]) => `${table}.${column} (${type})`)
          .join(', ')}`
      )
    }

    const collision = await this.db.rawQuery(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'metodologia_version'
        AND column_name = 'referencia_documental'
      UNION ALL
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'resultado_carbono'
        AND column_name = ANY(ARRAY[
          'factor_anio_aplicacion',
          'factor_anio_publicacion',
          'factor_institucion_responsable',
          'factor_origen'
        ])
      UNION ALL
      SELECT 1 FROM pg_constraint
      WHERE connamespace = current_schema()::regnamespace
        AND conname = ANY(ARRAY[${OBJECT_NAMES.map((name) => `'${name}'`).join(',')}])
      LIMIT 1
    `)
    if (collision.rows.length) {
      throw new Error(
        'Ya existe referencia_documental o su restricción con una estructura que debe inspeccionarse.'
      )
    }

    const invalid = await this.db.rawQuery(`
      SELECT id_factor_emision FROM factor_emision
      WHERE (anio_aplicacion IS NOT NULL AND anio_aplicacion NOT BETWEEN 1800 AND 2200)
         OR (estado_aprobacion = 'APROBADO' AND (
           fuente IS NULL OR btrim(fuente) = '' OR
           institucion_responsable IS NULL OR btrim(institucion_responsable) = '' OR
           anio_publicacion IS NULL OR anio_aplicacion IS NULL
         ))
      LIMIT 1
    `)
    if (invalid.rows.length) {
      throw new Error(
        'Hay factores con año de aplicación inválido o factores aprobados sin trazabilidad bibliográfica completa.'
      )
    }

    await this.db.rawQuery(`
      ALTER TABLE metodologia_version
        ADD COLUMN referencia_documental TEXT,
        ADD CONSTRAINT metodologia_version_referencia_documental_check
          CHECK (referencia_documental IS NULL OR btrim(referencia_documental) <> '')
    `)
    await this.db.rawQuery(`
      ALTER TABLE factor_emision
        ADD CONSTRAINT factor_emision_anio_aplicacion_check
          CHECK (anio_aplicacion IS NULL OR anio_aplicacion BETWEEN 1800 AND 2200),
        ADD CONSTRAINT factor_emision_aprobado_trazabilidad_check
          CHECK (estado_aprobacion <> 'APROBADO' OR (
            fuente IS NOT NULL AND btrim(fuente) <> '' AND
            institucion_responsable IS NOT NULL AND btrim(institucion_responsable) <> '' AND
            anio_publicacion IS NOT NULL AND anio_aplicacion IS NOT NULL
          ))
    `)
    await this.db.rawQuery(`
      ALTER TABLE resultado_carbono
        ADD COLUMN factor_anio_aplicacion INTEGER,
        ADD COLUMN factor_anio_publicacion SMALLINT,
        ADD COLUMN factor_institucion_responsable VARCHAR(200),
        ADD COLUMN factor_origen VARCHAR(50)
    `)
  }

  async down() {
    const datos = await this.db.rawQuery(`
      SELECT (
        (SELECT COUNT(*) FROM metodologia_version WHERE referencia_documental IS NOT NULL) +
        (SELECT COUNT(*) FROM resultado_carbono WHERE factor_anio_aplicacion IS NOT NULL
          OR factor_anio_publicacion IS NOT NULL OR factor_institucion_responsable IS NOT NULL
          OR factor_origen IS NOT NULL)
      )::int AS total
    `)
    if (Number(datos.rows[0]?.total ?? 0) > 0) {
      throw new Error(
        'No se puede revertir: hay versiones metodológicas con referencias documentales registradas.'
      )
    }
    await this.db.rawQuery(`
      ALTER TABLE resultado_carbono
        DROP COLUMN factor_origen,
        DROP COLUMN factor_institucion_responsable,
        DROP COLUMN factor_anio_publicacion,
        DROP COLUMN factor_anio_aplicacion
    `)
    await this.db.rawQuery(`
      ALTER TABLE factor_emision
        DROP CONSTRAINT factor_emision_aprobado_trazabilidad_check,
        DROP CONSTRAINT factor_emision_anio_aplicacion_check
    `)
    await this.db.rawQuery(`
      ALTER TABLE metodologia_version
        DROP CONSTRAINT metodologia_version_referencia_documental_check,
        DROP COLUMN referencia_documental
    `)
  }
}
