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
  { code: 'unidad_medida.ver', name: 'Ver unidades de medida', roles: [ADMIN] },
  { code: 'unidad_medida.crear', name: 'Crear unidades de medida', roles: [ADMIN] },
  { code: 'unidad_medida.editar', name: 'Actualizar unidades de medida', roles: [ADMIN] },
  { code: 'unidad_medida.eliminar', name: 'Eliminar unidades de medida', roles: [ADMIN] },
  { code: 'organizacion.ver', name: 'Ver organizaciones', roles: [ADMIN] },
  { code: 'organizacion.crear', name: 'Crear organizaciones', roles: [ADMIN] },
  { code: 'organizacion.editar', name: 'Actualizar organizaciones', roles: [ADMIN] },
  { code: 'sede.ver', name: 'Ver sedes', roles: [ADMIN] },
  { code: 'sede.crear', name: 'Crear sedes', roles: [ADMIN] },
  { code: 'sede.editar', name: 'Actualizar sedes', roles: [ADMIN] },
  { code: 'proceso.ver', name: 'Ver procesos', roles: [ADMIN] },
  { code: 'proceso.crear', name: 'Crear procesos', roles: [ADMIN] },
  { code: 'proceso.editar', name: 'Actualizar procesos', roles: [ADMIN] },
  { code: 'actividad.ver', name: 'Ver actividades', roles: [ADMIN] },
  { code: 'actividad.crear', name: 'Crear actividades', roles: [ADMIN] },
  { code: 'actividad.editar', name: 'Actualizar actividades', roles: [ADMIN] },
  { code: 'tipo_agua.ver', name: 'Ver tipos de agua', roles: [ADMIN] },
  { code: 'tipo_agua.crear', name: 'Crear tipos de agua', roles: [ADMIN] },
  { code: 'tipo_agua.editar', name: 'Actualizar tipos de agua', roles: [ADMIN] },
  { code: 'componente_hidrico.ver', name: 'Ver componentes hídricos', roles: [ADMIN] },
  { code: 'componente_hidrico.crear', name: 'Crear componentes hídricos', roles: [ADMIN] },
  { code: 'componente_hidrico.editar', name: 'Actualizar componentes hídricos', roles: [ADMIN] },
  { code: 'alcance_emision.ver', name: 'Ver alcances de emisión', roles: [ADMIN] },
  { code: 'alcance_emision.crear', name: 'Crear alcances de emisión', roles: [ADMIN] },
  { code: 'alcance_emision.editar', name: 'Actualizar alcances de emisión', roles: [ADMIN] },
  { code: 'metodologia.ver', name: 'Ver metodologías', roles: [ADMIN] },
  { code: 'metodologia.crear', name: 'Crear metodologías', roles: [ADMIN] },
  { code: 'metodologia.editar', name: 'Actualizar metodologías', roles: [ADMIN] },
  { code: 'factor_emision.ver', name: 'Ver factores de emisión', roles: [ADMIN] },
  { code: 'factor_emision.crear', name: 'Crear factores de emisión', roles: [ADMIN] },
  { code: 'factor_emision.editar', name: 'Actualizar factores de emisión', roles: [ADMIN] },
  { code: 'parametro_hidrico.ver', name: 'Ver parámetros hídricos', roles: [ADMIN] },
  { code: 'parametro_hidrico.crear', name: 'Crear parámetros hídricos', roles: [ADMIN] },
  { code: 'parametro_hidrico.editar', name: 'Actualizar parámetros hídricos', roles: [ADMIN] },
  { code: 'dato_actividad.ver', name: 'Ver datos de actividad', roles: [ADMIN] },
  { code: 'dato_actividad.crear', name: 'Crear datos de actividad', roles: [ADMIN] },
  { code: 'dato_actividad.editar', name: 'Actualizar datos de actividad', roles: [ADMIN] },
  { code: 'dato_actividad.eliminar', name: 'Eliminar datos de actividad', roles: [ADMIN] },
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
