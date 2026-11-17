import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import AccessTokensController from '#controllers/access_tokens_controller'
import ActividadesController from '#controllers/actividades_controller'
import {
  AlcancesEmisionController,
  ComponentesHidricosController,
  TiposAguaController,
} from '#controllers/catalogos_controller'
import FactoresEmisionController from '#controllers/factores_emision_controller'
import MetodologiasController from '#controllers/metodologias_controller'
import OrganizacionesController from '#controllers/organizaciones_controller'
import ParametrosHidricosController from '#controllers/parametros_hidricos_controller'
import ProcesosController from '#controllers/procesos_controller'
import PermissionsController from '#controllers/permissions_controller'
import ProfileController from '#controllers/profile_controller'
import RolesController from '#controllers/roles_controller'
import SedesController from '#controllers/sedes_controller'
import TerritorioController from '#controllers/territorio_controller'
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
      .get('permissions', [PermissionsController, 'index'])
      .as('permissions.index')
      .use(middleware.auth())
      .use(middleware.account())
      .use(middleware.permission('rol.ver'))

    router
      .group(() => {
        router
          .get('departamentos', [TerritorioController, 'departamentos'])
          .as('departamentos')
          .use(middleware.permission('organizacion.ver'))
        router
          .get('municipios', [TerritorioController, 'municipios'])
          .as('municipios')
          .use(middleware.permission('organizacion.ver'))
      })
      .prefix('territorio')
      .as('territorio')
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
          .get(':id/sedes', [SedesController, 'index'])
          .as('sedes.index')
          .use(middleware.permission('sede.ver'))
        router
          .post(':id/sedes', [SedesController, 'store'])
          .as('sedes.store')
          .use(middleware.permission('sede.crear'))
        router
          .get(':id', [OrganizacionesController, 'show'])
          .as('show')
          .use(middleware.permission('organizacion.ver'))
        router
          .patch(':id', [OrganizacionesController, 'update'])
          .as('update')
          .use(middleware.permission('organizacion.editar'))
      })
      .prefix('organizaciones')
      .as('organizaciones')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get(':id/procesos', [ProcesosController, 'index'])
          .as('procesos.index')
          .use(middleware.permission('proceso.ver'))
        router
          .post(':id/procesos', [ProcesosController, 'store'])
          .as('procesos.store')
          .use(middleware.permission('proceso.crear'))
        router
          .get(':id', [SedesController, 'show'])
          .as('show')
          .use(middleware.permission('sede.ver'))
        router
          .patch(':id', [SedesController, 'update'])
          .as('update')
          .use(middleware.permission('sede.editar'))
        router
          .put(':id/usuarios', [SedesController, 'syncUsuarios'])
          .as('usuarios')
          .use(middleware.permission('sede.editar'))
      })
      .prefix('sedes')
      .as('sedes')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get(':id/actividades', [ActividadesController, 'index'])
          .as('actividades.index')
          .use(middleware.permission('actividad.ver'))
        router
          .post(':id/actividades', [ActividadesController, 'store'])
          .as('actividades.store')
          .use(middleware.permission('actividad.crear'))
        router
          .get(':id', [ProcesosController, 'show'])
          .as('show')
          .use(middleware.permission('proceso.ver'))
        router
          .patch(':id', [ProcesosController, 'update'])
          .as('update')
          .use(middleware.permission('proceso.editar'))
      })
      .prefix('procesos')
      .as('procesos')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .patch(':id', [ActividadesController, 'update'])
          .as('update')
          .use(middleware.permission('actividad.editar'))
      })
      .prefix('actividades')
      .as('actividades')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('/', [TiposAguaController, 'index']).as('index').use(middleware.permission('tipo_agua.ver'))
        router
          .post('/', [TiposAguaController, 'store'])
          .as('store')
          .use(middleware.permission('tipo_agua.crear'))
        router
          .get(':id', [TiposAguaController, 'show'])
          .as('show')
          .use(middleware.permission('tipo_agua.ver'))
        router
          .patch(':id', [TiposAguaController, 'update'])
          .as('update')
          .use(middleware.permission('tipo_agua.editar'))
      })
      .prefix('tipos-agua')
      .as('tiposAgua')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('/', [ComponentesHidricosController, 'index'])
          .as('index')
          .use(middleware.permission('componente_hidrico.ver'))
        router
          .post('/', [ComponentesHidricosController, 'store'])
          .as('store')
          .use(middleware.permission('componente_hidrico.crear'))
        router
          .get(':id', [ComponentesHidricosController, 'show'])
          .as('show')
          .use(middleware.permission('componente_hidrico.ver'))
        router
          .patch(':id', [ComponentesHidricosController, 'update'])
          .as('update')
          .use(middleware.permission('componente_hidrico.editar'))
      })
      .prefix('componentes-hidricos')
      .as('componentesHidricos')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('/', [AlcancesEmisionController, 'index'])
          .as('index')
          .use(middleware.permission('alcance_emision.ver'))
        router
          .post('/', [AlcancesEmisionController, 'store'])
          .as('store')
          .use(middleware.permission('alcance_emision.crear'))
        router
          .get(':id', [AlcancesEmisionController, 'show'])
          .as('show')
          .use(middleware.permission('alcance_emision.ver'))
        router
          .patch(':id', [AlcancesEmisionController, 'update'])
          .as('update')
          .use(middleware.permission('alcance_emision.editar'))
      })
      .prefix('alcances-emision')
      .as('alcancesEmision')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('/', [MetodologiasController, 'index'])
          .as('index')
          .use(middleware.permission('metodologia.ver'))
        router
          .post('/', [MetodologiasController, 'store'])
          .as('store')
          .use(middleware.permission('metodologia.crear'))
        router
          .get(':id/versiones', [MetodologiasController, 'versiones'])
          .as('versiones')
          .use(middleware.permission('metodologia.ver'))
        router
          .post(':id/versiones', [MetodologiasController, 'crearVersion'])
          .as('versiones.store')
          .use(middleware.permission('metodologia.crear'))
        router
          .patch(':id/versiones/:versionId', [MetodologiasController, 'actualizarVersion'])
          .as('versiones.update')
          .use(middleware.permission('metodologia.editar'))
        router
          .get(':id', [MetodologiasController, 'show'])
          .as('show')
          .use(middleware.permission('metodologia.ver'))
        router
          .patch(':id', [MetodologiasController, 'update'])
          .as('update')
          .use(middleware.permission('metodologia.editar'))
      })
      .prefix('metodologias')
      .as('metodologias')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('opciones', [FactoresEmisionController, 'opciones'])
          .as('opciones')
          .use(middleware.permission('factor_emision.ver'))
        router
          .get('/', [FactoresEmisionController, 'index'])
          .as('index')
          .use(middleware.permission('factor_emision.ver'))
        router
          .post('/', [FactoresEmisionController, 'store'])
          .as('store')
          .use(middleware.permission('factor_emision.crear'))
        router
          .get(':id', [FactoresEmisionController, 'show'])
          .as('show')
          .use(middleware.permission('factor_emision.ver'))
        router
          .patch(':id', [FactoresEmisionController, 'update'])
          .as('update')
          .use(middleware.permission('factor_emision.editar'))
      })
      .prefix('factores-emision')
      .as('factoresEmision')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('opciones', [ParametrosHidricosController, 'opciones'])
          .as('opciones')
          .use(middleware.permission('parametro_hidrico.ver'))
        router
          .get('/', [ParametrosHidricosController, 'index'])
          .as('index')
          .use(middleware.permission('parametro_hidrico.ver'))
        router
          .post('/', [ParametrosHidricosController, 'store'])
          .as('store')
          .use(middleware.permission('parametro_hidrico.crear'))
        router
          .get(':id', [ParametrosHidricosController, 'show'])
          .as('show')
          .use(middleware.permission('parametro_hidrico.ver'))
        router
          .patch(':id', [ParametrosHidricosController, 'update'])
          .as('update')
          .use(middleware.permission('parametro_hidrico.editar'))
      })
      .prefix('parametros-hidricos')
      .as('parametrosHidricos')
      .use(middleware.auth())
      .use(middleware.account())
  })
  .prefix('/api/v1')
