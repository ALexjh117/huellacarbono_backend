import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Permisos del módulo de fuentes de emisión. Solo incorporan los cuatro
 * códigos nuevos y su asignación al rol ADMINISTRADOR existente; no se
 * tocan permisos ni tablas ajenas al módulo.
 */
const CODIGOS = [
  'fuente_emision.ver',
  'fuente_emision.crear',
  'fuente_emision.editar',
  'fuente_emision.eliminar',
]

export default class extends BaseSchema {
  async up() {
    await this.schema.raw(`
      INSERT INTO permiso (codigo, nombre) VALUES
        ('fuente_emision.ver', 'Ver fuentes de emisión'),
        ('fuente_emision.crear', 'Crear fuentes de emisión'),
        ('fuente_emision.editar', 'Actualizar fuentes de emisión'),
        ('fuente_emision.eliminar', 'Eliminar fuentes de emisión')
      ON CONFLICT (codigo) DO NOTHING
    `)

    await this.schema.raw(`
      INSERT INTO rol_permiso (id_rol, id_permiso)
      SELECT r.id_rol, p.id_permiso
      FROM rol r
      JOIN permiso p ON p.codigo IN (
        'fuente_emision.ver', 'fuente_emision.crear',
        'fuente_emision.editar', 'fuente_emision.eliminar'
      )
      WHERE r.nombre = 'ADMINISTRADOR'
      ON CONFLICT (id_rol, id_permiso) DO NOTHING
    `)
  }

  async down() {
    const list = CODIGOS.map((codigo) => `'${codigo}'`).join(', ')

    await this.schema.raw(`
      DELETE FROM rol_permiso
      USING permiso p
      WHERE rol_permiso.id_permiso = p.id_permiso
        AND p.codigo IN (${list})
    `)

    await this.schema.raw(`
      DELETE FROM permiso
      WHERE codigo IN (${list})
    `)
  }
}
