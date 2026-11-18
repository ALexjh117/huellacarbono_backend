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
  measurementUnits: {
    index: typeof routes['measurement-units.index']
    store: typeof routes['measurement-units.store']
    show: typeof routes['measurement-units.show']
    update: typeof routes['measurement-units.update']
    destroy: typeof routes['measurement-units.destroy']
  }
  catalogos: {
    projects: typeof routes['catalogos.projects']
    activities: typeof routes['catalogos.activities']
    periods: typeof routes['catalogos.periods']
    emissionSources: typeof routes['catalogos.emission-sources']
    emissionScopes: typeof routes['catalogos.emission-scopes']
  }
  activityData: {
    index: typeof routes['activity-data.index']
    store: typeof routes['activity-data.store']
    show: typeof routes['activity-data.show']
    update: typeof routes['activity-data.update']
    destroy: typeof routes['activity-data.destroy']
  }
  permissions: {
    index: typeof routes['permissions.index']
  }
}
