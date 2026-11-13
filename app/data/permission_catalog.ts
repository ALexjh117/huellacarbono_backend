/**
 * Catálogo de códigos que la API sabe autorizar. La asignación vive en
 * rol_permiso. Estos roles iniciales solo sirven para sembrar ADMINISTRADOR.
 */
export const SYSTEM_ROLE_SEEDS = [
  {
    nombre: 'ADMINISTRADOR',
    descripcion: 'Administracion general de usuarios, configuracion y seguridad',
  },
  {
    nombre: 'RESPONSABLE_AMBIENTAL',
    descripcion: 'Gestiona informacion ambiental y ejecuta calculos',
  },
  {
    nombre: 'ANALISTA_AMBIENTAL',
    descripcion: 'Analiza resultados, indicadores y tendencias',
  },
  {
    nombre: 'USUARIO_CONSULTA',
    descripcion: 'Consulta informacion y reportes autorizados',
  },
] as const

export type SystemRoleName = (typeof SYSTEM_ROLE_SEEDS)[number]['nombre']

const ADMIN: SystemRoleName = 'ADMINISTRADOR'

export const PERMISSIONS = [
  { code: 'usuario.ver', name: 'Ver usuarios', roles: [ADMIN] },
  { code: 'usuario.crear', name: 'Crear usuarios', roles: [ADMIN] },
  { code: 'usuario.editar', name: 'Actualizar usuarios', roles: [ADMIN] },
  { code: 'rol.ver', name: 'Ver roles', roles: [ADMIN] },
  { code: 'rol.crear', name: 'Crear roles', roles: [ADMIN] },
  { code: 'rol.editar', name: 'Actualizar roles', roles: [ADMIN] },
  { code: 'organizacion.ver', name: 'Ver organizaciones', roles: [ADMIN] },
  { code: 'organizacion.crear', name: 'Crear organizaciones', roles: [ADMIN] },
  { code: 'organizacion.editar', name: 'Editar organizaciones', roles: [ADMIN] },
  { code: 'organizacion.eliminar', name: 'Eliminar organizaciones', roles: [ADMIN] },
  { code: 'sede.ver', name: 'Ver sedes', roles: [ADMIN] },
  { code: 'sede.crear', name: 'Crear sedes', roles: [ADMIN] },
  { code: 'sede.editar', name: 'Editar sedes', roles: [ADMIN] },
  { code: 'sede.eliminar', name: 'Eliminar sedes', roles: [ADMIN] },
] as const

export type PermissionCode = (typeof PERMISSIONS)[number]['code']

const SYSTEM_ROLE_NAMES = new Set<string>(SYSTEM_ROLE_SEEDS.map((role) => role.nombre))

export function isSystemRole(nombre: string) {
  return SYSTEM_ROLE_NAMES.has(nombre)
}

const KNOWN_CODES = new Set<string>(PERMISSIONS.map((permission) => permission.code))

/** Códigos conocidos que ya vienen cargados en los permisos del rol. */
export function codigosDelRol(permisos: { codigo: string }[] | undefined): PermissionCode[] {
  return [
    ...new Set(
      (permisos ?? [])
        .map((permiso) => permiso.codigo)
        .filter((codigo): codigo is PermissionCode => KNOWN_CODES.has(codigo))
    ),
  ].sort()
}
