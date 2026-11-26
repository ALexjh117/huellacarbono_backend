import { test } from '@japa/runner'
import FactorEmision from '#models/factor_emision'
import FuenteEmision from '#models/fuente_emision'
import Metodologia from '#models/metodologia'
import MetodologiaVersion from '#models/metodologia_version'
import UnidadMedida from '#models/unidad_medida'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { rethrowDatabaseError } from '#services/database_error'

test.group('concurrencia del trigger de factores de emisión', () => {
  test('transacciones independientes producen un éxito y un 23505, sin 25P02', async ({
    assert,
  }) => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const metodologia = await Metodologia.create({
      codigo: `TEST-CONC-${suffix}`,
      nombre: `Fixture concurrency ${suffix}`,
      tipo: 'CARBONO',
      estado: true,
    })
    let version: MetodologiaVersion | null = null
    let unidadEntrada: UnidadMedida | null = null
    let unidadSalida: UnidadMedida | null = null
    const codigos = [`TEST-CONC-A-${suffix}`, `TEST-CONC-B-${suffix}`]

    try {
      version = await MetodologiaVersion.create({
        metodologiaId: metodologia.id,
        numeroVersion: '1',
        fechaInicioVigencia: DateTime.fromISO('2024-01-01'),
        estado: true,
      })
      unidadEntrada = await UnidadMedida.create({
        codigo: `E${suffix}`,
        nombre: `Fixture energía ${suffix}`,
        simbolo: 'kWh',
        magnitud: 'Energia',
        factorBase: '1',
        estado: true,
      })
      unidadSalida = await UnidadMedida.create({
        codigo: `M${suffix}`,
        nombre: `Fixture masa ${suffix}`,
        simbolo: 'kg',
        magnitud: 'Masa',
        factorBase: '1',
        estado: true,
      })
      const fuente = await FuenteEmision.query().where('codigo', 'B1-01').firstOrFail()

      const base = {
        versionId: version.id,
        fuenteEmisionId: fuente.id,
        unidadEntradaId: unidadEntrada.id,
        unidadSalidaId: unidadSalida.id,
        nombre: `Fixture concurrente ${suffix}`,
        valor: '1',
        gas: 'CO2E',
        gasEspecifico: null,
        estadoAprobacion: 'PENDIENTE' as const,
        fuente: null,
        region: 'CO',
        institucionResponsable: null,
        anioPublicacion: null,
        anioAplicacion: 2024,
        sectorCategoria: 'Fixture concurrency',
        origen: null,
        fechaInicioVigencia: DateTime.fromISO('2024-01-01'),
        fechaFinVigencia: DateTime.fromISO('2024-12-31'),
        estado: true,
      }

      let llegadas = 0
      let liberar!: () => void
      const barrera = new Promise<void>((resolve) => {
        liberar = resolve
      })
      const insertarEnTransaccionIndependiente = (codigo: string) =>
        db.transaction(async (trx) => {
          llegadas += 1
          if (llegadas === 2) liberar()
          await barrera
          return FactorEmision.create({ ...base, codigo }, { client: trx })
        })

      const resultados = await Promise.allSettled([
        insertarEnTransaccionIndependiente(codigos[0]),
        insertarEnTransaccionIndependiente(codigos[1]),
      ])
      const exitosos = resultados.filter((resultado) => resultado.status === 'fulfilled')
      const rechazados = resultados.filter(
        (resultado): resultado is PromiseRejectedResult => resultado.status === 'rejected'
      )

      assert.lengthOf(exitosos, 1)
      assert.lengthOf(rechazados, 1)
      assert.equal((rechazados[0].reason as { code?: string }).code, '23505')
      assert.notEqual((rechazados[0].reason as { code?: string }).code, '25P02')
      let conflicto: unknown
      try {
        rethrowDatabaseError(rechazados[0].reason, 'Falló la creación del factor')
      } catch (error) {
        conflicto = error
      }
      assert.equal((conflicto as { status?: number }).status, 409)

      const persistidos = await FactorEmision.query().whereIn('codigo', codigos)
      assert.lengthOf(persistidos, 1)
    } finally {
      await FactorEmision.query().whereIn('codigo', codigos).delete()
      if (version) await version.delete()
      if (unidadEntrada) await unidadEntrada.delete()
      if (unidadSalida) await unidadSalida.delete()
      await metodologia.delete()
    }
  })
})
