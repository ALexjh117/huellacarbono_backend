import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import AccessTokensController from '#controllers/access_tokens_controller'
import OrganizacionesController from '#controllers/organizaciones_controller'
import PermissionsController from '#controllers/permissions_controller'
import ProfileController from '#controllers/profile_controller'
import RolesController from '#controllers/roles_controller'
import SedesController from '#controllers/sedes_controller'
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
          .get('/', [OrganizacionesController, 'index'])
          .as('index')
          .use(middleware.permission('organizacion.ver'))
        router
          .post('/', [OrganizacionesController, 'store'])
          .as('store')
          .use(middleware.permission('organizacion.crear'))
        router
          .get(':id', [OrganizacionesController, 'show'])
          .as('show')
          .use(middleware.permission('organizacion.ver'))
        router
          .patch(':id', [OrganizacionesController, 'update'])
          .as('update')
          .use(middleware.permission('organizacion.editar'))
        router
          .delete(':id', [OrganizacionesController, 'destroy'])
          .as('destroy')
          .use(middleware.permission('organizacion.eliminar'))
      })
      .prefix('organizaciones')
      .as('organizaciones')
      .where('id', router.matchers.number())
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('/', [SedesController, 'index'])
          .as('index')
          .use(middleware.permission('sede.ver'))
        router
          .post('/', [SedesController, 'store'])
          .as('store')
          .use(middleware.permission('sede.crear'))
        router
          .get(':id', [SedesController, 'show'])
          .as('show')
          .use(middleware.permission('sede.ver'))
        router
          .patch(':id', [SedesController, 'update'])
          .as('update')
          .use(middleware.permission('sede.editar'))
        router
          .delete(':id', [SedesController, 'destroy'])
          .as('destroy')
          .use(middleware.permission('sede.eliminar'))
      })
      .prefix('sedes')
      .as('sedes')
      .where('id', router.matchers.number())
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