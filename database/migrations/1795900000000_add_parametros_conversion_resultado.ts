import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Conserva en cada resultado los parámetros físicos con los que se convirtió
 * la cantidad, para que la evidencia del cálculo no dependa del dato de
 * actividad (que puede editarse después).
 *
 * Sólo agrega columnas NULL: los resultados históricos quedan intactos y con
 * estas columnas vacías, porque en su momento no se registraron parámetros.
 */
const NEW_COLUMNS = [
  'densidad_valor',
  'id_unidad_densidad',
  'poder_calorifico_valor',
  'id_unidad_poder_calorifico',
  'parametros_calculo',
]
const CONSTRAINTS = [
  'resultado_carbono_densidad_valor_check',
  'resultado_carbono_densidad_par_check',
  'resultado_carbono_poder_calorifico_valor_check',
  'resultado_carbono_poder_calorifico_par_check',
  'resultado_carbono_parametros_objeto_check',
  'resultado_carbono_unidad_densidad_fk',
  'resultado_carbono_unidad_poder_calorifico_fk',
]

export default class extends BaseSchema {
  async up() {
    const required = [
      ['resultado_carbono', 'id_resultado_carbono', 'bigint'],
      ['unidad_medida', 'id_unidad', 'integer'],
    ]
    const columns = await this.db.rawQuery(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND (table_name, column_name) IN (${required
          .map(([table, column]) => `('${table}', '${column}')`)
          .join(',')})
    `)
    const actual = new Map(
      (columns.rows as { table_name: string; column_name: string; data_type: string }[]).map(
        (column) => [`${column.table_name}.${column.column_name}`, column.data_type]
      )
    )
    const missing = required.filter(
      ([table, column, type]) => actual.get(`${table}.${column}`) !== type
    )
    if (missing.length) {
      throw new Error(
        `Columnas base ausentes o incompatibles: ${missing
          .map(([table, column, type]) => `${table}.${column} (${type})`)
          .join(', ')}`
      )
    }

    const collision = await this.db.rawQuery(
      `
      SELECT column_name AS name FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'resultado_carbono'
        AND column_name = ANY(?)
      UNION ALL
      SELECT conname AS name FROM pg_constraint
      WHERE conrelid = 'resultado_carbono'::regclass AND conname = ANY(?)
      `,
      [NEW_COLUMNS, CONSTRAINTS]
    )
    if (collision.rows.length) {
      throw new Error(
        `La trazabilidad de parámetros ya existe parcialmente: ${collision.rows
          .map((row: { name: string }) => row.name)
          .join(', ')}`
      )
    }

    await this.db.rawQuery(`
      ALTER TABLE resultado_carbono
        ADD COLUMN densidad_valor NUMERIC(24, 12),
        ADD COLUMN id_unidad_densidad INTEGER,
        ADD COLUMN poder_calorifico_valor NUMERIC(24, 12),
        ADD COLUMN id_unidad_poder_calorifico INTEGER,
        ADD COLUMN parametros_calculo JSONB,
        ADD CONSTRAINT resultado_carbono_densidad_valor_check
          CHECK (densidad_valor IS NULL OR densidad_valor > 0),
        ADD CONSTRAINT resultado_carbono_densidad_par_check
          CHECK ((densidad_valor IS NULL) = (id_unidad_densidad IS NULL)),
        ADD CONSTRAINT resultado_carbono_poder_calorifico_valor_check
          CHECK (poder_calorifico_valor IS NULL OR poder_calorifico_valor > 0),
        ADD CONSTRAINT resultado_carbono_poder_calorifico_par_check
          CHECK ((poder_calorifico_valor IS NULL) = (id_unidad_poder_calorifico IS NULL)),
        ADD CONSTRAINT resultado_carbono_parametros_objeto_check
          CHECK (parametros_calculo IS NULL OR jsonb_typeof(parametros_calculo) = 'object'),
        ADD CONSTRAINT resultado_carbono_unidad_densidad_fk
          FOREIGN KEY (id_unidad_densidad) REFERENCES unidad_medida (id_unidad) ON DELETE RESTRICT,
        ADD CONSTRAINT resultado_carbono_unidad_poder_calorifico_fk
          FOREIGN KEY (id_unidad_poder_calorifico) REFERENCES unidad_medida (id_unidad) ON DELETE RESTRICT
    `)
  }

  async down() {
    const datos = await this.db.rawQuery(`
      SELECT COUNT(*)::int AS total FROM resultado_carbono
      WHERE densidad_valor IS NOT NULL
         OR poder_calorifico_valor IS NOT NULL
         OR parametros_calculo IS NOT NULL
    `)
    if (Number(datos.rows[0]?.total ?? 0) > 0) {
      throw new Error(
        'No se puede revertir: hay resultados con parámetros de conversión registrados.'
      )
    }
    await this.db.rawQuery(`
      ALTER TABLE resultado_carbono
        ${CONSTRAINTS.map((name) => `DROP CONSTRAINT IF EXISTS ${name}`).join(',\n        ')},
        ${NEW_COLUMNS.map((name) => `DROP COLUMN IF EXISTS ${name}`).join(',\n        ')}
    `)
  }
}
