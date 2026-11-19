import { BaseSchema } from '@adonisjs/lucid/schema'

const CODIGOS = [
  'dato_actividad_carbono.ver',
  'dato_actividad_carbono.crear',
  'dato_actividad_carbono.editar',
]

export default class extends BaseSchema {
  async up() {
    await this.schema.raw(`
      INSERT INTO permiso (codigo, nombre) VALUES
        ('dato_actividad_carbono.ver', 'Ver papeles de carbono'),
        ('dato_actividad_carbono.crear', 'Registrar papeles de carbono'),
        ('dato_actividad_carbono.editar', 'Actualizar papeles de carbono')
      ON CONFLICT (codigo) DO NOTHING
    `)

    await this.schema.raw(`
      INSERT INTO rol_permiso (id_rol, id_permiso)
      SELECT r.id_rol, p.id_permiso
      FROM rol r
      JOIN permiso p ON p.codigo IN (
        'dato_actividad_carbono.ver',
        'dato_actividad_carbono.crear',
        'dato_actividad_carbono.editar'
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
