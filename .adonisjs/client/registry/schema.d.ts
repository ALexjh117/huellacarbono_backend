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
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
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
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
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
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
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
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'users.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'users.store': {
    methods: ["POST"]
    pattern: '/api/v1/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'users.roles': {
    methods: ["PUT"]
    pattern: '/api/v1/users/:id/roles'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
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
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'users.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/users/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'roles.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/roles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'roles.store': {
    methods: ["POST"]
    pattern: '/api/v1/roles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'roles.permissions': {
    methods: ["PUT"]
    pattern: '/api/v1/roles/:id/permissions'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
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
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'roles.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/roles/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
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
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
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
