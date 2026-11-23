import { BaseSchema } from '@adonisjs/lucid/schema'

type Columna = {
  table_name: string
  column_name: string
  data_type: string
  character_maximum_length: number | null
  is_identity: 'YES' | 'NO'
  identity_generation: 'ALWAYS' | 'BY DEFAULT' | null
}

const TABLAS_BASE = [
  'alcance_emision',
  'actividad_emision',
  'subcategoria_emision',
  'fuente_emision',
  'dato_actividad_carbono',
  'resultado_carbono',
]

const COLUMNAS_NUEVAS = [
  ['dato_actividad_carbono', 'id_actividad_emision'],
  ['dato_actividad_carbono', 'id_subcategoria_emision'],
  ['resultado_carbono', 'id_actividad_emision'],
]

const INDICES_NUEVOS = [
  'idx_dato_carbono_actividad_emision',
  'idx_resultado_carbono_actividad_emision',
  'idx_actividad_emision_fuente_fuente',
]

const RESTRICCIONES_NUEVAS = [
  'subcategoria_emision_activity_id_unique',
  'actividad_emision_fuente_actividad_fk',
  'actividad_emision_fuente_fuente_fk',
  'actividad_emision_fuente_subcategoria_fk',
  'dato_carbono_actividad_emision_fk',
  'dato_carbono_subcategoria_emision_fk',
  'dato_carbono_actividad_fuente_fk',
  'resultado_carbono_actividad_emision_fk',
  'resultado_carbono_actividad_fuente_fk',
]

const TRIGGERS_NUEVOS = [
  'trg_dato_carbono_catalogo_emision',
  'trg_resultado_carbono_catalogo_emision',
]

