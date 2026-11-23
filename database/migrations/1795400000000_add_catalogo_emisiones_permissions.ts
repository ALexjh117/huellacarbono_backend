import { BaseSchema } from '@adonisjs/lucid/schema'

const PERMISOS: [string, string][] = [
  ['catalogo_emision.ver', 'Ver el catálogo jerárquico de emisiones'],
  ['catalogo_emision.editar', 'Administrar actividades y subcategorías de emisión'],
  ['fuente_emision.ver', 'Ver fuentes de emisión'],
  ['fuente_emision.crear', 'Crear fuentes de emisión'],
  ['fuente_emision.editar', 'Actualizar fuentes de emisión'],
  ['fuente_emision.eliminar', 'Desactivar fuentes de emisión'],
  ['regla_calculo.ver', 'Ver reglas de cálculo'],
  ['regla_calculo.crear', 'Crear reglas de cálculo'],
  ['regla_calculo.editar', 'Actualizar reglas de cálculo'],
  ['importacion_factor.ver', 'Ver importaciones de factores'],
  ['importacion_factor.crear', 'Importar factores de emisión'],
]

export default class extends BaseSchema {
  async up() {
    const valores = PERMISOS.map(([codigo, nombre]) => `('${codigo}', '${nombre}')`).join(',\n        ')

    await this.schema.raw(`
      INSERT INTO permiso (codigo, nombre) VALUES
        ${valores}
      ON CONFLICT (codigo) DO NOTHING
    `)

    const lista = PERMISOS.map(([codigo]) => `'${codigo}'`).join(', ')

    await this.schema.raw(`
      INSERT INTO rol_permiso (id_rol, id_permiso)
      SELECT r.id_rol, p.id_permiso
      FROM rol r
      JOIN permiso p ON p.codigo IN (${lista})
      WHERE r.nombre = 'ADMINISTRADOR'
      ON CONFLICT (id_rol, id_permiso) DO NOTHING
    `)
  }

  async down() {
    const lista = PERMISOS.map(([codigo]) => `'${codigo}'`).join(', ')

    await this.schema.raw(`
      DELETE FROM rol_permiso
      USING permiso p
      WHERE rol_permiso.id_permiso = p.id_permiso
        AND p.codigo IN (${lista})
    `)

    await this.schema.raw(`DELETE FROM permiso WHERE codigo IN (${lista})`)
  }
}
