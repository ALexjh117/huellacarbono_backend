import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import AccessTokensController from '#controllers/access_tokens_controller'
import PermissionsController from '#controllers/permissions_controller'
import ProfileController from '#controllers/profile_controller'
import RolesController from '#controllers/roles_controller'
import UsersController from '#controllers/users_controller'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('login', [AccessTokensController, 'store']).as('login')
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [ProfileController, 'show']).as('show')
        router.post('logout', [AccessTokensController, 'destroy']).as('logout')
      })
      .prefix('account')
      .as('account')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('options', [UsersController, 'options'])
          .as('options')
          .use(middleware.permission('usuario.ver'))
        router
          .get('/', [UsersController, 'index'])
          .as('index')
          .use(middleware.permission('usuario.ver'))
        router
          .post('/', [UsersController, 'store'])
          .as('store')
          .use(middleware.permission('usuario.crear'))
        router
          .put(':id/roles', [UsersController, 'syncRoles'])
          .as('roles')
          .use(middleware.permission('usuario.editar'))
        router
          .get(':id', [UsersController, 'show'])
          .as('show')
          .use(middleware.permission('usuario.ver'))
        router
          .patch(':id', [UsersController, 'update'])
          .as('update')
          .use(middleware.permission('usuario.editar'))
      })
      .prefix('users')
      .as('users')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('/', [RolesController, 'index'])
          .as('index')
          .use(middleware.permission('rol.ver'))
        router
          .post('/', [RolesController, 'store'])
          .as('store')
          .use(middleware.permission('rol.crear'))
        router
          .put(':id/permissions', [RolesController, 'syncPermissions'])
          .as('permissions')
          .use(middleware.permission('rol.editar'))
        router
          .get(':id', [RolesController, 'show'])
          .as('show')
          .use(middleware.permission('rol.ver'))
        router
          .patch(':id', [RolesController, 'update'])
          .as('update')
          .use(middleware.permission('rol.editar'))
      })
      .prefix('roles')
      .as('roles')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('/', [controllers.UnidadesMedida, 'index'])
          .as('index')
          .use(middleware.permission('unidad_medida.ver'))
        router
          .post('/', [controllers.UnidadesMedida, 'store'])
          .as('store')
          .use(middleware.permission('unidad_medida.crear'))
        router
          .get(':id', [controllers.UnidadesMedida, 'show'])
          .as('show')
          .use(middleware.permission('unidad_medida.ver'))
        router
          .patch(':id', [controllers.UnidadesMedida, 'update'])
          .as('update')
          .use(middleware.permission('unidad_medida.editar'))
        router
          .delete(':id', [controllers.UnidadesMedida, 'destroy'])
          .as('destroy')
          .use(middleware.permission('unidad_medida.eliminar'))
      })
      .prefix('measurement-units')
      .as('measurement-units')
      .use(middleware.auth())
      .use(middleware.account())

    /**
     * Catálogos de datos de actividad: proyectos (= organizaciones),
     * actividades y periodos por proyecto, y fuentes/alcances globales.
     * De solo lectura; todos exigen `dato_actividad.ver`.
     */
    router
      .group(() => {
        router
          .get('projects', [controllers.Catalogos, 'projects'])
          .as('projects')
          .use(middleware.permission('dato_actividad.ver'))
        router
          .get('activities', [controllers.Catalogos, 'activities'])
          .as('activities')
          .use(middleware.permission('dato_actividad.ver'))
        router
          .get('periods', [controllers.Catalogos, 'periods'])
          .as('periods')
          .use(middleware.permission('dato_actividad.ver'))
        router
          .get('emission-sources', [controllers.Catalogos, 'emissionSources'])
          .as('emission-sources')
          .use(middleware.permission('dato_actividad.ver'))
        router
          .get('emission-scopes', [controllers.Catalogos, 'emissionScopes'])
          .as('emission-scopes')
          .use(middleware.permission('dato_actividad.ver'))
      })
      .as('catalogos')
      .use(middleware.auth())
      .use(middleware.account())

    /**
     * Registro de datos de actividad. El listado siempre exige `projectId`
     * para no mezclar datos de distintos proyectos.
     */
    router
      .group(() => {
        router
          .get('/', [controllers.DatoActividad, 'index'])
          .as('index')
          .use(middleware.permission('dato_actividad.ver'))
        router
          .post('/', [controllers.DatoActividad, 'store'])
          .as('store')
          .use(middleware.permission('dato_actividad.crear'))
        router
          .get(':id', [controllers.DatoActividad, 'show'])
          .as('show')
          .use(middleware.permission('dato_actividad.ver'))
        router
          .patch(':id', [controllers.DatoActividad, 'update'])
          .as('update')
          .use(middleware.permission('dato_actividad.editar'))
        router
          .delete(':id', [controllers.DatoActividad, 'destroy'])
          .as('destroy')
          .use(middleware.permission('dato_actividad.eliminar'))
      })
      .prefix('activity-data')
      .as('activity-data')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .get('permissions', [PermissionsController, 'index'])
      .as('permissions.index')
      .use(middleware.auth())
      .use(middleware.account())
      .use(middleware.permission('rol.ver'))
  })
  .prefix('/api/v1')
