import GwpSet from '#models/gwp_set'
import GwpValue from '#models/gwp_value'
import db from '@adonisjs/lucid/services/db'

/**
 * IPCC AR6 GWP100 values, not activity emission factors.
 * Sources: IPCC AR6 WGIII Annex II, Table 9; methane source classes are
 * distinguished using Tables 11 and 12. Table 9 values are based on AR6 WGI
 * (Forster et al. 2021, Section 7.6 and Table 7.SM.7). Values are stored
 * with their gas-source distinctions and are applied only through a linked
 * methodology version. No value is selected globally by default.
 */
const SOURCE = 'IPCC AR6 WGIII Annex II, Table 9'
const REFERENCE = 'https://www.ipcc.ch/report/ar6/wg3/downloads/report/IPCC_AR6_WGIII_Annex-II.pdf'
const VALUES = [
  { code: 'CO2', name: 'Dióxido de carbono', value: '1', note: 'GWP100; valor de referencia.' },
  {
    code: 'CH4_BIOGENIC',
    name: 'Metano biogénico',
    value: '27',
    note: 'GWP100; Annex II Table 9.',
  },
  {
    code: 'CH4_FOSSIL_COMBUSTION',
    name: 'Metano fósil de combustión',
    value: '27',
    note: 'GWP100; Annex II Table 9.',
  },
  {
    code: 'CH4_FOSSIL_FUGITIVE_PROCESS',
    name: 'Metano fósil fugitivo o de proceso',
    value: '29.8',
    note: 'GWP100; Annex II Table 9.',
  },
  { code: 'N2O', name: 'Óxido nitroso', value: '273', note: 'GWP100; Annex II Table 9.' },
  { code: 'HFC-32', name: 'HFC-32', value: '770', note: 'GWP100; Annex II Table 9.' },
  { code: 'HFC-143a', name: 'HFC-143a', value: '5807', note: 'GWP100; Annex II Table 9.' },
  { code: 'CF4', name: 'CF4', value: '7379', note: 'GWP100; Annex II Table 9.' },
  { code: 'C2F6', name: 'C2F6', value: '12410', note: 'GWP100; Annex II Table 9.' },
  { code: 'C3F8', name: 'C3F8', value: '9289', note: 'GWP100; Annex II Table 9.' },
  { code: 'C4F10', name: 'C4F10', value: '10022', note: 'GWP100; Annex II Table 9.' },
  { code: 'C5F12', name: 'C5F12', value: '9218', note: 'GWP100; Annex II Table 9.' },
  { code: 'C6F14', name: 'C6F14', value: '8617', note: 'GWP100; Annex II Table 9.' },
  { code: 'C7F16', name: 'C7F16', value: '8409', note: 'GWP100; Annex II Table 9.' },
  { code: 'c-C4F8', name: 'c-C4F8', value: '13902', note: 'GWP100; Annex II Table 9.' },
  { code: 'HFC-134a', name: 'HFC-134a', value: '1526', note: 'GWP100; Annex II Table 9.' },
  { code: 'HFC-125', name: 'HFC-125', value: '3744', note: 'GWP100; Annex II Table 9.' },
  { code: 'HFC-152a', name: 'HFC-152a', value: '164', note: 'GWP100; Annex II Table 9.' },
  { code: 'HFC-227ea', name: 'HFC-227ea', value: '3602', note: 'GWP100; Annex II Table 9.' },
  { code: 'HFC-23', name: 'HFC-23', value: '14590', note: 'GWP100; Annex II Table 9.' },
  { code: 'HFC-236fa', name: 'HFC-236fa', value: '8689', note: 'GWP100; Annex II Table 9.' },
  { code: 'HFC-245fa', name: 'HFC-245fa', value: '962', note: 'GWP100; Annex II Table 9.' },
  { code: 'HFC-365mfc', name: 'HFC-365mfc', value: '913', note: 'GWP100; Annex II Table 9.' },
  {
    code: 'HFC-43-10-mee',
    name: 'HFC-43-10-mee',
    value: '1599',
    note: 'GWP100; Annex II Table 9.',
  },
  {
    code: 'SF6',
    name: 'Hexafluoruro de azufre',
    value: '25184',
    note: 'GWP100; Annex II Table 9.',
  },
  { code: 'NF3', name: 'NF3', value: '17423', note: 'GWP100; Annex II Table 9.' },
] as const

export default class GwpAr6Seeder {
  async run() {
    await db.transaction(async (trx) => {
      let set = await GwpSet.query({ client: trx }).where('codigo', 'IPCC-AR6-WGIII-GWP100').first()
      if (set) {
        if (
          set.nombre !== 'IPCC AR6 GWP100' ||
          set.horizonteAnios !== 100 ||
          set.estandarVersion !== 'AR6 WGIII Annex II (2022)' ||
          set.fuenteCientifica !== SOURCE ||
          set.referencia !== REFERENCE ||
          !set.estado
        ) {
          throw new Error(
            'El conjunto IPCC-AR6-WGIII-GWP100 existe con metadatos incompatibles; no se modifica.'
          )
        }
      } else {
        set = await GwpSet.create(
          {
            codigo: 'IPCC-AR6-WGIII-GWP100',
            nombre: 'IPCC AR6 GWP100',
            horizonteAnios: 100,
            estandarVersion: 'AR6 WGIII Annex II (2022)',
            fuenteCientifica: SOURCE,
            referencia: REFERENCE,
            estado: true,
          },
          { client: trx }
        )
      }

      const expectedCodes = new Set(VALUES.map((item) => item.code))
      const existingCodes = await GwpValue.query({ client: trx })
        .where('gwpSetId', set.id)
        .select('gasCodigo')
      const unexpectedCodes = existingCodes
        .map((item) => item.gasCodigo)
        .filter((code) => !expectedCodes.has(code as (typeof VALUES)[number]['code']))
      if (unexpectedCodes.length) {
        throw new Error(
          `El conjunto GWP contiene gases fuera de esta versión documentada: ${unexpectedCodes.join(', ')}`
        )
      }

      for (const expected of VALUES) {
        const existing = await GwpValue.query({ client: trx })
          .where('gwpSetId', set.id)
          .where('gasCodigo', expected.code)
          .first()
        if (existing) {
          if (
            existing.nombreGas !== expected.name ||
            existing.valor !== expected.value ||
            existing.nota !== expected.note
          ) {
            throw new Error(
              `El GWP ${expected.code} difiere de la fuente; se cancela sin sobrescribir.`
            )
          }
          continue
        }
        await GwpValue.create(
          {
            gwpSetId: set.id,
            gasCodigo: expected.code,
            nombreGas: expected.name,
            valor: expected.value,
            nota: expected.note,
          },
          { client: trx }
        )
      }
    })
  }
}
