import { PERMISSIONS, SYSTEM_ROLE_SEEDS } from '#data/permission_catalog'
import Permiso from '#models/permiso'
import Rol from '#models/rol'
import Usuario from '#models/usuario'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

const ADMIN_EMAIL = 'admin@huellacarbono.local'
const ADMIN_PASSWORD = 'Cambiar123'

export default class RolSeeder extends BaseSeeder {
  async run() {
    for (const role of SYSTEM_ROLE_SEEDS) {
      await Rol.updateOrCreate(
        { nombre: role.nombre },
        { descripcion: role.descripcion, estado: true }
      )
    }

    let admin = await Usuario.findBy('email', ADMIN_EMAIL)
    if (!admin) {
      admin = await Usuario.create({
        nombres: 'Administrador',
        apellidos: 'Sistema',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        estado: true,
      })
    }

    await admin.load('roles')
    const alreadyAdmin = admin.roles.some((role) => role.nombre === 'ADMINISTRADOR')
    if (!alreadyAdmin) {
      const role = await Rol.findByOrFail('nombre', 'ADMINISTRADOR')
      await admin.related('roles').attach([role.id])
    }

    await this.sembrarPermisos()
  }

  private async sembrarPermisos() {
    for (const permission of PERMISSIONS) {
      await Permiso.updateOrCreate({ codigo: permission.code }, { nombre: permission.name })
    }

    const adminRole = await Rol.findByOrFail('nombre', 'ADMINISTRADOR')
    await adminRole.load('permisos')
    const asignados = new Set(adminRole.permisos.map((permiso) => permiso.codigo))
    const delAdministrador = PERMISSIONS.filter((permission) =>
      (permission.roles as readonly string[]).includes('ADMINISTRADOR')
    ).map((permission) => permission.code)
    const faltantes = await Permiso.query().whereIn(
      'codigo',
      delAdministrador.filter((codigo) => !asignados.has(codigo))
    )

    if (faltantes.length > 0) {
      await adminRole.related('permisos').attach(faltantes.map((permiso) => permiso.id))
    }
  }
}
