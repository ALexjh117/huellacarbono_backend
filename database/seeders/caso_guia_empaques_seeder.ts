import AccionReduccion from '#models/accion_reduccion'
import AlcanceEmision from '#models/alcance_emision'
import Actividad from '#models/actividad'
import CalculoCarbono from '#models/calculo_carbono'
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
import { decimalTexto } from '#services/catalogo_reglas'
import CalculoCarbonoService from '#services/calculo_carbono_service'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

const NIT = '9002026001'
const TOTAL_GUIA = '1090.8'

/**
 * Caso mensual de la guía práctica de cálculo.
 * Electricidad 2500 kWh × 0.20 = 500.
 * Gasolina 180 L × 2.31 = 415.8.
 * Residuos orgánicos 350 kg × 0.50 = 175.
 * Total: 1090.8 kg CO2e.
 * Los factores son didácticos, como en la guía. No son factores oficiales.
 */
export default class CasoGuiaEmpaquesSeeder extends BaseSeeder {
  async run() {
    const usuario = await Usuario.findBy('email', 'admin@huellacarbono.local')
    if (!usuario) {
      throw new Error('No existe admin@huellacarbono.local. Corre primero el seeder de roles.')
    }

    const municipio =
      (await Municipio.findBy('nombre', 'Cali')) ??
      (await Municipio.query().whereILike('nombre', '%Cali%').first()) ??
      (await Municipio.query().orderBy('id', 'asc').first())
    if (!municipio) throw new Error('No hay municipios cargados.')

    const organizacion = await Organizacion.updateOrCreate(
      { nit: NIT },
      {
        municipioId: municipio.id,
        nombre: 'Fábrica de Empaques',
        nombreCorto: 'Guía de cálculo',
        nit: NIT,
        tipo: 'EMPRESA',
        sectorEconomico: 'Fabricación de empaques',
        estado: true,
      }
    )

    const sede = await Sede.updateOrCreate(
      { organizacionId: organizacion.id, nombre: 'Planta' },
      {
        organizacionId: organizacion.id,
        nombre: 'Planta',
        codigo: 'PLANTA-GUIA',
        estado: true,
      }
    )

    const operacion = await Proceso.updateOrCreate(
      { sedeId: sede.id, nombre: 'Operación de planta' },
      {
        sedeId: sede.id,
        nombre: 'Operación de planta',
        descripcion: 'Electricidad de la fábrica',
        estado: true,
      }
    )
    const flota = await Proceso.updateOrCreate(
      { sedeId: sede.id, nombre: 'Flota propia' },
      {
        sedeId: sede.id,
        nombre: 'Flota propia',
        descripcion: 'Vehículos de la empresa',
        estado: true,
      }
    )
    const residuos = await Proceso.updateOrCreate(
      { sedeId: sede.id, nombre: 'Residuos' },
      {
        sedeId: sede.id,
        nombre: 'Residuos',
        descripcion: 'Residuos orgánicos de la operación',
        estado: true,
      }
    )

    const electricidad = await Actividad.updateOrCreate(
      { procesoId: operacion.id, nombre: 'Consumo eléctrico' },
      { procesoId: operacion.id, nombre: 'Consumo eléctrico', estado: true }
    )
    const gasolinaActividad = await Actividad.updateOrCreate(
      { procesoId: flota.id, nombre: 'Gasolina de vehículos propios' },
      { procesoId: flota.id, nombre: 'Gasolina de vehículos propios', estado: true }
    )
    const residuosActividad = await Actividad.updateOrCreate(
      { procesoId: residuos.id, nombre: 'Residuos orgánicos' },
      { procesoId: residuos.id, nombre: 'Residuos orgánicos', estado: true }
    )

    const unidad = async (codigo: string, nombre: string, simbolo: string, magnitud: string) =>
      UnidadMedida.updateOrCreate(
        { codigo },
        { codigo, nombre, simbolo, magnitud, factorBase: '1', estado: true }
      )
    const kwh = await unidad('KWH-GUIA', 'Kilovatio hora', 'kWh', 'Energía')
    const litro = await unidad('L-GUIA', 'Litro', 'L', 'Volumen')
    const kilogramo = await unidad('KG-GUIA', 'Kilogramo', 'kg', 'Masa')
    const salida = await unidad('KGCO2E-GUIA', 'Kilogramo de CO2 equivalente', 'kg CO2e', 'Masa')

    const fuente = async (codigo: string, nombre: string, categoria: string) =>
      FuenteEmision.updateOrCreate({ codigo }, { codigo, nombre, categoria, estado: true })
    const luz = await fuente('ELEC-GUIA', 'Electricidad', 'Energía')
    const gasolina = await fuente('GASOL-GUIA', 'Gasolina', 'Combustible')
    const organico = await fuente('RES-ORG-GUIA', 'Residuos orgánicos', 'Residuos')

    const alcance = async (codigo: string, nombre: string) => {
      const porCodigo = await AlcanceEmision.findBy('codigo', codigo)
      if (porCodigo) return porCodigo
      const porNombre = await AlcanceEmision.findBy('nombre', nombre)
      if (porNombre) return porNombre
      return AlcanceEmision.create({ codigo, nombre, estado: true })
    }
    const alcance1 = await alcance('ALCANCE-1', 'Alcance 1')
    const alcance2 = await alcance('ALCANCE-2', 'Alcance 2')
    const alcance3 = await alcance('ALCANCE-3', 'Alcance 3')

    const metodologia = await Metodologia.updateOrCreate(
      { codigo: 'GHG-GUIA' },
      {
        codigo: 'GHG-GUIA',
        nombre: 'GHG Protocol (guía de empaques)',
        tipo: 'CARBONO',
        entidadFuente: 'GHG Protocol',
        descripcion:
          'Metodología del ejercicio de la guía práctica. Los factores son didácticos y no son oficiales.',
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
        descripcion: 'Factores didácticos del ejemplo mensual de la guía.',
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
          fuente: 'Guía práctica de cálculo. Factor didáctico, no oficial.',
          region: 'Ejercicio',
          fechaInicioVigencia: DateTime.fromISO('2026-01-01'),
          fechaFinVigencia: DateTime.fromISO('2026-12-31'),
          estado: true,
        }
      )
    await factor('FE-ELEC-GUIA', 'Electricidad del ejercicio', luz.id, kwh.id, '0.20')
    await factor('FE-GASOL-GUIA', 'Gasolina del ejercicio', gasolina.id, litro.id, '2.31')
    await factor('FE-RES-GUIA', 'Residuos orgánicos del ejercicio', organico.id, kilogramo.id, '0.50')

    const periodo = await PeriodoMedicion.updateOrCreate(
      { organizacionId: organizacion.id, nombre: 'Enero 2026' },
      {
        organizacionId: organizacion.id,
        nombre: 'Enero 2026',
        fechaInicio: DateTime.fromISO('2026-01-01'),
        fechaFin: DateTime.fromISO('2026-01-31'),
        estado: 'ABIERTO',
      }
    )

    const yaHay = await DatoActividadCarbono.query().where('periodoId', periodo.id).first()
    if (!yaHay) {
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
          fechaDato: DateTime.fromISO('2026-01-15'),
          estadoRegistro: 'REGISTRADO',
        })