export default class extends BaseSchema {
  private async validarEsquemaBase() {
    const tablas = await this.db.rawQuery(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_name = ANY(ARRAY[${TABLAS_BASE.map((tabla) => `'${tabla}'`).join(', ')}])
    `)
    const existentes = new Set(
      (tablas.rows as { table_name: string }[]).map((fila) => fila.table_name)
    )
    const faltantes = TABLAS_BASE.filter((tabla) => !existentes.has(tabla))
    if (faltantes.length) {
      throw new Error(
        `No se puede reconciliar el catálogo: faltan tablas históricas requeridas (${faltantes.join(', ')}).`
      )
    }

    const columnas = await this.db.rawQuery(`
      SELECT table_name, column_name, data_type, character_maximum_length, is_identity, identity_generation
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = ANY(ARRAY[${TABLAS_BASE.map((tabla) => `'${tabla}'`).join(', ')}])
    `)
    const porColumna = new Map(
      (columnas.rows as Columna[]).map((columna) => [
        `${columna.table_name}.${columna.column_name}`,
        columna,
      ])
    )
    const requeridas = [
      ['alcance_emision', 'id_alcance', 'integer'],
      ['alcance_emision', 'codigo', 'character varying'],
      ['alcance_emision', 'nombre', 'character varying'],
      ['alcance_emision', 'estado', 'boolean'],
      ['actividad_emision', 'id_actividad_emision', 'bigint'],
      ['actividad_emision', 'id_alcance', 'integer'],
      ['actividad_emision', 'codigo', 'character varying'],
      ['actividad_emision', 'nombre', 'character varying'],
      ['actividad_emision', 'estado', 'boolean'],
      ['subcategoria_emision', 'id_subcategoria', 'bigint'],
      ['subcategoria_emision', 'id_actividad_emision', 'bigint'],
      ['subcategoria_emision', 'codigo', 'character varying'],
      ['subcategoria_emision', 'nombre', 'character varying'],
      ['subcategoria_emision', 'estado', 'boolean'],
      ['fuente_emision', 'id_fuente_emision', 'bigint'],
      ['fuente_emision', 'codigo', 'character varying'],
      ['fuente_emision', 'nombre', 'character varying'],
      ['fuente_emision', 'estado', 'boolean'],
      ['fuente_emision', 'id_actividad_emision', 'bigint'],
      ['fuente_emision', 'id_subcategoria_emision', 'bigint'],
      ['dato_actividad_carbono', 'id_fuente_emision', 'bigint'],
      ['dato_actividad_carbono', 'id_alcance', 'integer'],
      ['resultado_carbono', 'id_fuente_emision', 'bigint'],
      ['resultado_carbono', 'id_alcance', 'integer'],
      ['resultado_carbono', 'id_subcategoria_emision', 'bigint'],
    ] as const
    const incompatibles = requeridas.filter(([tabla, columna, tipo]) => {
      return porColumna.get(`${tabla}.${columna}`)?.data_type !== tipo
    })
    if (incompatibles.length) {
      throw new Error(
        `No se puede reconciliar el catálogo: columnas históricas ausentes o incompatibles (${incompatibles
          .map(([tabla, columna]) => `${tabla}.${columna}`)
          .join(', ')}).`
      )
    }

    for (const [tabla, columna] of [
      ['alcance_emision', 'id_alcance'],
      ['actividad_emision', 'id_actividad_emision'],
      ['subcategoria_emision', 'id_subcategoria'],
      ['fuente_emision', 'id_fuente_emision'],
    ]) {
      const idColumn = porColumna.get(`${tabla}.${columna}`)
      if (idColumn?.is_identity !== 'YES' || idColumn.identity_generation !== 'BY DEFAULT') {
        throw new Error(`No se puede reconciliar el catálogo: ${tabla}.${columna} no es IDENTITY.`)
      }
    }

    const longitudCodigo = porColumna.get('subcategoria_emision.codigo')?.character_maximum_length
    if (longitudCodigo !== 20) {
      throw new Error(
        `No se puede ampliar subcategoria_emision.codigo: se esperaba VARCHAR(20), se encontró VARCHAR(${longitudCodigo ?? 'sin límite'}).`
      )
    }

    const existentesNuevas = await this.db.rawQuery(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND (table_name, column_name) IN (
          ${COLUMNAS_NUEVAS.map(([tabla, columna]) => `('${tabla}', '${columna}')`).join(', ')}
        )
    `)
    const columnasNuevas = existentesNuevas.rows as {
      table_name: string
      column_name: string
    }[]
    if (columnasNuevas.length) {
      throw new Error(
        `No se puede reconciliar el catálogo: ya existen columnas objetivo (${columnasNuevas
          .map((fila) => `${fila.table_name}.${fila.column_name}`)
          .join(', ')}).`
      )
    }

    const puente = await this.db.rawQuery(`
      SELECT to_regclass(format('%I.%I', current_schema(), 'actividad_emision_fuente')) IS NOT NULL AS existe
    `)
    if (puente.rows[0]?.existe) {
      throw new Error(
        'No se puede reconciliar el catálogo: actividad_emision_fuente ya existe y requiere inspección explícita.'
      )
    }

    const colisiones = await this.db.rawQuery(`
      SELECT indexname AS nombre
      FROM pg_indexes
      WHERE schemaname = current_schema()
        AND indexname = ANY(ARRAY[${INDICES_NUEVOS.map((nombre) => `'${nombre}'`).join(', ')}])
      UNION ALL
      SELECT conname AS nombre
      FROM pg_constraint
      WHERE connamespace = current_schema()::regnamespace
        AND conname = ANY(ARRAY[${RESTRICCIONES_NUEVAS.map((nombre) => `'${nombre}'`).join(', ')}])
      UNION ALL
      SELECT tgname AS nombre
      FROM pg_trigger
      WHERE NOT tgisinternal
        AND tgname = ANY(ARRAY[${TRIGGERS_NUEVOS.map((nombre) => `'${nombre}'`).join(', ')}])
      UNION ALL
      SELECT proname AS nombre
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = current_schema()
        AND proname = 'validar_clasificacion_catalogo_emision'
    `)
    const nombresColisionados = colisiones.rows as { nombre: string }[]
    if (nombresColisionados.length) {
      throw new Error(
        `No se puede reconciliar el catálogo: hay nombres de objetos ocupados (${nombresColisionados
          .map((fila) => fila.nombre)
          .join(', ')}).`
      )
    }

    const historicas = await this.db.rawQuery(`
      SELECT conname, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE connamespace = current_schema()::regnamespace
        AND conname = ANY(ARRAY[
          'actividad_emision_id_alcance_fkey',
          'subcategoria_emision_id_actividad_emision_fkey',
          'fuente_emision_actividad_emision_fk',
          'fuente_emision_subcategoria_emision_fk',
          'resultado_carbono_subcategoria_fk'
        ])
    `)
    const porRestriccionHistorica = new Map(
      (historicas.rows as { conname: string; definition: string }[]).map((fila) => [
        fila.conname,
        fila.definition.replace(/\s+/g, '').toLowerCase(),
      ])
    )
    const requeridasHistoricas = [
      [
        'actividad_emision_id_alcance_fkey',
        'FOREIGN KEY (id_alcance) REFERENCES alcance_emision(id_alcance) ON DELETE RESTRICT',
      ],
      [
        'subcategoria_emision_id_actividad_emision_fkey',
        'FOREIGN KEY (id_actividad_emision) REFERENCES actividad_emision(id_actividad_emision) ON DELETE RESTRICT',
      ],
      [
        'fuente_emision_actividad_emision_fk',
        'FOREIGN KEY (id_actividad_emision) REFERENCES actividad_emision(id_actividad_emision) ON DELETE RESTRICT',
      ],
      [
        'fuente_emision_subcategoria_emision_fk',
        'FOREIGN KEY (id_subcategoria_emision) REFERENCES subcategoria_emision(id_subcategoria) ON DELETE RESTRICT',
      ],
      [
        'resultado_carbono_subcategoria_fk',
        'FOREIGN KEY (id_subcategoria_emision) REFERENCES subcategoria_emision(id_subcategoria) ON DELETE RESTRICT',
      ],
    ]
    const incompatiblesHistoricas = requeridasHistoricas.filter(([nombre, definicion]) => {
      return porRestriccionHistorica.get(nombre) !== definicion.replace(/\s+/g, '').toLowerCase()
    })
    if (incompatiblesHistoricas.length) {
      throw new Error(
        `No se puede reconciliar el catálogo: faltan o difieren restricciones históricas (${incompatiblesHistoricas
          .map(([nombre]) => nombre)
          .join(', ')}).`
      )
    }

    const triggersHistoricos = await this.db.rawQuery(`
      SELECT tgname
      FROM pg_trigger
      WHERE NOT tgisinternal
        AND tgname = ANY(ARRAY[
          'trg_fuente_emision_jerarquia',
          'trg_subcategoria_emision_actividad',
          'trg_dato_carbono_alcance_fuente'
        ])
    `)
    const nombresTriggersHistoricos = new Set(
      (triggersHistoricos.rows as { tgname: string }[]).map((fila) => fila.tgname)
    )
    const faltanTriggers = [
      'trg_fuente_emision_jerarquia',
      'trg_subcategoria_emision_actividad',
      'trg_dato_carbono_alcance_fuente',
    ].filter((nombre) => !nombresTriggersHistoricos.has(nombre))
    if (faltanTriggers.length) {
      throw new Error(
        `No se puede reconciliar el catálogo: faltan triggers históricos que deben conservarse (${faltanTriggers.join(', ')}).`
      )
    }

    const enlacesInvalidos = await this.db.rawQuery(`
      SELECT COUNT(*)::int AS total
      FROM fuente_emision f
      WHERE f.id_subcategoria_emision IS NOT NULL
        AND (
          f.id_actividad_emision IS NULL
          OR NOT EXISTS (
            SELECT 1
            FROM subcategoria_emision s
            WHERE s.id_subcategoria = f.id_subcategoria_emision
              AND s.id_actividad_emision = f.id_actividad_emision
          )
        )
    `)
    if (Number(enlacesInvalidos.rows[0]?.total ?? 0) > 0) {
      throw new Error(
        'No se puede reconciliar el catálogo: hay fuentes históricas cuya subcategoría no corresponde a su actividad.'
      )
    }
  }

