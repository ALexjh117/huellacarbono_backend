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
    'permissions.index': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'account.show': { paramsTuple?: []; params?: {} }
    'users.options': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'permissions.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'account.show': { paramsTuple?: []; params?: {} }
    'users.options': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'permissions.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'account.logout': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'roles.store': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'users.roles': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.permissions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}