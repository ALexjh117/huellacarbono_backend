import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Permisos del módulo de unidades de medida. Solo se incorporan los cuatro
 * códigos nuevos y su asignación al rol ADMINISTRADOR existente; no se
 * tocan permisos ni tablas ajenas al módulo.
 */
const CODIGOS = [
  'unidad_medida.ver',
  'unidad_medida.crear',
  'unidad_medida.editar',
  'unidad_medida.eliminar',
]

export default class extends BaseSchema {
  async up() {
    await this.schema.raw(`
      INSERT INTO permiso (codigo, nombre) VALUES
        ('unidad_medida.ver', 'Ver unidades de medida'),
        ('unidad_medida.crear', 'Crear unidades de medida'),
        ('unidad_medida.editar', 'Actualizar unidades de medida'),
        ('unidad_medida.eliminar', 'Eliminar unidades de medida')
      ON CONFLICT (codigo) DO NOTHING
    `)

    await this.schema.raw(`
      INSERT INTO rol_permiso (id_rol, id_permiso)
      SELECT r.id_rol, p.id_permiso
      FROM rol r
      JOIN permiso p ON p.codigo IN (
        'unidad_medida.ver', 'unidad_medida.crear',
        'unidad_medida.editar', 'unidad_medida.eliminar'
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
