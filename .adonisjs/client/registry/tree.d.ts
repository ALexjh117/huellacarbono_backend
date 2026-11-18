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
  permissions: {
    index: typeof routes['permissions.index']
  }
  territorio: {
    departamentos: typeof routes['territorio.departamentos']
    municipios: typeof routes['territorio.municipios']
  }
  organizaciones: {
    index: typeof routes['organizaciones.index']
    store: typeof routes['organizaciones.store']
    sedes: {
      index: typeof routes['organizaciones.sedes.index']
      store: typeof routes['organizaciones.sedes.store']
    }
    show: typeof routes['organizaciones.show']
    update: typeof routes['organizaciones.update']
  }
  sedes: {
    procesos: {
      index: typeof routes['sedes.procesos.index']
      store: typeof routes['sedes.procesos.store']
    }
    show: typeof routes['sedes.show']
    update: typeof routes['sedes.update']
    usuarios: typeof routes['sedes.usuarios']
  }
  procesos: {
    actividades: {
      index: typeof routes['procesos.actividades.index']
      store: typeof routes['procesos.actividades.store']
    }
    show: typeof routes['procesos.show']
    update: typeof routes['procesos.update']
  }
  actividades: {
    update: typeof routes['actividades.update']
  }
  tiposAgua: {
    index: typeof routes['tiposAgua.index']
    store: typeof routes['tiposAgua.store']
    show: typeof routes['tiposAgua.show']
    update: typeof routes['tiposAgua.update']
  }
  componentesHidricos: {
    index: typeof routes['componentesHidricos.index']
    store: typeof routes['componentesHidricos.store']
    show: typeof routes['componentesHidricos.show']
    update: typeof routes['componentesHidricos.update']
  }
  alcancesEmision: {
    index: typeof routes['alcancesEmision.index']
    store: typeof routes['alcancesEmision.store']
    show: typeof routes['alcancesEmision.show']
    update: typeof routes['alcancesEmision.update']
  }
  metodologias: {
    index: typeof routes['metodologias.index']
    store: typeof routes['metodologias.store']
    versiones: typeof routes['metodologias.versiones'] & {
      store: typeof routes['metodologias.versiones.store']
      update: typeof routes['metodologias.versiones.update']
    }
    show: typeof routes['metodologias.show']
    update: typeof routes['metodologias.update']
  }
  fuentesEmision: {
    index: typeof routes['fuentesEmision.index']
    store: typeof routes['fuentesEmision.store']
    show: typeof routes['fuentesEmision.show']
    update: typeof routes['fuentesEmision.update']
    destroy: typeof routes['fuentesEmision.destroy']
  }
  factoresEmision: {
    opciones: typeof routes['factoresEmision.opciones']
    index: typeof routes['factoresEmision.index']
    store: typeof routes['factoresEmision.store']
    show: typeof routes['factoresEmision.show']
    update: typeof routes['factoresEmision.update']
  }
  parametrosHidricos: {
    opciones: typeof routes['parametrosHidricos.opciones']
    index: typeof routes['parametrosHidricos.index']
    store: typeof routes['parametrosHidricos.store']
    show: typeof routes['parametrosHidricos.show']
    update: typeof routes['parametrosHidricos.update']
  }
}
