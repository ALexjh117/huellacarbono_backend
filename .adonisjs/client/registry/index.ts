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
  'municipios.options': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/municipios/options',
    tokens: [[0,"api"],[0,"v1"],[0,"municipios"],[0,"options"]],
    types: placeholder as Registry['municipios.options']['types'],
  },
  'municipios.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/municipios',
    tokens: [[0,"api"],[0,"v1"],[0,"municipios"]],
    types: placeholder as Registry['municipios.index']['types'],
  },
  'municipios.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/municipios/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"municipios"],[1,"id"]],
    types: placeholder as Registry['municipios.show']['types'],
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
