import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import UnidadMedidaCatalogoService, {
  type ResultadoUnidad,
} from '#services/unidad_medida_catalogo_service'

/**
 * Catálogo de unidades de medida (app/data/unidades_medida_catalogo.ts).
 *
 * Seguro por defecto: sin la variable UNIDADES_CATALOGO_APLICAR=si sólo
 * simula e informa. Con ella crea únicamente las unidades faltantes dentro de
 * una transacción; nunca modifica, reactiva ni borra unidades existentes.
 *
 *   node ace db:seed --files database/seeders/unidades_medida_seeder.ts
 */
export default class UnidadesMedidaSeeder extends BaseSeeder {
  async run() {
    const aplicar = process.env.UNIDADES_CATALOGO_APLICAR === 'si'
    const reporte = await db.transaction((trx) =>
      new UnidadMedidaCatalogoService().sincronizar({ aplicar, client: trx })
    )

    const imprimir = (titulo: string, filas: ResultadoUnidad[]) => {
      console.log(`\n${titulo}: ${filas.length}`)
      for (const fila of filas) {
        console.log(`  - ${fila.codigo} (${fila.simbolo}, ${fila.magnitud}): ${fila.detalle}`)
      }
    }

    console.log(aplicar ? 'Catálogo de unidades: APLICADO' : 'Catálogo de unidades: SIMULACIÓN')
    imprimir('Creadas', reporte.creadas)
    imprimir('Por crear (simulación)', reporte.porCrear)
    imprimir('Encontradas', reporte.encontradas)
    imprimir('Requieren revisión (no se modificaron)', reporte.requierenRevision)
  }
}
