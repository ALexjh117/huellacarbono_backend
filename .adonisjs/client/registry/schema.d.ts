/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractRawResponse, ExtractResponse, Method, PathWithRegistry, PatternsByMethod, RouteWithRegistry } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'
import type { routes } from './index.ts'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'auth.login': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'account.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
    }
  }
  'account.logout': {
    methods: ["POST"]
    pattern: '/api/v1/account/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
    }
  }
  'users.options': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/users/options'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['options']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['options']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/users_controller').default['options']>>>
    }
  }
  'users.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/usuario').listQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/users_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.store': {
    methods: ["POST"]
    pattern: '/api/v1/users'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').createUserValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').createUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/users_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.roles': {
    methods: ["PUT"]
    pattern: '/api/v1/users/:id/roles'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').syncRolesValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').syncRolesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['syncRoles']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['syncRoles']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/users_controller').default['syncRoles']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/users/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/users_controller').default['show']>>>
    }
  }
  'users.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/users/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').updateUserValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').updateUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/users_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'roles.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/roles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/usuario').listQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'roles.store': {
    methods: ["POST"]
    pattern: '/api/v1/roles'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/rol').createRoleValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/rol').createRoleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'roles.permissions': {
    methods: ["PUT"]
    pattern: '/api/v1/roles/:id/permissions'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/rol').syncRolePermissionsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/rol').syncRolePermissionsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['syncPermissions']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['syncPermissions']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['syncPermissions']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'roles.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/roles/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['show']>>>
    }
  }
  'roles.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/roles/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/rol').updateRoleValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/rol').updateRoleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'measurement-units.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/measurement-units'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/usuario').listQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'measurement-units.store': {
    methods: ["POST"]
    pattern: '/api/v1/measurement-units'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/unidad_medida').createMeasurementUnitValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/unidad_medida').createMeasurementUnitValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'measurement-units.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/measurement-units/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['show']>>>
    }
  }
  'measurement-units.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/measurement-units/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/unidad_medida').updateMeasurementUnitValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/unidad_medida').updateMeasurementUnitValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'measurement-units.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/measurement-units/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/unidades_medida_controller').default['destroy']>>>
    }
  }
  'permissions.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/permissions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/permissions_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/permissions_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/permissions_controller').default['index']>>>
    }
  }
  'territorio.departamentos': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/territorio/departamentos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/territorio_controller').default['departamentos']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/territorio_controller').default['departamentos']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/territorio_controller').default['departamentos']>>>
    }
  }
  'territorio.municipios': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/territorio/municipios'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/territorio').municipiosQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/territorio_controller').default['municipios']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/territorio_controller').default['municipios']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/territorio_controller').default['municipios']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'organizaciones.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/organizaciones'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/organizacion').listOrganizacionesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organizaciones_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organizaciones_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/organizaciones_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'organizaciones.store': {
    methods: ["POST"]
    pattern: '/api/v1/organizaciones'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/organizacion').createOrganizacionValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/organizacion').createOrganizacionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organizaciones_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organizaciones_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/organizaciones_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'organizaciones.sedes.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/organizaciones/:id/sedes'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/sede').listSedesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'organizaciones.sedes.store': {
    methods: ["POST"]
    pattern: '/api/v1/organizaciones/:id/sedes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/sede').createSedeValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/sede').createSedeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'organizaciones.periodos.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/organizaciones/:id/periodos'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/periodos_medicion_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/periodos_medicion_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/periodos_medicion_controller').default['index']>>>
    }
  }
  'organizaciones.periodos.store': {
    methods: ["POST"]
    pattern: '/api/v1/organizaciones/:id/periodos'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/periodo_medicion').createPeriodoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/periodo_medicion').createPeriodoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/periodos_medicion_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/periodos_medicion_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/periodos_medicion_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'organizaciones.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/organizaciones/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organizaciones_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organizaciones_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/organizaciones_controller').default['show']>>>
    }
  }
  'organizaciones.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/organizaciones/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/organizacion').updateOrganizacionValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/organizacion').updateOrganizacionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organizaciones_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organizaciones_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/organizaciones_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'periodos.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/periodos/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/periodo_medicion').updatePeriodoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/periodo_medicion').updatePeriodoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/periodos_medicion_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/periodos_medicion_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/periodos_medicion_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'sedes.procesos.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/sedes/:id/procesos'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/proceso').listHijosValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/procesos_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/procesos_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/procesos_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'sedes.procesos.store': {
    methods: ["POST"]
    pattern: '/api/v1/sedes/:id/procesos'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/proceso').createProcesoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/proceso').createProcesoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/procesos_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/procesos_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/procesos_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'sedes.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/sedes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['show']>>>
    }
  }
  'sedes.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/sedes/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/sede').updateSedeValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/sede').updateSedeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'sedes.usuarios': {
    methods: ["PUT"]
    pattern: '/api/v1/sedes/:id/usuarios'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/sede').syncUsuariosSedeValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/sede').syncUsuariosSedeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['syncUsuarios']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['syncUsuarios']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/sedes_controller').default['syncUsuarios']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'procesos.actividades.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/procesos/:id/actividades'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/proceso').listHijosValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/actividades_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/actividades_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/actividades_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'procesos.actividades.store': {
    methods: ["POST"]
    pattern: '/api/v1/procesos/:id/actividades'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/proceso').createActividadValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/proceso').createActividadValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/actividades_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/actividades_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/actividades_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'procesos.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/procesos/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/procesos_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/procesos_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/procesos_controller').default['show']>>>
    }
  }
  'procesos.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/procesos/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/proceso').updateProcesoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/proceso').updateProcesoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/procesos_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/procesos_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/procesos_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'actividades.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/actividades/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/proceso').updateActividadValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/proceso').updateActividadValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/actividades_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/actividades_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/actividades_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'tiposAgua.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/tipos-agua'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tipos_agua_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tipos_agua_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tipos_agua_controller').default['index']>>>
    }
  }
  'tiposAgua.store': {
    methods: ["POST"]
    pattern: '/api/v1/tipos-agua'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tipos_agua_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tipos_agua_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tipos_agua_controller').default['store']>>>
    }
  }
  'tiposAgua.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/tipos-agua/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tipos_agua_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tipos_agua_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tipos_agua_controller').default['show']>>>
    }
  }
  'tiposAgua.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/tipos-agua/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tipos_agua_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tipos_agua_controller').default['update']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tipos_agua_controller').default['update']>>>
    }
  }
  'componentesHidricos.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/componentes-hidricos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/componentes_hidricos_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/componentes_hidricos_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/componentes_hidricos_controller').default['index']>>>
    }
  }
  'componentesHidricos.store': {
    methods: ["POST"]
    pattern: '/api/v1/componentes-hidricos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/componentes_hidricos_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/componentes_hidricos_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/componentes_hidricos_controller').default['store']>>>
    }
  }
  'componentesHidricos.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/componentes-hidricos/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/componentes_hidricos_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/componentes_hidricos_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/componentes_hidricos_controller').default['show']>>>
    }
  }
  'componentesHidricos.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/componentes-hidricos/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/componentes_hidricos_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/componentes_hidricos_controller').default['update']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/componentes_hidricos_controller').default['update']>>>
    }
  }
  'alcancesEmision.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/alcances-emision'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/alcances_emision_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/alcances_emision_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/alcances_emision_controller').default['index']>>>
    }
  }
  'alcancesEmision.store': {
    methods: ["POST"]
    pattern: '/api/v1/alcances-emision'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/alcances_emision_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/alcances_emision_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/alcances_emision_controller').default['store']>>>
    }
  }
  'alcancesEmision.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/alcances-emision/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/alcances_emision_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/alcances_emision_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/alcances_emision_controller').default['show']>>>
    }
  }
  'alcancesEmision.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/alcances-emision/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/alcances_emision_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/alcances_emision_controller').default['update']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/alcances_emision_controller').default['update']>>>
    }
  }
  'metodologias.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/metodologias'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/catalogo').listCatalogoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'metodologias.store': {
    methods: ["POST"]
    pattern: '/api/v1/metodologias'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').createMetodologiaValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').createMetodologiaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'metodologias.versiones': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/metodologias/:id/versiones'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/catalogo').listCatalogoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['versiones']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['versiones']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['versiones']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'metodologias.versiones.store': {
    methods: ["POST"]
    pattern: '/api/v1/metodologias/:id/versiones'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').createVersionValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').createVersionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['crearVersion']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['crearVersion']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['crearVersion']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'metodologias.versiones.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/metodologias/:id/versiones/:versionId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').updateVersionValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; versionId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').updateVersionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['actualizarVersion']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['actualizarVersion']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['actualizarVersion']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'metodologias.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/metodologias/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['show']>>>
    }
  }
  'metodologias.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/metodologias/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').updateMetodologiaValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').updateMetodologiaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/metodologias_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'factoresEmision.opciones': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/factores-emision/opciones'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['opciones']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['opciones']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['opciones']>>>
    }
  }
  'factoresEmision.cobertura': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/factores-emision/cobertura'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/importacion_factor').coberturaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['cobertura']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['cobertura']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['cobertura']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'factoresEmision.importaciones.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/factores-emision/importaciones'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/importacion_factor').listImportacionesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'factoresEmision.importaciones.previsualizar': {
    methods: ["POST"]
    pattern: '/api/v1/factores-emision/importaciones'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/importacion_factor').previsualizarImportacionValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/importacion_factor').previsualizarImportacionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['previsualizar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['previsualizar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['previsualizar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'factoresEmision.importaciones.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/factores-emision/importaciones/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['show']>>>
    }
  }
  'factoresEmision.importaciones.aplicar': {
    methods: ["POST"]
    pattern: '/api/v1/factores-emision/importaciones/:id/aplicar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['aplicar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['aplicar']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['aplicar']>>>
    }
  }
  'factoresEmision.importaciones.rechazar': {
    methods: ["POST"]
    pattern: '/api/v1/factores-emision/importaciones/:id/rechazar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['rechazar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['rechazar']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/importaciones_factor_controller').default['rechazar']>>>
    }
  }
  'factoresEmision.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/factores-emision'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/catalogo').listVigenciaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'factoresEmision.store': {
    methods: ["POST"]
    pattern: '/api/v1/factores-emision'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').createFactorValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').createFactorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'factoresEmision.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/factores-emision/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['show']>>>
    }
  }
  'factoresEmision.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/factores-emision/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').updateFactorValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').updateFactorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/factores_emision_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'parametrosHidricos.opciones': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/parametros-hidricos/opciones'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['opciones']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['opciones']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['opciones']>>>
    }
  }
  'parametrosHidricos.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/parametros-hidricos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/catalogo').listVigenciaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'parametrosHidricos.store': {
    methods: ["POST"]
    pattern: '/api/v1/parametros-hidricos'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').createParametroValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').createParametroValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'parametrosHidricos.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/parametros-hidricos/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['show']>>>
    }
  }
  'parametrosHidricos.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/parametros-hidricos/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').updateParametroValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').updateParametroValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/parametros_hidricos_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'datosActividadCarbono.opciones': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/datos-actividad-carbono/opciones'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/dato_actividad_carbono').opcionesDatoActividadCarbonoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['opciones']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['opciones']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['opciones']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'datosActividadCarbono.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/datos-actividad-carbono'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/dato_actividad_carbono').listDatoActividadCarbonoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'datosActividadCarbono.store': {
    methods: ["POST"]
    pattern: '/api/v1/datos-actividad-carbono'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/dato_actividad_carbono').createDatoActividadCarbonoValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/dato_actividad_carbono').createDatoActividadCarbonoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'datosActividadCarbono.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/datos-actividad-carbono/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['show']>>>
    }
  }
  'datosActividadCarbono.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/datos-actividad-carbono/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/dato_actividad_carbono').updateDatoActividadCarbonoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/dato_actividad_carbono').updateDatoActividadCarbonoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/datos_actividad_carbono_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'calculosCarbono.opciones': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/calculos-carbono/opciones'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/calculo_carbono').opcionesCalculoCarbonoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['opciones']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['opciones']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['opciones']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'calculosCarbono.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/calculos-carbono'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/calculo_carbono').listCalculoCarbonoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'calculosCarbono.resumen': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/calculos-carbono/resumen'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/calculo_carbono').opcionesCalculoCarbonoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['resumen']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['resumen']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['resumen']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'calculosCarbono.coberturaFactores': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/calculos-carbono/cobertura-factores'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['coberturaFactores']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['coberturaFactores']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['coberturaFactores']>>>
    }
  }
  'calculosCarbono.store': {
    methods: ["POST"]
    pattern: '/api/v1/calculos-carbono'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/calculo_carbono').createCalculoCarbonoValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/calculo_carbono').createCalculoCarbonoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'calculosCarbono.informe': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/calculos-carbono/:id/informe'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['informe']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['informe']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['informe']>>>
    }
  }
  'calculosCarbono.reduccion': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/calculos-carbono/:id/reduccion'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['reduccion']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['reduccion']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['reduccion']>>>
    }
  }
  'calculosCarbono.guardarReduccion': {
    methods: ["PUT"]
    pattern: '/api/v1/calculos-carbono/:id/reduccion'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/calculo_carbono').guardarReduccionValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/calculo_carbono').guardarReduccionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['guardarReduccion']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['guardarReduccion']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['guardarReduccion']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'calculosCarbono.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/calculos-carbono/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/calculos_carbono_controller').default['show']>>>
    }
  }
}

export namespace Route {
  export type Request<Name extends keyof typeof routes> = RouteWithRegistry.Request<typeof routes, Name>
  export type Response<Name extends keyof typeof routes> = RouteWithRegistry.Response<typeof routes, Name>
  export type Params<Name extends keyof typeof routes> = RouteWithRegistry.Params<typeof routes, Name>
  export type Body<Name extends keyof typeof routes> = RouteWithRegistry.Body<typeof routes, Name>
  export type Query<Name extends keyof typeof routes> = RouteWithRegistry.Query<typeof routes, Name>
  export type Error<Name extends keyof typeof routes> = RouteWithRegistry.Error<typeof routes, Name>
}

export namespace Path {
  export type Request<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Request<typeof routes, M, P>
  export type Response<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Response<typeof routes, M, P>
  export type Params<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Params<typeof routes, M, P>
  export type Body<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Body<typeof routes, M, P>
  export type Query<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Query<typeof routes, M, P>
  export type Error<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Error<typeof routes, M, P>
}
