import { BaseSchema } from '@adonisjs/lucid/schema'

const OBJECT_NAMES = [
  'gwp_set',
  'gwp_value',
  'factor_emision_approved_overlap',
  'resultado_carbono_dato_factor_gas_unique',
  'calculo_carbono_hash_unique',
  'factor_emision_aprobado_vigencia_idx',
  'factor_emision_estado_aprobacion_check',
  'factor_emision_anio_publicacion_check',
  'factor_emision_gas_especifico_check',
  'dato_actividad_parametros_objeto_check',
  'resultado_carbono_gas_check',
  'resultado_carbono_gwp_snapshot_check',
  'validar_vigencia_factor_emision',
]

export default class extends BaseSchema {
  async up() {
    const collisions = await this.db.rawQuery(`
      SELECT name FROM unnest(ARRAY[${OBJECT_NAMES.map((name) => `'${name}'`).join(',')}]) name
      WHERE to_regclass(format('%I.%I', current_schema(), name)) IS NOT NULL
         OR EXISTS (
           SELECT 1 FROM pg_constraint WHERE connamespace = current_schema()::regnamespace AND conname = name
         )
         OR EXISTS (
           SELECT 1 FROM pg_trigger WHERE NOT tgisinternal AND tgname = name
         )
         OR EXISTS (
           SELECT 1 FROM pg_proc p
           JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = current_schema() AND p.proname = name
         )
    `)
    if (collisions.rows.length) {
      const names = collisions.rows as { name: string }[]
      throw new Error(
        `Objetos existentes incompatibles con la migración: ${names.map((row) => row.name).join(', ')}`
      )
    }

    const requiredTables = [
      'factor_emision',
      'metodologia_version',
      'resultado_carbono',
      'calculo_carbono',
      'dato_actividad_carbono',
      'unidad_medida',
    ]
    const tableRows = await this.db.rawQuery(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = current_schema() AND table_name = ANY(ARRAY[${requiredTables.map((name) => `'${name}'`).join(',')}])
    `)
    const found = new Set((tableRows.rows as { table_name: string }[]).map((row) => row.table_name))
    const missing = requiredTables.filter((name) => !found.has(name))
    if (missing.length)
      throw new Error(`Faltan tablas requeridas para extender el cálculo: ${missing.join(', ')}`)

    const requiredColumns = [
      ['factor_emision', 'id_factor_emision', 'bigint'],
      ['factor_emision', 'id_version', 'bigint'],
      ['factor_emision', 'id_fuente_emision', 'bigint'],
      ['factor_emision', 'id_unidad_entrada', 'integer'],
      ['factor_emision', 'id_unidad_salida', 'integer'],
      ['factor_emision', 'gas', 'character varying'],
      ['factor_emision', 'region', 'character varying'],
      ['factor_emision', 'fecha_inicio_vigencia', 'date'],
      ['factor_emision', 'fecha_fin_vigencia', 'date'],
      ['metodologia_version', 'id_version', 'bigint'],
      ['dato_actividad_carbono', 'id_dato_carbono', 'bigint'],
      ['dato_actividad_carbono', 'id_unidad', 'integer'],
      ['calculo_carbono', 'id_calculo_carbono', 'bigint'],
      ['calculo_carbono', 'id_version', 'bigint'],
      ['resultado_carbono', 'id_calculo_carbono', 'bigint'],
      ['resultado_carbono', 'id_factor_emision', 'bigint'],
      ['resultado_carbono', 'id_regla_calculo', 'bigint'],
      ['resultado_carbono', 'id_unidad', 'integer'],
      ['unidad_medida', 'id_unidad', 'integer'],
    ] as const
    const contractRows = await this.db.rawQuery(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND (table_name, column_name) IN (
          ${requiredColumns.map(([table, column]) => `('${table}','${column}')`).join(',')}
        )
    `)
    const actualTypes = new Map(
      (contractRows.rows as { table_name: string; column_name: string; data_type: string }[]).map(
        (column) => [`${column.table_name}.${column.column_name}`, column.data_type]
      )
    )
    const invalidContract = requiredColumns.filter(
      ([table, column, type]) => actualTypes.get(`${table}.${column}`) !== type
    )
    if (invalidContract.length) {
      throw new Error(
        `El esquema base difiere del contrato esperado: ${invalidContract
          .map(([table, column, type]) => `${table}.${column} (${type})`)
          .join(', ')}`
      )
    }

    const columnTargets = [
      ['factor_emision', 'gas_especifico'],
      ['factor_emision', 'estado_aprobacion'],
      ['factor_emision', 'institucion_responsable'],
      ['factor_emision', 'anio_publicacion'],
      ['factor_emision', 'sector_categoria'],
      ['metodologia_version', 'id_gwp_set'],
      ['dato_actividad_carbono', 'parametros_calculo'],
      ['calculo_carbono', 'hash_entrada'],
      ['calculo_carbono', 'version_motor'],
      ['calculo_carbono', 'id_gwp_set'],
      ['resultado_carbono', 'id_dato_carbono'],
      ['resultado_carbono', 'gas_calculado'],
      ['resultado_carbono', 'gas_especifico'],
      ['resultado_carbono', 'cantidad_emision'],
      ['resultado_carbono', 'unidad_emision_id'],
      ['resultado_carbono', 'id_gwp_value'],
      ['resultado_carbono', 'valor_gwp'],
      ['resultado_carbono', 'gwp_horizonte_anios'],
      ['resultado_carbono', 'gwp_version'],
      ['resultado_carbono', 'version_motor'],
    ] as const
    const existingColumns = await this.db.rawQuery(`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND (table_name, column_name) IN (${columnTargets.map(([table, column]) => `('${table}','${column}')`).join(',')})
    `)
    if (existingColumns.rows.length) {
      throw new Error(
        `Columnas destino ya existentes: ${(existingColumns.rows as { table_name: string; column_name: string }[]).map((row) => `${row.table_name}.${row.column_name}`).join(', ')}`
      )
    }

    const overlap = await this.db.rawQuery(`
      SELECT a.id_factor_emision, b.id_factor_emision
      FROM factor_emision a
      JOIN factor_emision b ON b.id_factor_emision > a.id_factor_emision
        AND b.id_version = a.id_version
        AND b.id_fuente_emision = a.id_fuente_emision
        AND b.id_unidad_entrada = a.id_unidad_entrada
        AND b.gas = a.gas
        AND COALESCE(b.region, '') = COALESCE(a.region, '')
        AND a.fecha_inicio_vigencia <= COALESCE(b.fecha_fin_vigencia, 'infinity'::date)
        AND b.fecha_inicio_vigencia <= COALESCE(a.fecha_fin_vigencia, 'infinity'::date)
      LIMIT 1
    `)
    if (overlap.rows.length) {
      throw new Error(
        'Hay factores existentes con condiciones y vigencias superpuestas; resuélvelos antes de aplicar esta migración.'
      )
    }

    const unidentifiedGas = await this.db.rawQuery(`
      SELECT id_factor_emision
      FROM factor_emision
      WHERE gas IN ('CH4', 'OTRO')
      LIMIT 1
    `)
    if (unidentifiedGas.rows.length) {
      throw new Error(
        'Hay factores CH4 u OTRO existentes sin especie documentada. Identifícala antes de aplicar la restricción.'
      )
    }

    await this.db.rawQuery(`
      CREATE TABLE gwp_set (
        id_gwp_set BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        codigo VARCHAR(80) NOT NULL UNIQUE,
        nombre VARCHAR(200) NOT NULL,
        horizonte_anios SMALLINT NOT NULL CHECK (horizonte_anios > 0),
        estandar_version VARCHAR(100) NOT NULL,
        fuente_cientifica VARCHAR(500) NOT NULL,
        referencia TEXT,
        fecha_publicacion DATE,
        estado BOOLEAN NOT NULL DEFAULT TRUE,
        fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await this.db.rawQuery(`
      CREATE TABLE gwp_value (
        id_gwp_value BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        id_gwp_set BIGINT NOT NULL REFERENCES gwp_set(id_gwp_set) ON DELETE RESTRICT,
        gas_codigo VARCHAR(80) NOT NULL,
        nombre_gas VARCHAR(150) NOT NULL,
        valor DECIMAL(24, 12) NOT NULL CHECK (valor > 0),
        nota TEXT,
        UNIQUE (id_gwp_set, gas_codigo)
      )
    `)

    await this.db.rawQuery(`
      ALTER TABLE factor_emision
        ADD COLUMN gas_especifico VARCHAR(80),
        ADD COLUMN estado_aprobacion VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
        ADD COLUMN institucion_responsable VARCHAR(200),
        ADD COLUMN anio_publicacion SMALLINT,
        ADD COLUMN sector_categoria VARCHAR(150),
        ADD CONSTRAINT factor_emision_estado_aprobacion_check
          CHECK (estado_aprobacion IN ('BORRADOR','PENDIENTE','APROBADO','RECHAZADO')),
        ADD CONSTRAINT factor_emision_anio_publicacion_check
          CHECK (anio_publicacion IS NULL OR anio_publicacion BETWEEN 1800 AND 2200),
        ADD CONSTRAINT factor_emision_gas_especifico_check
          CHECK (
            (gas IN ('OTRO', 'CH4') AND gas_especifico IS NOT NULL AND btrim(gas_especifico) <> '')
            OR (gas NOT IN ('OTRO', 'CH4') AND gas_especifico IS NULL)
          )
    `)
    await this.db.rawQuery(`
      ALTER TABLE metodologia_version
        ADD COLUMN id_gwp_set BIGINT REFERENCES gwp_set(id_gwp_set) ON DELETE RESTRICT
    `)
    await this.db.rawQuery(`
      ALTER TABLE dato_actividad_carbono
        ADD COLUMN parametros_calculo JSONB NOT NULL DEFAULT '{}'::jsonb,
        ADD CONSTRAINT dato_actividad_parametros_objeto_check
          CHECK (jsonb_typeof(parametros_calculo) = 'object')
    `)
    await this.db.rawQuery(`
      ALTER TABLE calculo_carbono
        ADD COLUMN hash_entrada CHAR(64),
        ADD COLUMN version_motor VARCHAR(40),
        ADD COLUMN id_gwp_set BIGINT REFERENCES gwp_set(id_gwp_set) ON DELETE RESTRICT
    `)
    await this.db.rawQuery(`
      ALTER TABLE resultado_carbono
        ADD COLUMN id_dato_carbono BIGINT REFERENCES dato_actividad_carbono(id_dato_carbono) ON DELETE RESTRICT,
        ADD COLUMN gas_calculado VARCHAR(20),
        ADD COLUMN gas_especifico VARCHAR(80),
        ADD COLUMN cantidad_emision DECIMAL(24, 8),
        ADD COLUMN unidad_emision_id INTEGER REFERENCES unidad_medida(id_unidad) ON DELETE RESTRICT,
        ADD COLUMN id_gwp_value BIGINT REFERENCES gwp_value(id_gwp_value) ON DELETE RESTRICT,
        ADD COLUMN valor_gwp DECIMAL(24, 12),
        ADD COLUMN gwp_horizonte_anios SMALLINT,
        ADD COLUMN gwp_version VARCHAR(100),
        ADD COLUMN version_motor VARCHAR(40),
        ADD CONSTRAINT resultado_carbono_gas_check
          CHECK (gas_calculado IS NULL OR gas_calculado IN ('CO2','CH4','N2O','CO2E','OTRO')),
        ADD CONSTRAINT resultado_carbono_gwp_snapshot_check
          CHECK ((valor_gwp IS NULL AND id_gwp_value IS NULL AND gwp_horizonte_anios IS NULL AND gwp_version IS NULL)
              OR (valor_gwp > 0 AND id_gwp_value IS NOT NULL AND gwp_horizonte_anios > 0 AND gwp_version IS NOT NULL))
    `)

    await this.db.rawQuery(
      `CREATE UNIQUE INDEX calculo_carbono_hash_unique ON calculo_carbono(hash_entrada) WHERE hash_entrada IS NOT NULL`
    )
    await this.db.rawQuery(
      `CREATE UNIQUE INDEX resultado_carbono_dato_factor_gas_unique ON resultado_carbono(id_calculo_carbono, id_dato_carbono, id_factor_emision, gas_calculado) WHERE id_dato_carbono IS NOT NULL AND id_factor_emision IS NOT NULL AND gas_calculado IS NOT NULL`
    )
    await this.db.rawQuery(
      `CREATE INDEX factor_emision_aprobado_vigencia_idx ON factor_emision(id_fuente_emision, id_version, gas, estado_aprobacion, fecha_inicio_vigencia, fecha_fin_vigencia)`
    )

    await this.db.rawQuery(`
      CREATE FUNCTION validar_vigencia_factor_emision() RETURNS trigger AS $fn$
      BEGIN
        PERFORM pg_advisory_xact_lock(
          hashtext(NEW.id_version::text || '|' || NEW.id_fuente_emision::text),
          hashtext(NEW.id_unidad_entrada::text || '|' || NEW.gas || '|' ||
            COALESCE(NEW.gas_especifico, '') || '|' || COALESCE(NEW.region, ''))
        );
        IF EXISTS (
          SELECT 1 FROM factor_emision f
          WHERE f.id_factor_emision <> COALESCE(NEW.id_factor_emision, 0)
            AND f.id_version = NEW.id_version
            AND f.id_fuente_emision = NEW.id_fuente_emision
            AND f.id_unidad_entrada = NEW.id_unidad_entrada
            AND f.gas = NEW.gas
            AND COALESCE(f.gas_especifico, '') = COALESCE(NEW.gas_especifico, '')
            AND COALESCE(f.region, '') = COALESCE(NEW.region, '')
            AND f.fecha_inicio_vigencia <= COALESCE(NEW.fecha_fin_vigencia, 'infinity'::date)
            AND NEW.fecha_inicio_vigencia <= COALESCE(f.fecha_fin_vigencia, 'infinity'::date)
        ) THEN
          RAISE EXCEPTION 'Ya existe un factor para la misma combinación con una vigencia superpuesta';
        END IF;
        RETURN NEW;
      END;
      $fn$ LANGUAGE plpgsql
    `)
    await this.db.rawQuery(`
      CREATE TRIGGER factor_emision_approved_overlap
      BEFORE INSERT OR UPDATE OF id_version, id_fuente_emision, id_unidad_entrada, gas,
        gas_especifico, region, fecha_inicio_vigencia, fecha_fin_vigencia
      ON factor_emision
      FOR EACH ROW EXECUTE FUNCTION validar_vigencia_factor_emision()
    `)
  }

  async down() {
    const data = await this.db.rawQuery(`
      SELECT
        (SELECT COUNT(*) FROM gwp_set)::int AS gwp_sets,
        (SELECT COUNT(*) FROM factor_emision WHERE estado_aprobacion <> 'PENDIENTE' OR gas_especifico IS NOT NULL OR institucion_responsable IS NOT NULL OR anio_publicacion IS NOT NULL OR sector_categoria IS NOT NULL)::int AS enriched_factors,
        (SELECT COUNT(*) FROM metodologia_version WHERE id_gwp_set IS NOT NULL)::int AS methodology_gwp,
        (SELECT COUNT(*) FROM dato_actividad_carbono WHERE parametros_calculo <> '{}'::jsonb)::int AS activity_parameters,
        (SELECT COUNT(*) FROM calculo_carbono WHERE hash_entrada IS NOT NULL OR version_motor IS NOT NULL OR id_gwp_set IS NOT NULL)::int AS calculation_snapshots,
        (SELECT COUNT(*) FROM resultado_carbono WHERE id_dato_carbono IS NOT NULL OR gas_calculado IS NOT NULL OR gas_especifico IS NOT NULL OR cantidad_emision IS NOT NULL OR unidad_emision_id IS NOT NULL OR id_gwp_value IS NOT NULL OR valor_gwp IS NOT NULL OR gwp_horizonte_anios IS NOT NULL OR gwp_version IS NOT NULL OR version_motor IS NOT NULL)::int AS result_snapshots
    `)
    const counts = data.rows[0]
    if (Object.values(counts).some((count) => Number(count) > 0)) {
      throw new Error(
        'No se puede revertir: existen factores, valores GWP o cálculos que utilizan la trazabilidad añadida.'
      )
    }

    await this.db.rawQuery('DROP TRIGGER factor_emision_approved_overlap ON factor_emision')
    await this.db.rawQuery('DROP FUNCTION validar_vigencia_factor_emision()')
    await this.db.rawQuery('DROP INDEX resultado_carbono_dato_factor_gas_unique')
    await this.db.rawQuery('DROP INDEX calculo_carbono_hash_unique')
    await this.db.rawQuery('DROP INDEX factor_emision_aprobado_vigencia_idx')
    await this.db.rawQuery(`
      ALTER TABLE resultado_carbono
        DROP CONSTRAINT resultado_carbono_gwp_snapshot_check,
        DROP CONSTRAINT resultado_carbono_gas_check,
        DROP COLUMN version_motor,
        DROP COLUMN gwp_version,
        DROP COLUMN gwp_horizonte_anios,
        DROP COLUMN valor_gwp,
        DROP COLUMN id_gwp_value,
        DROP COLUMN unidad_emision_id,
        DROP COLUMN cantidad_emision,
        DROP COLUMN gas_especifico,
        DROP COLUMN gas_calculado,
        DROP COLUMN id_dato_carbono
    `)
    await this.db.rawQuery(
      `ALTER TABLE calculo_carbono DROP COLUMN id_gwp_set, DROP COLUMN version_motor, DROP COLUMN hash_entrada`
    )
    await this.db.rawQuery(
      `ALTER TABLE dato_actividad_carbono DROP CONSTRAINT dato_actividad_parametros_objeto_check, DROP COLUMN parametros_calculo`
    )
    await this.db.rawQuery(`ALTER TABLE metodologia_version DROP COLUMN id_gwp_set`)
    await this.db.rawQuery(`
      ALTER TABLE factor_emision
        DROP CONSTRAINT factor_emision_gas_especifico_check,
        DROP CONSTRAINT factor_emision_anio_publicacion_check,
        DROP CONSTRAINT factor_emision_estado_aprobacion_check,
        DROP COLUMN sector_categoria,
        DROP COLUMN anio_publicacion,
        DROP COLUMN institucion_responsable,
        DROP COLUMN estado_aprobacion,
        DROP COLUMN gas_especifico
    `)
    await this.db.rawQuery('DROP TABLE gwp_value')
    await this.db.rawQuery('DROP TABLE gwp_set')
  }
}