  async up() {
    await this.validarEsquemaBase()

    await this.db.rawQuery(`
      ALTER TABLE subcategoria_emision
      ALTER COLUMN codigo TYPE VARCHAR(40)
    `)
    await this.db.rawQuery(`
      ALTER TABLE subcategoria_emision
      ADD CONSTRAINT subcategoria_emision_activity_id_unique
      UNIQUE (id_actividad_emision, id_subcategoria)
    `)
    await this.db.rawQuery(`
      CREATE TABLE actividad_emision_fuente (
        id_actividad_emision BIGINT NOT NULL,
        id_fuente_emision BIGINT NOT NULL,
        id_subcategoria_emision BIGINT,
        observacion TEXT,
        CONSTRAINT actividad_emision_fuente_pkey
          PRIMARY KEY (id_actividad_emision, id_fuente_emision),
        CONSTRAINT actividad_emision_fuente_actividad_fk
          FOREIGN KEY (id_actividad_emision)
          REFERENCES actividad_emision (id_actividad_emision) ON DELETE RESTRICT,
        CONSTRAINT actividad_emision_fuente_fuente_fk
          FOREIGN KEY (id_fuente_emision)
          REFERENCES fuente_emision (id_fuente_emision) ON DELETE RESTRICT,
        CONSTRAINT actividad_emision_fuente_subcategoria_fk
          FOREIGN KEY (id_actividad_emision, id_subcategoria_emision)
          REFERENCES subcategoria_emision (id_actividad_emision, id_subcategoria)
          ON DELETE RESTRICT
      )
    `)

    // Conserva en la tabla puente cualquier clasificación directa histórica.
    await this.db.rawQuery(`
      INSERT INTO actividad_emision_fuente (
        id_actividad_emision,
        id_fuente_emision,
        id_subcategoria_emision
      )
      SELECT id_actividad_emision, id_fuente_emision, id_subcategoria_emision
      FROM fuente_emision
      WHERE id_actividad_emision IS NOT NULL
    `)

    await this.db.rawQuery(`
      ALTER TABLE dato_actividad_carbono
        ADD COLUMN id_actividad_emision BIGINT,
        ADD COLUMN id_subcategoria_emision BIGINT
    `)
    await this.db.rawQuery(`
      ALTER TABLE dato_actividad_carbono
        ADD CONSTRAINT dato_carbono_actividad_emision_fk
          FOREIGN KEY (id_actividad_emision)
          REFERENCES actividad_emision (id_actividad_emision) ON DELETE RESTRICT,
        ADD CONSTRAINT dato_carbono_subcategoria_emision_fk
          FOREIGN KEY (id_subcategoria_emision)
          REFERENCES subcategoria_emision (id_subcategoria) ON DELETE RESTRICT,
        ADD CONSTRAINT dato_carbono_actividad_fuente_fk
          FOREIGN KEY (id_actividad_emision, id_fuente_emision)
          REFERENCES actividad_emision_fuente (id_actividad_emision, id_fuente_emision)
          ON DELETE RESTRICT
    `)
    await this.db.rawQuery(`
      ALTER TABLE resultado_carbono
        ADD COLUMN id_actividad_emision BIGINT
    `)
    await this.db.rawQuery(`
      ALTER TABLE resultado_carbono
        ADD CONSTRAINT resultado_carbono_actividad_emision_fk
          FOREIGN KEY (id_actividad_emision)
          REFERENCES actividad_emision (id_actividad_emision) ON DELETE RESTRICT,
        ADD CONSTRAINT resultado_carbono_actividad_fuente_fk
          FOREIGN KEY (id_actividad_emision, id_fuente_emision)
          REFERENCES actividad_emision_fuente (id_actividad_emision, id_fuente_emision)
          ON DELETE RESTRICT
    `)

    await this.db.rawQuery(`
      CREATE INDEX idx_dato_carbono_actividad_emision
      ON dato_actividad_carbono (id_actividad_emision, id_subcategoria_emision)
    `)
    await this.db.rawQuery(`
      CREATE INDEX idx_resultado_carbono_actividad_emision
      ON resultado_carbono (id_actividad_emision, id_subcategoria_emision)
    `)
    await this.db.rawQuery(`
      CREATE INDEX idx_actividad_emision_fuente_fuente
      ON actividad_emision_fuente (id_fuente_emision, id_actividad_emision)
    `)

    await this.db.rawQuery(`
      CREATE FUNCTION validar_clasificacion_catalogo_emision() RETURNS trigger AS $fn$
      DECLARE
        v_subcategoria BIGINT;
        v_alcance INTEGER;
      BEGIN
        IF NEW.id_actividad_emision IS NULL THEN
          IF TG_TABLE_NAME = 'dato_actividad_carbono'
             AND NEW.id_subcategoria_emision IS NOT NULL THEN
            RAISE EXCEPTION 'Un dato nuevo no puede tener subcategoría sin actividad de emisión';
          END IF;
          RETURN NEW;
        END IF;

        SELECT v.id_subcategoria_emision, a.id_alcance
          INTO v_subcategoria, v_alcance
        FROM actividad_emision_fuente v
        JOIN actividad_emision a
          ON a.id_actividad_emision = v.id_actividad_emision
        WHERE v.id_actividad_emision = NEW.id_actividad_emision
          AND v.id_fuente_emision = NEW.id_fuente_emision;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'La fuente no está vinculada a la actividad de emisión seleccionada';
        END IF;
        IF v_subcategoria IS DISTINCT FROM NEW.id_subcategoria_emision THEN
          RAISE EXCEPTION 'La subcategoría no corresponde al vínculo fuente-actividad seleccionado';
        END IF;
        IF v_alcance IS DISTINCT FROM NEW.id_alcance THEN
          RAISE EXCEPTION 'El alcance no corresponde a la actividad de emisión seleccionada';
        END IF;
        RETURN NEW;
      END;
      $fn$ LANGUAGE plpgsql
    `)
    await this.db.rawQuery(`
      CREATE TRIGGER trg_dato_carbono_catalogo_emision
      BEFORE INSERT OR UPDATE OF id_fuente_emision, id_alcance,
        id_actividad_emision, id_subcategoria_emision
      ON dato_actividad_carbono
      FOR EACH ROW EXECUTE FUNCTION validar_clasificacion_catalogo_emision()
    `)
    await this.db.rawQuery(`
      CREATE TRIGGER trg_resultado_carbono_catalogo_emision
      BEFORE INSERT OR UPDATE OF id_fuente_emision, id_alcance,
        id_actividad_emision, id_subcategoria_emision
      ON resultado_carbono
      FOR EACH ROW EXECUTE FUNCTION validar_clasificacion_catalogo_emision()
    `)
  }