      await papel(
        electricidad.id,
        luz.id,
        kwh.id,
        alcance2.id,
        '2500',
        'Factura de energía, enero 2026'
      )
      await papel(
        gasolinaActividad.id,
        gasolina.id,
        litro.id,
        alcance1.id,
        '180',
        'Facturas de combustible, enero 2026'
      )
      await papel(
        residuosActividad.id,
        organico.id,
        kilogramo.id,
        alcance3.id,
        '350',
        'Registro de residuos, enero 2026'
      )
    }

    const yaCalculado = await CalculoCarbono.query()
      .where('periodoId', periodo.id)
      .where('versionId', version.id)
      .first()

    let calculoId = yaCalculado?.id
    if (yaCalculado) {
      yaCalculado.unidadesProducidas = yaCalculado.unidadesProducidas ?? '10000'
      yaCalculado.unidadFuncional = yaCalculado.unidadFuncional ?? 'empaques'
      await yaCalculado.save()
    } else {
      const calculo = await new CalculoCarbonoService().crear(usuario.id, {
        organizacionId: organizacion.id,
        periodoId: periodo.id,
        versionId: version.id,
        unidadesProducidas: '10000',
        unidadFuncional: 'empaques',
        observacion:
          'Ejemplo de la guía práctica. Tiene que dar 1090.8 kg CO2e: electricidad 500, gasolina 415.8 y residuos 175. Con 10000 empaques, 1.0908 t CO2e y 0.10908 kg CO2e por empaque.',
      })

      const total = decimalTexto(calculo.totalCo2e ?? '')
      if (total !== TOTAL_GUIA || calculo.omitidos.length) {
        throw new Error(
          `La guía debía dar ${TOTAL_GUIA} kg CO2e y el cálculo dio ${total || 'sin total'}.`
        )
      }
      calculoId = calculo.id
    }

    const hayPlan = await AccionReduccion.query().where('calculoCarbonoId', calculoId!).first()
    if (!hayPlan) {
      await AccionReduccion.createMany([
        {
          calculoCarbonoId: calculoId!,
          fuenteEmisionId: luz.id,
          estrategia: 'Iluminación LED y equipos eficientes',
          indicador: 'kWh/mes',
          meta: 'Reducir el consumo eléctrico 10%',
        },
        {
          calculoCarbonoId: calculoId!,
          fuenteEmisionId: gasolina.id,
          estrategia: 'Optimizar recorridos y mantenimiento vehicular',
          indicador: 'Litros/km',
          meta: 'Reducir el combustible 8%',
        },
        {
          calculoCarbonoId: calculoId!,
          fuenteEmisionId: organico.id,
          estrategia: 'Implementar compostaje',
          indicador: 'kg aprovechados',
          meta: 'Aprovechar 70% de los residuos',
        },
      ])
    }

    await this.empaque(usuario.id, municipio.id, version.id, kwh.id, salida.id, alcance2.id, alcance3.id)
  }

  private async empaque(
    usuarioId: number,
    municipioId: number,
    versionId: number,
    kwhId: number,
    salidaId: number,
    alcance2Id: number,
    alcance3Id: number
  ) {
    const organizacion = await Organizacion.updateOrCreate(
      { nit: '9002026002' },
      {
        municipioId,
        nombre: 'Empaque de cartón',
        nombreCorto: 'Guía del empaque',
        nit: '9002026002',
        tipo: 'EMPRESA',
        sectorEconomico: 'Fabricación de empaques',
        estado: true,
      }
    )
    const sede = await Sede.updateOrCreate(
      { organizacionId: organizacion.id, nombre: 'Línea de empaque' },
      { organizacionId: organizacion.id, nombre: 'Línea de empaque', codigo: 'EMPAQUE-GUIA', estado: true }
    )
    const proceso = await Proceso.updateOrCreate(
      { sedeId: sede.id, nombre: 'Empaque de cartón' },
      {
        sedeId: sede.id,
        nombre: 'Empaque de cartón',
        descripcion: 'Ejercicio de huella de producto de la guía',
        estado: true,
      }
    )
    const cartonActividad = await Actividad.updateOrCreate(
      { procesoId: proceso.id, nombre: 'Cartón utilizado' },
      { procesoId: proceso.id, nombre: 'Cartón utilizado', estado: true }
    )
    const luzActividad = await Actividad.updateOrCreate(
      { procesoId: proceso.id, nombre: 'Electricidad del empaque' },
      { procesoId: proceso.id, nombre: 'Electricidad del empaque', estado: true }
    )
    const transporteActividad = await Actividad.updateOrCreate(
      { procesoId: proceso.id, nombre: 'Transporte del empaque' },
      { procesoId: proceso.id, nombre: 'Transporte del empaque', estado: true }
    )

    const kilogramo = await UnidadMedida.updateOrCreate(
      { codigo: 'KG-GUIA' },
      { codigo: 'KG-GUIA', nombre: 'Kilogramo', simbolo: 'kg', magnitud: 'Masa', factorBase: '1', estado: true }
    )
    const toneladaKm = await UnidadMedida.updateOrCreate(
      { codigo: 'TKM-GUIA' },
      {
        codigo: 'TKM-GUIA',
        nombre: 'Tonelada kilómetro',
        simbolo: 't·km',
        magnitud: 'Transporte',
        factorBase: '1',
        estado: true,
      }
    )
    const carton = await FuenteEmision.updateOrCreate(
      { codigo: 'CARTON-GUIA' },
      { codigo: 'CARTON-GUIA', nombre: 'Cartón', categoria: 'Material', estado: true }
    )
    const luz = await FuenteEmision.findByOrFail('codigo', 'ELEC-GUIA')
    const transporte = await FuenteEmision.updateOrCreate(
      { codigo: 'TRANS-GUIA' },
      { codigo: 'TRANS-GUIA', nombre: 'Transporte', categoria: 'Transporte', estado: true }
    )

    const factor = async (
      codigo: string,
      nombre: string,
      fuenteId: number,
      unidadId: number,
      valor: string
    ) =>
      FactorEmision.updateOrCreate(
        { versionId, codigo, fechaInicioVigencia: DateTime.fromISO('2026-01-01') },
        {
          versionId,
          fuenteEmisionId: fuenteId,
          unidadEntradaId: unidadId,
          unidadSalidaId: salidaId,
          codigo,
          nombre,
          valor,
          fuente: 'Guía práctica de cálculo. Factor didáctico, no oficial.',
          region: 'Ejercicio',
          fechaInicioVigencia: DateTime.fromISO('2026-01-01'),
          fechaFinVigencia: DateTime.fromISO('2026-12-31'),
          estado: true,
        }
      )
    await factor('FE-CARTON-GUIA', 'Cartón del ejercicio', carton.id, kilogramo.id, '0.80')
    await factor('FE-TRANS-GUIA', 'Transporte del ejercicio', transporte.id, toneladaKm.id, '0.10')

    const periodo = await PeriodoMedicion.updateOrCreate(
      { organizacionId: organizacion.id, nombre: 'Lote de 1000 empaques' },
      {
        organizacionId: organizacion.id,
        nombre: 'Lote de 1000 empaques',
        fechaInicio: DateTime.fromISO('2026-01-01'),
        fechaFin: DateTime.fromISO('2026-01-31'),
        estado: 'ABIERTO',
      }
    )

    const yaHay = await DatoActividadCarbono.query().where('periodoId', periodo.id).first()
    if (!yaHay) {
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
          usuarioRegistroId: usuarioId,
          cantidad,
          fuenteDato: documento,
          fechaDato: DateTime.fromISO('2026-01-15'),
          estadoRegistro: 'REGISTRADO',
        })
      await papel(cartonActividad.id, carton.id, kilogramo.id, alcance3Id, '100', 'Registro de cartón')
      await papel(luzActividad.id, luz.id, kwhId, alcance2Id, '150', 'Consumo eléctrico del lote')
      await papel(
        transporteActividad.id,
        transporte.id,
        toneladaKm.id,
        alcance3Id,
        '200',
        'Registro de logística'
      )
    }

    const yaCalculado = await CalculoCarbono.query()
      .where('periodoId', periodo.id)
      .where('versionId', versionId)
      .first()
    let calculoId = yaCalculado?.id
    if (yaCalculado) {
      yaCalculado.unidadesProducidas = yaCalculado.unidadesProducidas ?? '1000'
      yaCalculado.unidadFuncional = yaCalculado.unidadFuncional ?? 'empaques'
      await yaCalculado.save()
    } else {
      const calculo = await new CalculoCarbonoService().crear(usuarioId, {
        organizacionId: organizacion.id,
        periodoId: periodo.id,
        versionId,
        unidadesProducidas: '1000',
        unidadFuncional: 'empaques',
        observacion:
          'Ejemplo del empaque de la guía. Tiene que dar 130 kg CO2e y 0.13 kg CO2e por empaque.',
      })
      const total = decimalTexto(calculo.totalCo2e ?? '')
      if (total !== '130' || calculo.omitidos.length) {
        throw new Error(`El empaque debía dar 130 kg CO2e y el cálculo dio ${total || 'sin total'}.`)
      }
      calculoId = calculo.id
    }

    const hayPlan = await AccionReduccion.query().where('calculoCarbonoId', calculoId!).first()
    if (!hayPlan) {
      await AccionReduccion.createMany([
        {
          calculoCarbonoId: calculoId!,
          fuenteEmisionId: carton.id,
          estrategia: 'Reducir el peso del empaque e incorporar material reciclado',
          indicador: 'kg de cartón por empaque',
          meta: 'Bajar el material por unidad',
        },
        {
          calculoCarbonoId: calculoId!,
          fuenteEmisionId: luz.id,
          estrategia: 'Mejorar la eficiencia energética de la línea',
          indicador: 'kWh por lote',
          meta: 'Reducir la electricidad del empaque',
        },
        {
          calculoCarbonoId: calculoId!,
          fuenteEmisionId: transporte.id,
          estrategia: 'Optimizar rutas y cargas',
          indicador: 'kg CO2e/t·km',
          meta: 'Bajar el transporte del lote',
        },
      ])
    }
  }
}
