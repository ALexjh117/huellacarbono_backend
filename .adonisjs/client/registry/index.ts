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
  'catalogos.projects': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/projects',
    tokens: [[0,"api"],[0,"v1"],[0,"projects"]],
    types: placeholder as Registry['catalogos.projects']['types'],
  },
  'catalogos.activities': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/activities',
    tokens: [[0,"api"],[0,"v1"],[0,"activities"]],
    types: placeholder as Registry['catalogos.activities']['types'],
  },
  'catalogos.periods': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/periods',
    tokens: [[0,"api"],[0,"v1"],[0,"periods"]],
    types: placeholder as Registry['catalogos.periods']['types'],
  },
  'catalogos.emission-sources': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/emission-sources',
    tokens: [[0,"api"],[0,"v1"],[0,"emission-sources"]],
    types: placeholder as Registry['catalogos.emission-sources']['types'],
  },
  'catalogos.emission-scopes': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/emission-scopes',
    tokens: [[0,"api"],[0,"v1"],[0,"emission-scopes"]],
    types: placeholder as Registry['catalogos.emission-scopes']['types'],
  },
  'activity-data.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/activity-data',
    tokens: [[0,"api"],[0,"v1"],[0,"activity-data"]],
    types: placeholder as Registry['activity-data.index']['types'],
  },
  'activity-data.store': {
    methods: ["POST"],
    pattern: '/api/v1/activity-data',
    tokens: [[0,"api"],[0,"v1"],[0,"activity-data"]],
    types: placeholder as Registry['activity-data.store']['types'],
  },
  'activity-data.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/activity-data/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"activity-data"],[1,"id"]],
    types: placeholder as Registry['activity-data.show']['types'],
  },
  'activity-data.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/activity-data/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"activity-data"],[1,"id"]],
    types: placeholder as Registry['activity-data.update']['types'],
  },
  'activity-data.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/activity-data/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"activity-data"],[1,"id"]],
    types: placeholder as Registry['activity-data.destroy']['types'],
  },
  'permissions.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/permissions',
    tokens: [[0,"api"],[0,"v1"],[0,"permissions"]],
    types: placeholder as Registry['permissions.index']['types'],
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
