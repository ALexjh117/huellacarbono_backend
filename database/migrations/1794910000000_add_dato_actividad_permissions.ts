import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Permisos del módulo de datos de actividad. Solo se incorporan los cuatro
 * códigos nuevos y su asignación al rol ADMINISTRADOR existente; no se
 * tocan permisos ni tablas ajenas al módulo.
 */
const CODIGOS = [
  'dato_actividad.ver',
  'dato_actividad.crear',
  'dato_actividad.editar',
  'dato_actividad.eliminar',
]

export default class extends BaseSchema {
  async up() {
    await this.schema.raw(`
      INSERT INTO permiso (codigo, nombre) VALUES
        ('dato_actividad.ver', 'Ver datos de actividad'),
        ('dato_actividad.crear', 'Crear datos de actividad'),
        ('dato_actividad.editar', 'Actualizar datos de actividad'),
        ('dato_actividad.eliminar', 'Eliminar datos de actividad')
      ON CONFLICT (codigo) DO NOTHING
    `)

    await this.schema.raw(`
      INSERT INTO rol_permiso (id_rol, id_permiso)
      SELECT r.id_rol, p.id_permiso
      FROM rol r
      JOIN permiso p ON p.codigo IN (
        'dato_actividad.ver', 'dato_actividad.crear',
        'dato_actividad.editar', 'dato_actividad.eliminar'
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
