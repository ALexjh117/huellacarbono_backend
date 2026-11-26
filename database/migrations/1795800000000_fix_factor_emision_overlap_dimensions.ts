import { BaseSchema } from '@adonisjs/lucid/schema'

const TRIGGER_NAME = 'factor_emision_approved_overlap'
const FUNCTION_NAME = 'validar_vigencia_factor_emision'

export default class extends BaseSchema {
  async up() {
    const columns = await this.db.rawQuery(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'factor_emision'
        AND column_name = ANY(ARRAY[
          'id_version', 'id_fuente_emision', 'id_unidad_entrada', 'gas',
          'gas_especifico', 'region', 'sector_categoria', 'anio_aplicacion',
          'fecha_inicio_vigencia', 'fecha_fin_vigencia'
        ])
    `)
    const actual = new Map(
      (
        columns.rows as {
          column_name: string
          data_type: string
          character_maximum_length: number | null
        }[]
      ).map((column) => [column.column_name, column])
    )
    const expected = [
      ['id_version', 'bigint', null],
      ['id_fuente_emision', 'bigint', null],
      ['id_unidad_entrada', 'integer', null],
      ['gas', 'character varying', null],
      ['gas_especifico', 'character varying', 80],
      ['region', 'character varying', null],
      ['sector_categoria', 'character varying', 150],
      ['anio_aplicacion', 'integer', null],
      ['fecha_inicio_vigencia', 'date', null],
      ['fecha_fin_vigencia', 'date', null],
    ] as const
    const incompatible = expected.filter(([name, type, length]) => {
      const column = actual.get(name)
      return (
        !column ||
        column.data_type !== type ||
        (length !== null && column.character_maximum_length !== length)
      )
    })
    if (incompatible.length) {
      throw new Error(
        `Faltan columnas o difieren del esquema posterior a 179570: ${incompatible
          .map(([name, type, length]) => `${name} (${type}${length ? `(${length})` : ''})`)
          .join(', ')}`
      )
    }

    const trigger = await this.db.rawQuery(`
      SELECT 1
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = current_schema()
        AND c.relname = 'factor_emision'
        AND t.tgname = ?
        AND NOT t.tgisinternal
    `, [TRIGGER_NAME])
    const routine = await this.db.rawQuery(`
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = current_schema() AND p.proname = ?
    `, [FUNCTION_NAME])
    if (!trigger.rows.length || !routine.rows.length) {
      throw new Error(
        'No se encontró el trigger de 179560 y su función asociados; inspeccione el esquema antes de corregirlo.'
      )
    }

    await this.db.rawQuery(`DROP TRIGGER ${TRIGGER_NAME} ON factor_emision`)
    await this.db.rawQuery(`
      CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}() RETURNS trigger AS $fn$
      DECLARE
        region_normalizada TEXT := lower(regexp_replace(btrim(COALESCE(NEW.region, '')), '\\s+', ' ', 'g'));
        sector_normalizado TEXT := lower(regexp_replace(btrim(COALESCE(NEW.sector_categoria, '')), '\\s+', ' ', 'g'));
        especie_normalizada TEXT := btrim(COALESCE(NEW.gas_especifico, ''));
      BEGIN
        -- La clave compartida entre transacciones representa todo el contexto
        -- que define equivalencia en el servicio; intervalos comparten lock.
        PERFORM pg_advisory_xact_lock(hashtextextended(
          jsonb_build_array(
            NEW.id_version, NEW.id_fuente_emision, NEW.id_unidad_entrada,
            NEW.gas, especie_normalizada, region_normalizada,
            sector_normalizado, NEW.anio_aplicacion
          )::text,
          0
        ));

        IF EXISTS (
          SELECT 1
          FROM factor_emision f
          WHERE f.id_factor_emision <> COALESCE(NEW.id_factor_emision, 0)
            AND f.id_version = NEW.id_version
            AND f.id_fuente_emision = NEW.id_fuente_emision
            AND f.id_unidad_entrada = NEW.id_unidad_entrada
            AND f.gas = NEW.gas
            AND btrim(COALESCE(f.gas_especifico, '')) = especie_normalizada
            AND lower(regexp_replace(btrim(COALESCE(f.region, '')), '\\s+', ' ', 'g')) = region_normalizada
            AND lower(regexp_replace(btrim(COALESCE(f.sector_categoria, '')), '\\s+', ' ', 'g')) = sector_normalizado
            AND f.anio_aplicacion IS NOT DISTINCT FROM NEW.anio_aplicacion
            AND f.fecha_inicio_vigencia <= COALESCE(NEW.fecha_fin_vigencia, 'infinity'::date)
            AND NEW.fecha_inicio_vigencia <= COALESCE(f.fecha_fin_vigencia, 'infinity'::date)
        ) THEN
          RAISE EXCEPTION 'Ya existe un factor para la misma combinación y vigencia superpuesta'
            USING ERRCODE = '23505', CONSTRAINT = '${TRIGGER_NAME}';
        END IF;

        RETURN NEW;
      END;
      $fn$ LANGUAGE plpgsql
    `)
    await this.db.rawQuery(`
      CREATE TRIGGER ${TRIGGER_NAME}
      BEFORE INSERT OR UPDATE OF id_version, id_fuente_emision, id_unidad_entrada, gas,
        gas_especifico, region, sector_categoria, anio_aplicacion,
        fecha_inicio_vigencia, fecha_fin_vigencia
      ON factor_emision
      FOR EACH ROW EXECUTE FUNCTION ${FUNCTION_NAME}()
    `)
  }

  async down() {
    const trigger = await this.db.rawQuery(`
      SELECT 1
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = current_schema()
        AND c.relname = 'factor_emision'
        AND t.tgname = ?
        AND NOT t.tgisinternal
    `, [TRIGGER_NAME])
    if (!trigger.rows.length) {
      throw new Error('No se encontró el trigger corregido; no se modificó el esquema.')
    }

    await this.db.rawQuery(`DROP TRIGGER ${TRIGGER_NAME} ON factor_emision`)
    await this.db.rawQuery(`
      CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}() RETURNS trigger AS $fn$
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
      CREATE TRIGGER ${TRIGGER_NAME}
      BEFORE INSERT OR UPDATE OF id_version, id_fuente_emision, id_unidad_entrada, gas,
        gas_especifico, region, fecha_inicio_vigencia, fecha_fin_vigencia
      ON factor_emision
      FOR EACH ROW EXECUTE FUNCTION ${FUNCTION_NAME}()
    `)
  }
}
