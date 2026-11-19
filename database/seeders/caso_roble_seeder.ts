import AlcanceEmision from '#models/alcance_emision'
import Actividad from '#models/actividad'
import DatoActividadCarbono from '#models/dato_actividad_carbono'
import FactorEmision from '#models/factor_emision'
import FuenteEmision from '#models/fuente_emision'
import Metodologia from '#models/metodologia'
import MetodologiaVersion from '#models/metodologia_version'
import Municipio from '#models/municipio'
import Organizacion from '#models/organizacion'
import PeriodoMedicion from '#models/periodo_medicion'
import Proceso from '#models/proceso'
import Sede from '#models/sede'
import UnidadMedida from '#models/unidad_medida'
import Usuario from '#models/usuario'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

const NIT = '9005551234'

export default class CasoRobleSeeder extends BaseSeeder {
  async run() {
    const usuario = await Usuario.findBy('email', 'admin@huellacarbono.local')
    if (!usuario) {
      throw new Error('No existe admin@huellacarbono.local. Corre primero el seeder de roles.')
    }

    const municipio =
      (await Municipio.findBy('nombre', 'Palmira')) ??
      (await Municipio.query().whereILike('nombre', '%Palmira%').first()) ??
      (await Municipio.query().orderBy('id', 'asc').first())
    if (!municipio) throw new Error('No hay municipios cargados.')

    const organizacion = await Organizacion.updateOrCreate(
      { nit: NIT },
      {
        municipioId: municipio.id,
        nombre: 'Frigorífico El Roble',
        nombreCorto: 'El Roble',
        nit: NIT,
        tipo: 'EMPRESA',
        sectorEconomico: 'Industria de Alimentos, Bebidas y Tabaco',
        estado: true,
      }
    )

    const sede = await Sede.updateOrCreate(
      { organizacionId: organizacion.id, nombre: 'Planta Palmira' },
      { organizacionId: organizacion.id, nombre: 'Planta Palmira', codigo: 'PALMIRA', estado: true }
    )

    const produccion = await Proceso.updateOrCreate(
      { sedeId: sede.id, nombre: 'Producción' },
      { sedeId: sede.id, nombre: 'Producción', descripcion: 'Caldera y cuartos fríos', estado: true }
    )
    const distribucion = await Proceso.updateOrCreate(
      { sedeId: sede.id, nombre: 'Distribución' },
      { sedeId: sede.id, nombre: 'Distribución', descripcion: 'Camiones contratados', estado: true }
    )

    const caldera = await Actividad.updateOrCreate(
      { procesoId: produccion.id, nombre: 'Caldera' },
      { procesoId: produccion.id, nombre: 'Caldera', estado: true }
    )
    const frios = await Actividad.updateOrCreate(
      { procesoId: produccion.id, nombre: 'Energía de los cuartos fríos' },
      { procesoId: produccion.id, nombre: 'Energía de los cuartos fríos', estado: true }
    )
    const camiones = await Actividad.updateOrCreate(
      { procesoId: distribucion.id, nombre: 'Camiones contratados' },
      { procesoId: distribucion.id, nombre: 'Camiones contratados', estado: true }
    )

    const unidad = async (codigo: string, nombre: string, simbolo: string, magnitud: string) =>
      UnidadMedida.updateOrCreate(
        { codigo },
        { codigo, nombre, simbolo, magnitud, factorBase: '1', estado: true }
      )
    const m3 = await unidad('M3-ROBLE', 'Metro cúbico', 'm³', 'Volumen')
    const kwh = await unidad('KWH-ROBLE', 'Kilovatio hora', 'kWh', 'Energía')
    const litro = await unidad('L-ROBLE', 'Litro', 'L', 'Volumen')
    const salida = await unidad('KGCO2E-ROBLE', 'Kilogramo de CO2 equivalente', 'kg CO2e', 'Masa')

    const fuente = async (codigo: string, nombre: string) =>
      FuenteEmision.updateOrCreate({ codigo }, { codigo, nombre, categoria: 'Prueba', estado: true })
    const gas = await fuente('GAS-ROBLE', 'Gas natural')
    const luz = await fuente('ELEC-ROBLE', 'Electricidad')
    const diesel = await fuente('DIE-ROBLE', 'Diésel')

    const alcance = async (codigo: string, nombre: string) =>
      AlcanceEmision.updateOrCreate({ codigo }, { codigo, nombre, estado: true })
    const alcance1 = await alcance('1-ROBLE', 'Alcance 1 prueba')
    const alcance2 = await alcance('2-ROBLE', 'Alcance 2 prueba')
    const alcance3 = await alcance('3-ROBLE', 'Alcance 3 prueba')

    const metodologia = await Metodologia.updateOrCreate(
      { codigo: 'GHG-ROBLE' },
      {
        codigo: 'GHG-ROBLE',
        nombre: 'GHG Protocol prueba',
        tipo: 'CARBONO',
        entidadFuente: 'GHG Protocol',
        estado: true,
      }
    )
    const version = await MetodologiaVersion.updateOrCreate(
      { metodologiaId: metodologia.id, numeroVersion: '2026' },
      {
        metodologiaId: metodologia.id,
        numeroVersion: '2026',
        fechaInicioVigencia: DateTime.fromISO('2026-01-01'),
        fechaFinVigencia: DateTime.fromISO('2026-12-31'),
        estado: true,
      }
    )

    const factor = async (
      codigo: string,
      nombre: string,
      fuenteId: number,
      unidadId: number,
      valor: string
    ) =>
      FactorEmision.updateOrCreate(
        { versionId: version.id, codigo, fechaInicioVigencia: DateTime.fromISO('2026-01-01') },
        {
          versionId: version.id,
          fuenteEmisionId: fuenteId,
          unidadEntradaId: unidadId,
          unidadSalidaId: salida.id,
          codigo,
          nombre,
          valor,
          fuente: 'Guía de ejercicio',
          region: 'Colombia',
          fechaInicioVigencia: DateTime.fromISO('2026-01-01'),
          fechaFinVigencia: DateTime.fromISO('2026-12-31'),
          estado: true,
        }
      )
    await factor('FE-GAS-ROBLE', 'Gas natural 2026', gas.id, m3.id, '2')
    await factor('FE-ELEC-ROBLE', 'Electricidad del SIN 2026', luz.id, kwh.id, '0.20')
    await factor('FE-DIE-ROBLE', 'Diésel 2026', diesel.id, litro.id, '2.50')

    const periodo = await PeriodoMedicion.updateOrCreate(
      { organizacionId: organizacion.id, nombre: 'Abril 2026' },
      {
        organizacionId: organizacion.id,
        nombre: 'Abril 2026',
        fechaInicio: DateTime.fromISO('2026-04-01'),
        fechaFin: DateTime.fromISO('2026-04-30'),
        estado: 'ABIERTO',
      }
    )

    const yaHay = await DatoActividadCarbono.query().where('periodoId', periodo.id).first()
    if (yaHay) return

    const papel = async (
      actividadId: number,
      fuenteId: number,
      unidadId: number,
      alcanceId: number,
      cantidad: string,
      documento: string
    ) =>
      DatoActividadCarbono.create({
        actividadId,
        periodoId: periodo.id,
        fuenteEmisionId: fuenteId,
        alcanceId,
        unidadId,
        usuarioRegistroId: usuario.id,
        cantidad,
        fuenteDato: documento,
        fechaDato: DateTime.fromISO('2026-04-15'),
        estadoRegistro: 'REGISTRADO',
      })

    await papel(caldera.id, gas.id, m3.id, alcance1.id, '100', 'Medidor de gas, abril 2026')
    await papel(frios.id, luz.id, kwh.id, alcance2.id, '4000', 'Factura de energía, abril 2026')
    await papel(camiones.id, diesel.id, litro.id, alcance3.id, '600', 'Reporte del transportador, abril 2026')
  }
}
