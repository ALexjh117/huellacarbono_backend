/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'auth.login': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"login"]],
    types: placeholder as Registry['auth.login']['types'],
  },
  'account.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"profile"]],
    types: placeholder as Registry['account.show']['types'],
  },
  'account.logout': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"logout"]],
    types: placeholder as Registry['account.logout']['types'],
  },
  'users.options': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/users/options',
    tokens: [[0,"api"],[0,"v1"],[0,"users"],[0,"options"]],
    types: placeholder as Registry['users.options']['types'],
  },
  'users.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/users',
    tokens: [[0,"api"],[0,"v1"],[0,"users"]],
    types: placeholder as Registry['users.index']['types'],
  },
  'users.store': {
    methods: ["POST"],
    pattern: '/api/v1/users',
    tokens: [[0,"api"],[0,"v1"],[0,"users"]],
    types: placeholder as Registry['users.store']['types'],
  },
  'users.roles': {
    methods: ["PUT"],
    pattern: '/api/v1/users/:id/roles',
    tokens: [[0,"api"],[0,"v1"],[0,"users"],[1,"id"],[0,"roles"]],
    types: placeholder as Registry['users.roles']['types'],
  },
  'users.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/users/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"users"],[1,"id"]],
    types: placeholder as Registry['users.show']['types'],
  },
  'users.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/users/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"users"],[1,"id"]],
    types: placeholder as Registry['users.update']['types'],
  },
  'roles.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/roles',
    tokens: [[0,"api"],[0,"v1"],[0,"roles"]],
    types: placeholder as Registry['roles.index']['types'],
  },
  'roles.store': {
    methods: ["POST"],
    pattern: '/api/v1/roles',
    tokens: [[0,"api"],[0,"v1"],[0,"roles"]],
    types: placeholder as Registry['roles.store']['types'],
  },
  'roles.permissions': {
    methods: ["PUT"],
    pattern: '/api/v1/roles/:id/permissions',
    tokens: [[0,"api"],[0,"v1"],[0,"roles"],[1,"id"],[0,"permissions"]],
    types: placeholder as Registry['roles.permissions']['types'],
  },
  'roles.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/roles/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"roles"],[1,"id"]],
    types: placeholder as Registry['roles.show']['types'],
  },
  'roles.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/roles/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"roles"],[1,"id"]],
    types: placeholder as Registry['roles.update']['types'],
  },
  'measurement-units.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/measurement-units',
    tokens: [[0,"api"],[0,"v1"],[0,"measurement-units"]],
    types: placeholder as Registry['measurement-units.index']['types'],
  },
  'measurement-units.store': {
    methods: ["POST"],
    pattern: '/api/v1/measurement-units',
    tokens: [[0,"api"],[0,"v1"],[0,"measurement-units"]],
    types: placeholder as Registry['measurement-units.store']['types'],
  },
  'measurement-units.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/measurement-units/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"measurement-units"],[1,"id"]],
    types: placeholder as Registry['measurement-units.show']['types'],
  },
  'measurement-units.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/measurement-units/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"measurement-units"],[1,"id"]],
    types: placeholder as Registry['measurement-units.update']['types'],
  },
  'measurement-units.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/measurement-units/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"measurement-units"],[1,"id"]],
    types: placeholder as Registry['measurement-units.destroy']['types'],
  },
  'permissions.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/permissions',
    tokens: [[0,"api"],[0,"v1"],[0,"permissions"]],
    types: placeholder as Registry['permissions.index']['types'],
  },
  'territorio.departamentos': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/territorio/departamentos',
    tokens: [[0,"api"],[0,"v1"],[0,"territorio"],[0,"departamentos"]],
    types: placeholder as Registry['territorio.departamentos']['types'],
  },
  'territorio.municipios': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/territorio/municipios',
    tokens: [[0,"api"],[0,"v1"],[0,"territorio"],[0,"municipios"]],
    types: placeholder as Registry['territorio.municipios']['types'],
  },
  'organizaciones.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/organizaciones',
    tokens: [[0,"api"],[0,"v1"],[0,"organizaciones"]],
    types: placeholder as Registry['organizaciones.index']['types'],
  },
  'organizaciones.store': {
    methods: ["POST"],
    pattern: '/api/v1/organizaciones',
    tokens: [[0,"api"],[0,"v1"],[0,"organizaciones"]],
    types: placeholder as Registry['organizaciones.store']['types'],
  },
  'organizaciones.sedes.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/organizaciones/:id/sedes',
    tokens: [[0,"api"],[0,"v1"],[0,"organizaciones"],[1,"id"],[0,"sedes"]],
    types: placeholder as Registry['organizaciones.sedes.index']['types'],
  },
  'organizaciones.sedes.store': {
    methods: ["POST"],
    pattern: '/api/v1/organizaciones/:id/sedes',
    tokens: [[0,"api"],[0,"v1"],[0,"organizaciones"],[1,"id"],[0,"sedes"]],
    types: placeholder as Registry['organizaciones.sedes.store']['types'],
  },
  'organizaciones.periodos.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/organizaciones/:id/periodos',
    tokens: [[0,"api"],[0,"v1"],[0,"organizaciones"],[1,"id"],[0,"periodos"]],
    types: placeholder as Registry['organizaciones.periodos.index']['types'],
  },
  'organizaciones.periodos.store': {
    methods: ["POST"],
    pattern: '/api/v1/organizaciones/:id/periodos',
    tokens: [[0,"api"],[0,"v1"],[0,"organizaciones"],[1,"id"],[0,"periodos"]],
    types: placeholder as Registry['organizaciones.periodos.store']['types'],
  },
  'organizaciones.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/organizaciones/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"organizaciones"],[1,"id"]],
    types: placeholder as Registry['organizaciones.show']['types'],
  },
  'organizaciones.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/organizaciones/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"organizaciones"],[1,"id"]],
    types: placeholder as Registry['organizaciones.update']['types'],
  },
  'periodos.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/periodos/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"periodos"],[1,"id"]],
    types: placeholder as Registry['periodos.update']['types'],
  },
  'sedes.procesos.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/sedes/:id/procesos',
    tokens: [[0,"api"],[0,"v1"],[0,"sedes"],[1,"id"],[0,"procesos"]],
    types: placeholder as Registry['sedes.procesos.index']['types'],
  },
  'sedes.procesos.store': {
    methods: ["POST"],
    pattern: '/api/v1/sedes/:id/procesos',
    tokens: [[0,"api"],[0,"v1"],[0,"sedes"],[1,"id"],[0,"procesos"]],
    types: placeholder as Registry['sedes.procesos.store']['types'],
  },
  'sedes.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/sedes/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"sedes"],[1,"id"]],
    types: placeholder as Registry['sedes.show']['types'],
  },
  'sedes.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/sedes/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"sedes"],[1,"id"]],
    types: placeholder as Registry['sedes.update']['types'],
  },
  'sedes.usuarios': {
    methods: ["PUT"],
    pattern: '/api/v1/sedes/:id/usuarios',
    tokens: [[0,"api"],[0,"v1"],[0,"sedes"],[1,"id"],[0,"usuarios"]],
    types: placeholder as Registry['sedes.usuarios']['types'],
  },
  'procesos.actividades.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/procesos/:id/actividades',
    tokens: [[0,"api"],[0,"v1"],[0,"procesos"],[1,"id"],[0,"actividades"]],
    types: placeholder as Registry['procesos.actividades.index']['types'],
  },
  'procesos.actividades.store': {
    methods: ["POST"],
    pattern: '/api/v1/procesos/:id/actividades',
    tokens: [[0,"api"],[0,"v1"],[0,"procesos"],[1,"id"],[0,"actividades"]],
    types: placeholder as Registry['procesos.actividades.store']['types'],
  },
  'procesos.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/procesos/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"procesos"],[1,"id"]],
    types: placeholder as Registry['procesos.show']['types'],
  },
  'procesos.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/procesos/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"procesos"],[1,"id"]],
    types: placeholder as Registry['procesos.update']['types'],
  },
  'actividades.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/actividades/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"actividades"],[1,"id"]],
    types: placeholder as Registry['actividades.update']['types'],
  },
  'tiposAgua.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/tipos-agua',
    tokens: [[0,"api"],[0,"v1"],[0,"tipos-agua"]],
    types: placeholder as Registry['tiposAgua.index']['types'],
  },
  'tiposAgua.store': {
    methods: ["POST"],
    pattern: '/api/v1/tipos-agua',
    tokens: [[0,"api"],[0,"v1"],[0,"tipos-agua"]],
    types: placeholder as Registry['tiposAgua.store']['types'],
  },
  'tiposAgua.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/tipos-agua/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"tipos-agua"],[1,"id"]],
    types: placeholder as Registry['tiposAgua.show']['types'],
  },
  'tiposAgua.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/tipos-agua/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"tipos-agua"],[1,"id"]],
    types: placeholder as Registry['tiposAgua.update']['types'],
  },
  'componentesHidricos.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/componentes-hidricos',
    tokens: [[0,"api"],[0,"v1"],[0,"componentes-hidricos"]],
    types: placeholder as Registry['componentesHidricos.index']['types'],
  },
  'componentesHidricos.store': {
    methods: ["POST"],
    pattern: '/api/v1/componentes-hidricos',
    tokens: [[0,"api"],[0,"v1"],[0,"componentes-hidricos"]],
    types: placeholder as Registry['componentesHidricos.store']['types'],
  },
  'componentesHidricos.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/componentes-hidricos/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"componentes-hidricos"],[1,"id"]],
    types: placeholder as Registry['componentesHidricos.show']['types'],
  },
  'componentesHidricos.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/componentes-hidricos/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"componentes-hidricos"],[1,"id"]],
    types: placeholder as Registry['componentesHidricos.update']['types'],
  },
  'alcancesEmision.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/alcances-emision',
    tokens: [[0,"api"],[0,"v1"],[0,"alcances-emision"]],
    types: placeholder as Registry['alcancesEmision.index']['types'],
  },
  'alcancesEmision.store': {
    methods: ["POST"],
    pattern: '/api/v1/alcances-emision',
    tokens: [[0,"api"],[0,"v1"],[0,"alcances-emision"]],
    types: placeholder as Registry['alcancesEmision.store']['types'],
  },
  'alcancesEmision.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/alcances-emision/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"alcances-emision"],[1,"id"]],
    types: placeholder as Registry['alcancesEmision.show']['types'],
  },
  'alcancesEmision.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/alcances-emision/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"alcances-emision"],[1,"id"]],
    types: placeholder as Registry['alcancesEmision.update']['types'],
  },
  'metodologias.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/metodologias',
    tokens: [[0,"api"],[0,"v1"],[0,"metodologias"]],
    types: placeholder as Registry['metodologias.index']['types'],
  },
  'metodologias.store': {
    methods: ["POST"],
    pattern: '/api/v1/metodologias',
    tokens: [[0,"api"],[0,"v1"],[0,"metodologias"]],
    types: placeholder as Registry['metodologias.store']['types'],
  },
  'metodologias.versiones': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/metodologias/:id/versiones',
    tokens: [[0,"api"],[0,"v1"],[0,"metodologias"],[1,"id"],[0,"versiones"]],
    types: placeholder as Registry['metodologias.versiones']['types'],
  },
  'metodologias.versiones.store': {
    methods: ["POST"],
    pattern: '/api/v1/metodologias/:id/versiones',
    tokens: [[0,"api"],[0,"v1"],[0,"metodologias"],[1,"id"],[0,"versiones"]],
    types: placeholder as Registry['metodologias.versiones.store']['types'],
  },
  'metodologias.versiones.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/metodologias/:id/versiones/:versionId',
    tokens: [[0,"api"],[0,"v1"],[0,"metodologias"],[1,"id"],[0,"versiones"],[1,"versionId"]],
    types: placeholder as Registry['metodologias.versiones.update']['types'],
  },
  'metodologias.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/metodologias/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"metodologias"],[1,"id"]],
    types: placeholder as Registry['metodologias.show']['types'],
  },
  'metodologias.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/metodologias/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"metodologias"],[1,"id"]],
    types: placeholder as Registry['metodologias.update']['types'],
  },
  'factoresEmision.opciones': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/factores-emision/opciones',
    tokens: [[0,"api"],[0,"v1"],[0,"factores-emision"],[0,"opciones"]],
    types: placeholder as Registry['factoresEmision.opciones']['types'],
  },
  'factoresEmision.cobertura': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/factores-emision/cobertura',
    tokens: [[0,"api"],[0,"v1"],[0,"factores-emision"],[0,"cobertura"]],
    types: placeholder as Registry['factoresEmision.cobertura']['types'],
  },
  'factoresEmision.importaciones.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/factores-emision/importaciones',
    tokens: [[0,"api"],[0,"v1"],[0,"factores-emision"],[0,"importaciones"]],
    types: placeholder as Registry['factoresEmision.importaciones.index']['types'],
  },
  'factoresEmision.importaciones.previsualizar': {
    methods: ["POST"],
    pattern: '/api/v1/factores-emision/importaciones',
    tokens: [[0,"api"],[0,"v1"],[0,"factores-emision"],[0,"importaciones"]],
    types: placeholder as Registry['factoresEmision.importaciones.previsualizar']['types'],
  },
  'factoresEmision.importaciones.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/factores-emision/importaciones/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"factores-emision"],[0,"importaciones"],[1,"id"]],
    types: placeholder as Registry['factoresEmision.importaciones.show']['types'],
  },
  'factoresEmision.importaciones.aplicar': {
    methods: ["POST"],
    pattern: '/api/v1/factores-emision/importaciones/:id/aplicar',
    tokens: [[0,"api"],[0,"v1"],[0,"factores-emision"],[0,"importaciones"],[1,"id"],[0,"aplicar"]],
    types: placeholder as Registry['factoresEmision.importaciones.aplicar']['types'],
  },
  'factoresEmision.importaciones.rechazar': {
    methods: ["POST"],
    pattern: '/api/v1/factores-emision/importaciones/:id/rechazar',
    tokens: [[0,"api"],[0,"v1"],[0,"factores-emision"],[0,"importaciones"],[1,"id"],[0,"rechazar"]],
    types: placeholder as Registry['factoresEmision.importaciones.rechazar']['types'],
  },
  'factoresEmision.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/factores-emision',
    tokens: [[0,"api"],[0,"v1"],[0,"factores-emision"]],
    types: placeholder as Registry['factoresEmision.index']['types'],
  },
  'factoresEmision.store': {
    methods: ["POST"],
    pattern: '/api/v1/factores-emision',
    tokens: [[0,"api"],[0,"v1"],[0,"factores-emision"]],
    types: placeholder as Registry['factoresEmision.store']['types'],
  },
  'factoresEmision.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/factores-emision/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"factores-emision"],[1,"id"]],
    types: placeholder as Registry['factoresEmision.show']['types'],
  },
  'factoresEmision.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/factores-emision/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"factores-emision"],[1,"id"]],
    types: placeholder as Registry['factoresEmision.update']['types'],
  },
  'parametrosHidricos.opciones': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/parametros-hidricos/opciones',
    tokens: [[0,"api"],[0,"v1"],[0,"parametros-hidricos"],[0,"opciones"]],
    types: placeholder as Registry['parametrosHidricos.opciones']['types'],
  },
  'parametrosHidricos.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/parametros-hidricos',
    tokens: [[0,"api"],[0,"v1"],[0,"parametros-hidricos"]],
    types: placeholder as Registry['parametrosHidricos.index']['types'],
  },
  'parametrosHidricos.store': {
    methods: ["POST"],
    pattern: '/api/v1/parametros-hidricos',
    tokens: [[0,"api"],[0,"v1"],[0,"parametros-hidricos"]],
    types: placeholder as Registry['parametrosHidricos.store']['types'],
  },
  'parametrosHidricos.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/parametros-hidricos/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"parametros-hidricos"],[1,"id"]],
    types: placeholder as Registry['parametrosHidricos.show']['types'],
  },
  'parametrosHidricos.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/parametros-hidricos/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"parametros-hidricos"],[1,"id"]],
    types: placeholder as Registry['parametrosHidricos.update']['types'],
  },
  'datosActividadCarbono.opciones': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/datos-actividad-carbono/opciones',
    tokens: [[0,"api"],[0,"v1"],[0,"datos-actividad-carbono"],[0,"opciones"]],
    types: placeholder as Registry['datosActividadCarbono.opciones']['types'],
  },
  'datosActividadCarbono.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/datos-actividad-carbono',
    tokens: [[0,"api"],[0,"v1"],[0,"datos-actividad-carbono"]],
    types: placeholder as Registry['datosActividadCarbono.index']['types'],
  },
  'datosActividadCarbono.store': {
    methods: ["POST"],
    pattern: '/api/v1/datos-actividad-carbono',
    tokens: [[0,"api"],[0,"v1"],[0,"datos-actividad-carbono"]],
    types: placeholder as Registry['datosActividadCarbono.store']['types'],
  },
  'datosActividadCarbono.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/datos-actividad-carbono/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"datos-actividad-carbono"],[1,"id"]],
    types: placeholder as Registry['datosActividadCarbono.show']['types'],
  },
  'datosActividadCarbono.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/datos-actividad-carbono/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"datos-actividad-carbono"],[1,"id"]],
    types: placeholder as Registry['datosActividadCarbono.update']['types'],
  },
  'calculosCarbono.opciones': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/calculos-carbono/opciones',
    tokens: [[0,"api"],[0,"v1"],[0,"calculos-carbono"],[0,"opciones"]],
    types: placeholder as Registry['calculosCarbono.opciones']['types'],
  },
  'calculosCarbono.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/calculos-carbono',
    tokens: [[0,"api"],[0,"v1"],[0,"calculos-carbono"]],
    types: placeholder as Registry['calculosCarbono.index']['types'],
  },
  'calculosCarbono.resumen': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/calculos-carbono/resumen',
    tokens: [[0,"api"],[0,"v1"],[0,"calculos-carbono"],[0,"resumen"]],
    types: placeholder as Registry['calculosCarbono.resumen']['types'],
  },
  'calculosCarbono.coberturaFactores': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/calculos-carbono/cobertura-factores',
    tokens: [[0,"api"],[0,"v1"],[0,"calculos-carbono"],[0,"cobertura-factores"]],
    types: placeholder as Registry['calculosCarbono.coberturaFactores']['types'],
  },
  'calculosCarbono.store': {
    methods: ["POST"],
    pattern: '/api/v1/calculos-carbono',
    tokens: [[0,"api"],[0,"v1"],[0,"calculos-carbono"]],
    types: placeholder as Registry['calculosCarbono.store']['types'],
  },
  'calculosCarbono.informe': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/calculos-carbono/:id/informe',
    tokens: [[0,"api"],[0,"v1"],[0,"calculos-carbono"],[1,"id"],[0,"informe"]],
    types: placeholder as Registry['calculosCarbono.informe']['types'],
  },
  'calculosCarbono.reduccion': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/calculos-carbono/:id/reduccion',
    tokens: [[0,"api"],[0,"v1"],[0,"calculos-carbono"],[1,"id"],[0,"reduccion"]],
    types: placeholder as Registry['calculosCarbono.reduccion']['types'],
  },
  'calculosCarbono.guardarReduccion': {
    methods: ["PUT"],
    pattern: '/api/v1/calculos-carbono/:id/reduccion',
    tokens: [[0,"api"],[0,"v1"],[0,"calculos-carbono"],[1,"id"],[0,"reduccion"]],
    types: placeholder as Registry['calculosCarbono.guardarReduccion']['types'],
  },
  'calculosCarbono.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/calculos-carbono/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"calculos-carbono"],[1,"id"]],
    types: placeholder as Registry['calculosCarbono.show']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
