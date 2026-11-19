import { BaseSchema } from '@adonisjs/lucid/schema'

const CODIGOS = ['calculo_carbono.ver', 'calculo_carbono.crear']

export default class extends BaseSchema {
  async up() {
    await this.schema.raw(`
      INSERT INTO permiso (codigo, nombre) VALUES
        ('calculo_carbono.ver', 'Ver cálculos de carbono'),
        ('calculo_carbono.crear', 'Calcular la huella de carbono')
      ON CONFLICT (codigo) DO NOTHING
    `)

    await this.schema.raw(`
      INSERT INTO rol_permiso (id_rol, id_permiso)
      SELECT r.id_rol, p.id_permiso
      FROM rol r
      JOIN permiso p ON p.codigo IN ('calculo_carbono.ver', 'calculo_carbono.crear')
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
