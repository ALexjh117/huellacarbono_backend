import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'account.show': { paramsTuple?: []; params?: {} }
    'account.logout': { paramsTuple?: []; params?: {} }
    'users.options': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'users.roles': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.store': { paramsTuple?: []; params?: {} }
    'roles.permissions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'measurement-units.index': { paramsTuple?: []; params?: {} }
    'measurement-units.store': { paramsTuple?: []; params?: {} }
    'measurement-units.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'measurement-units.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'measurement-units.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'catalogos.projects': { paramsTuple?: []; params?: {} }
    'catalogos.activities': { paramsTuple?: []; params?: {} }
    'catalogos.periods': { paramsTuple?: []; params?: {} }
    'catalogos.emission-sources': { paramsTuple?: []; params?: {} }
    'catalogos.emission-scopes': { paramsTuple?: []; params?: {} }
    'activity-data.index': { paramsTuple?: []; params?: {} }
    'activity-data.store': { paramsTuple?: []; params?: {} }
    'activity-data.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity-data.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity-data.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'permissions.index': { paramsTuple?: []; params?: {} }
    'territorio.departamentos': { paramsTuple?: []; params?: {} }
    'territorio.municipios': { paramsTuple?: []; params?: {} }
    'organizaciones.index': { paramsTuple?: []; params?: {} }
    'organizaciones.store': { paramsTuple?: []; params?: {} }
    'organizaciones.sedes.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizaciones.sedes.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizaciones.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizaciones.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sedes.procesos.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sedes.procesos.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sedes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sedes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sedes.usuarios': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'procesos.actividades.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'procesos.actividades.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'procesos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'procesos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'actividades.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tiposAgua.index': { paramsTuple?: []; params?: {} }
    'tiposAgua.store': { paramsTuple?: []; params?: {} }
    'tiposAgua.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tiposAgua.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'componentesHidricos.index': { paramsTuple?: []; params?: {} }
    'componentesHidricos.store': { paramsTuple?: []; params?: {} }
    'componentesHidricos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'componentesHidricos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'alcancesEmision.index': { paramsTuple?: []; params?: {} }
    'alcancesEmision.store': { paramsTuple?: []; params?: {} }
    'alcancesEmision.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'alcancesEmision.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'metodologias.index': { paramsTuple?: []; params?: {} }
    'metodologias.store': { paramsTuple?: []; params?: {} }
    'metodologias.versiones': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'metodologias.versiones.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'metodologias.versiones.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'versionId': ParamValue} }
    'metodologias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'metodologias.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'factoresEmision.opciones': { paramsTuple?: []; params?: {} }
    'factoresEmision.index': { paramsTuple?: []; params?: {} }
    'factoresEmision.store': { paramsTuple?: []; params?: {} }
    'factoresEmision.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'factoresEmision.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'parametrosHidricos.opciones': { paramsTuple?: []; params?: {} }
    'parametrosHidricos.index': { paramsTuple?: []; params?: {} }
    'parametrosHidricos.store': { paramsTuple?: []; params?: {} }
    'parametrosHidricos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'parametrosHidricos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'account.show': { paramsTuple?: []; params?: {} }
    'users.options': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'measurement-units.index': { paramsTuple?: []; params?: {} }
    'measurement-units.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'catalogos.projects': { paramsTuple?: []; params?: {} }
    'catalogos.activities': { paramsTuple?: []; params?: {} }
    'catalogos.periods': { paramsTuple?: []; params?: {} }
    'catalogos.emission-sources': { paramsTuple?: []; params?: {} }
    'catalogos.emission-scopes': { paramsTuple?: []; params?: {} }
    'activity-data.index': { paramsTuple?: []; params?: {} }
    'activity-data.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'permissions.index': { paramsTuple?: []; params?: {} }
    'territorio.departamentos': { paramsTuple?: []; params?: {} }
    'territorio.municipios': { paramsTuple?: []; params?: {} }
    'organizaciones.index': { paramsTuple?: []; params?: {} }
    'organizaciones.sedes.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizaciones.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sedes.procesos.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sedes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'procesos.actividades.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'procesos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tiposAgua.index': { paramsTuple?: []; params?: {} }
    'tiposAgua.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'componentesHidricos.index': { paramsTuple?: []; params?: {} }
    'componentesHidricos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'alcancesEmision.index': { paramsTuple?: []; params?: {} }
    'alcancesEmision.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'metodologias.index': { paramsTuple?: []; params?: {} }
    'metodologias.versiones': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'metodologias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'factoresEmision.opciones': { paramsTuple?: []; params?: {} }
    'factoresEmision.index': { paramsTuple?: []; params?: {} }
    'factoresEmision.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'parametrosHidricos.opciones': { paramsTuple?: []; params?: {} }
    'parametrosHidricos.index': { paramsTuple?: []; params?: {} }
    'parametrosHidricos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'account.show': { paramsTuple?: []; params?: {} }
    'users.options': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'measurement-units.index': { paramsTuple?: []; params?: {} }
    'measurement-units.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'catalogos.projects': { paramsTuple?: []; params?: {} }
    'catalogos.activities': { paramsTuple?: []; params?: {} }
    'catalogos.periods': { paramsTuple?: []; params?: {} }
    'catalogos.emission-sources': { paramsTuple?: []; params?: {} }
    'catalogos.emission-scopes': { paramsTuple?: []; params?: {} }
    'activity-data.index': { paramsTuple?: []; params?: {} }
    'activity-data.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'permissions.index': { paramsTuple?: []; params?: {} }
    'territorio.departamentos': { paramsTuple?: []; params?: {} }
    'territorio.municipios': { paramsTuple?: []; params?: {} }
    'organizaciones.index': { paramsTuple?: []; params?: {} }
    'organizaciones.sedes.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizaciones.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sedes.procesos.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sedes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'procesos.actividades.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'procesos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tiposAgua.index': { paramsTuple?: []; params?: {} }
    'tiposAgua.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'componentesHidricos.index': { paramsTuple?: []; params?: {} }
    'componentesHidricos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'alcancesEmision.index': { paramsTuple?: []; params?: {} }
    'alcancesEmision.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'metodologias.index': { paramsTuple?: []; params?: {} }
    'metodologias.versiones': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'metodologias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'factoresEmision.opciones': { paramsTuple?: []; params?: {} }
    'factoresEmision.index': { paramsTuple?: []; params?: {} }
    'factoresEmision.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'parametrosHidricos.opciones': { paramsTuple?: []; params?: {} }
    'parametrosHidricos.index': { paramsTuple?: []; params?: {} }
    'parametrosHidricos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'account.logout': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'roles.store': { paramsTuple?: []; params?: {} }
    'measurement-units.store': { paramsTuple?: []; params?: {} }
    'activity-data.store': { paramsTuple?: []; params?: {} }
    'organizaciones.store': { paramsTuple?: []; params?: {} }
    'organizaciones.sedes.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sedes.procesos.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'procesos.actividades.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tiposAgua.store': { paramsTuple?: []; params?: {} }
    'componentesHidricos.store': { paramsTuple?: []; params?: {} }
    'alcancesEmision.store': { paramsTuple?: []; params?: {} }
    'metodologias.store': { paramsTuple?: []; params?: {} }
    'metodologias.versiones.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'factoresEmision.store': { paramsTuple?: []; params?: {} }
    'parametrosHidricos.store': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'users.roles': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.permissions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sedes.usuarios': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'measurement-units.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity-data.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizaciones.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sedes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'procesos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'actividades.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tiposAgua.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'componentesHidricos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'alcancesEmision.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'metodologias.versiones.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'versionId': ParamValue} }
    'metodologias.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'factoresEmision.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'parametrosHidricos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'measurement-units.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity-data.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}