  async down() {
    const conteos = await Promise.all([
      this.db.rawQuery('SELECT COUNT(*)::int AS total FROM actividad_emision_fuente'),
      this.db.rawQuery(`
        SELECT COUNT(*)::int AS total
        FROM dato_actividad_carbono
        WHERE id_actividad_emision IS NOT NULL OR id_subcategoria_emision IS NOT NULL
      `),
      this.db.rawQuery(`
        SELECT COUNT(*)::int AS total
        FROM resultado_carbono
        WHERE id_actividad_emision IS NOT NULL
      `),
      this.db.rawQuery(`
        SELECT COUNT(*)::int AS total
        FROM subcategoria_emision
        WHERE length(codigo) > 20
      `),
    ])
    const dependencias = conteos
      .slice(0, 3)
      .reduce((total, resultado) => total + Number(resultado.rows[0]?.total ?? 0), 0)
    if (dependencias > 0) {
      throw new Error(
        'No se puede revertir la reconciliación: existen vínculos o registros/resultados clasificados que dependen de esta migración. Archive o migre esas referencias explícitamente antes del rollback.'
      )
    }
    if (Number(conteos[3].rows[0]?.total ?? 0) > 0) {
      throw new Error(
        'No se puede revertir la reconciliación: hay códigos de subcategoría de más de 20 caracteres; reducir el tamaño podría truncar información.'
      )
    }

    await this.db.rawQuery(
      'DROP TRIGGER trg_resultado_carbono_catalogo_emision ON resultado_carbono'
    )
    await this.db.rawQuery(
      'DROP TRIGGER trg_dato_carbono_catalogo_emision ON dato_actividad_carbono'
    )
    await this.db.rawQuery('DROP FUNCTION validar_clasificacion_catalogo_emision()')
    await this.db.rawQuery(`
      ALTER TABLE resultado_carbono
        DROP CONSTRAINT resultado_carbono_actividad_fuente_fk,
        DROP CONSTRAINT resultado_carbono_actividad_emision_fk
    `)
    await this.db.rawQuery(`
      ALTER TABLE dato_actividad_carbono
        DROP CONSTRAINT dato_carbono_actividad_fuente_fk,
        DROP CONSTRAINT dato_carbono_subcategoria_emision_fk,
        DROP CONSTRAINT dato_carbono_actividad_emision_fk
    `)
    await this.db.rawQuery('DROP INDEX idx_resultado_carbono_actividad_emision')
    await this.db.rawQuery('DROP INDEX idx_dato_carbono_actividad_emision')
    await this.db.rawQuery('DROP INDEX idx_actividad_emision_fuente_fuente')
    await this.db.rawQuery('DROP TABLE actividad_emision_fuente')
    await this.db.rawQuery(`
      ALTER TABLE resultado_carbono
      DROP COLUMN id_actividad_emision
    `)
    await this.db.rawQuery(`
      ALTER TABLE dato_actividad_carbono
        DROP COLUMN id_subcategoria_emision,
        DROP COLUMN id_actividad_emision
    `)
    await this.db.rawQuery(`
      ALTER TABLE subcategoria_emision
      DROP CONSTRAINT subcategoria_emision_activity_id_unique,
      ALTER COLUMN codigo TYPE VARCHAR(20)
    `)
  }
}
