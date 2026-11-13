/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    login: typeof routes['auth.login']
  }
  account: {
    show: typeof routes['account.show']
    logout: typeof routes['account.logout']
  }
  users: {
    options: typeof routes['users.options']
    index: typeof routes['users.index']
    store: typeof routes['users.store']
    roles: typeof routes['users.roles']
    show: typeof routes['users.show']
    update: typeof routes['users.update']
  }
  roles: {
    index: typeof routes['roles.index']
    store: typeof routes['roles.store']
    permissions: typeof routes['roles.permissions']
    show: typeof routes['roles.show']
    update: typeof routes['roles.update']
  }
  organizaciones: {
    index: typeof routes['organizaciones.index']
    store: typeof routes['organizaciones.store']
    show: typeof routes['organizaciones.show']
    update: typeof routes['organizaciones.update']
    destroy: typeof routes['organizaciones.destroy']
  }
  sedes: {
    index: typeof routes['sedes.index']
    store: typeof routes['sedes.store']
    show: typeof routes['sedes.show']
    update: typeof routes['sedes.update']
    destroy: typeof routes['sedes.destroy']
  }
  permissions: {
    index: typeof routes['permissions.index']
  }
}
