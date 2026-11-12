import { readFileSync } from 'node:fs'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Parte el script respetando los cuerpos $$ ... $$ de las funciones.
 * El driver de Postgres no acepta varias sentencias en una sola consulta preparada.
 */
function splitSql(sql: string) {
  const statements: string[] = []
  let current = ''
  let insideDollar = false

  for (const line of sql.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!insideDollar && trimmed.startsWith('--') && current.trim() === '') {
      continue
    }

    const markers = line.split('$$').length - 1
    if (markers % 2 === 1) {
      insideDollar = !insideDollar
    }

    current += `${line}\n`

    if (!insideDollar && trimmed.endsWith(';')) {
      statements.push(current.trim())
      current = ''
    }
  }

  if (current.trim()) {
    statements.push(current.trim())
  }

  return statements
}

const sql = readFileSync(new URL('../sql/esquema.sql', import.meta.url), 'utf8')

export default class extends BaseSchema {
  async up() {
    for (const statement of splitSql(sql)) {
      this.schema.raw(statement)
    }
  }

  async down() {
    this.schema.raw('DROP TABLE IF EXISTS auditoria')
    this.schema.raw('DROP TABLE IF EXISTS resultado_carbono')
    this.schema.raw('DROP TABLE IF EXISTS calculo_carbono_factor')
    this.schema.raw('DROP TABLE IF EXISTS calculo_carbono_dato')
    this.schema.raw('DROP TABLE IF EXISTS calculo_carbono')
    this.schema.raw('DROP TABLE IF EXISTS factor_emision')
    this.schema.raw('DROP TABLE IF EXISTS dato_actividad_carbono')
    this.schema.raw('DROP TABLE IF EXISTS fuente_emision')
    this.schema.raw('DROP TABLE IF EXISTS alcance_emision')
    this.schema.raw('DROP TABLE IF EXISTS resultado_hidrico')
    this.schema.raw('DROP TABLE IF EXISTS calculo_hidrico_parametro')
    this.schema.raw('DROP TABLE IF EXISTS calculo_hidrico_dato')
    this.schema.raw('DROP TABLE IF EXISTS calculo_hidrico')
    this.schema.raw('DROP TABLE IF EXISTS parametro_hidrico')
    this.schema.raw('DROP TABLE IF EXISTS dato_hidrico')
    this.schema.raw('DROP TABLE IF EXISTS componente_hidrico')
    this.schema.raw('DROP TABLE IF EXISTS tipo_agua')
    this.schema.raw('DROP TABLE IF EXISTS metodologia_version')
    this.schema.raw('DROP TABLE IF EXISTS metodologia')
    this.schema.raw('DROP TABLE IF EXISTS unidad_medida')
    this.schema.raw('DROP TABLE IF EXISTS periodo_medicion')
    this.schema.raw('DROP TABLE IF EXISTS actividad')
    this.schema.raw('DROP TABLE IF EXISTS proceso')
    this.schema.raw('DROP TABLE IF EXISTS usuario_sede')
    this.schema.raw('DROP TABLE IF EXISTS usuario_organizacion')
    this.schema.raw('DROP TABLE IF EXISTS sede')
    this.schema.raw('DROP TABLE IF EXISTS organizacion')
    this.schema.raw('DROP TABLE IF EXISTS municipio')
    this.schema.raw('DROP TABLE IF EXISTS departamento')
    this.schema.raw('DROP TABLE IF EXISTS rol_permiso')
    this.schema.raw('DROP TABLE IF EXISTS permiso')
    this.schema.raw('DROP TABLE IF EXISTS usuario_rol')
    this.schema.raw('DROP TABLE IF EXISTS usuario')
    this.schema.raw('DROP TABLE IF EXISTS rol')
    this.schema.raw('DROP FUNCTION IF EXISTS set_fecha_actualizacion()')
  }
}
