import CatalogoTransformer from '#transformers/catalogo_transformer'
import CatalogosService from '#services/catalogos_service'
import { projectQueryValidator } from '#validators/dato_actividad'
import type { HttpContext } from '@adonisjs/core/http'

/** Parámetro de consulta numérico: vacío o ausente → `undefined` (la validación exige el valor). */
function numero(value: unknown): number | undefined {
  return value === undefined || value === null || value === '' ? undefined : Number(value)
}

/**
 * Catálogos de solo consulta que alimentan los selectores del módulo de
 * datos de actividad. No devuelven datos de proyectos ajenos: actividades y
 * periodos exigen `projectId`. Las filas se envuelven con
 * `CatalogoTransformer` para que `serialize()` las entregue como `{ data: […] }`.
 */
export default class CatalogosController {
  /** Proyectos activos («proyecto» = `organizacion`). */
  async projects({ serialize }: HttpContext) {
    return serialize(CatalogoTransformer.transform(await new CatalogosService().proyectos()))
  }

  async activities({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(projectQueryValidator, {
      data: { projectId: numero(request.input('projectId')) },
    })
    return serialize(
      CatalogoTransformer.transform(await new CatalogosService().actividades(query.projectId))
    )
  }

  async periods({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(projectQueryValidator, {
      data: { projectId: numero(request.input('projectId')) },
    })
    return serialize(
      CatalogoTransformer.transform(await new CatalogosService().periodos(query.projectId))
    )
  }

  async emissionSources({ serialize }: HttpContext) {
    return serialize(CatalogoTransformer.transform(await new CatalogosService().fuentesEmision()))
  }

  async emissionScopes({ serialize }: HttpContext) {
    return serialize(CatalogoTransformer.transform(await new CatalogosService().alcances()))
  }
}
