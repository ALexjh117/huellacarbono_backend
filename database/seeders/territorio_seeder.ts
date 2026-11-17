import { readFileSync } from 'node:fs'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

type MunicipioSeed = {
  codigo: string
  nombre: string
}

type DepartamentoSeed = {
  codigo: string
  nombre: string
  municipios: MunicipioSeed[]
}

type SedeSeed = {
  codigo: string
  nombre: string
  direccion: string
  telefono: string
  correo: string
  responsableNombre: string
  responsableCargo: string
  responsableCorreo: string
  responsableTelefono: string
}

type OrganizacionSeed = {
  departamento: string
  municipio: string
  nombre: string
  nombreCorto: string
  nit: string
  tipo: 'EMPRESA' | 'ENTIDAD_PUBLICA' | 'INSTITUCION_EDUCATIVA' | 'ONG' | 'OTRA'
  sectorEconomico: string
  correo: string
  telefono: string
  direccion: string
  representanteNombre: string
  representanteTipoDocumento: 'CC' | 'CE' | 'PASAPORTE'
  representanteNumeroDocumento: string
  representanteCorreo: string
  representanteTelefono: string
  sedes: SedeSeed[]
}

/**
 * Datos para que el grupo pruebe su endpoint sin inventar padres.
 * Municipios y departamentos: listado oficial. Organizaciones: ejemplos.
 */
const ORGANIZACIONES: OrganizacionSeed[] = [
  {
    departamento: 'Cauca',
    municipio: 'Popayán',
    nombre: 'Servicio Nacional de Aprendizaje',
    nombreCorto: 'SENA',
    nit: '899999034-1',
    tipo: 'INSTITUCION_EDUCATIVA',
    sectorEconomico: 'Educación para el trabajo',
    correo: 'sena.popayan@huellacarbono.local',
    telefono: '6020000001',
    direccion: 'Carrera 5 con Calle 5, Popayán',
    representanteNombre: 'Representante SENA Popayán',
    representanteTipoDocumento: 'CC',
    representanteNumeroDocumento: '1000000001',
    representanteCorreo: 'representante.popayan@huellacarbono.local',
    representanteTelefono: '3000000001',
    sedes: [
      {
        codigo: 'CTPI',
        nombre: 'CTPI',
        direccion: 'Centro de Teleinformática y Producción Industrial, Popayán',
        telefono: '6020000011',
        correo: 'ctpi.popayan@huellacarbono.local',
        responsableNombre: 'Subdirector CTPI',
        responsableCargo: 'Subdirector',
        responsableCorreo: 'subdirector.ctpi@huellacarbono.local',
        responsableTelefono: '3000000011',
      },
      {
        codigo: 'COMERCIO',
        nombre: 'Comercio',
        direccion: 'Centro de Comercio, Popayán',
        telefono: '6020000012',
        correo: 'comercio.popayan@huellacarbono.local',
        responsableNombre: 'Subdirector Comercio',
        responsableCargo: 'Subdirector',
        responsableCorreo: 'subdirector.comercio@huellacarbono.local',
        responsableTelefono: '3000000012',
      },
    ],
  },
  {
    departamento: 'Cauca',
    municipio: 'Santander de Quilichao',
    nombre: 'Servicio Nacional de Aprendizaje',
    nombreCorto: 'SENA',
    nit: '899999034-1',
    tipo: 'INSTITUCION_EDUCATIVA',
    sectorEconomico: 'Educación para el trabajo',
    correo: 'sena.quilichao@huellacarbono.local',
    telefono: '6020000002',
    direccion: 'Santander de Quilichao',
    representanteNombre: 'Representante SENA Quilichao',
    representanteTipoDocumento: 'CC',
    representanteNumeroDocumento: '1000000002',
    representanteCorreo: 'representante.quilichao@huellacarbono.local',
    representanteTelefono: '3000000002',
    sedes: [
      {
        codigo: 'NORTE',
        nombre: 'Norte del Cauca',
        direccion: 'Santander de Quilichao',
        telefono: '6020000021',
        correo: 'norte.cauca@huellacarbono.local',
        responsableNombre: 'Subdirector Norte del Cauca',
        responsableCargo: 'Subdirector',
        responsableCorreo: 'subdirector.norte@huellacarbono.local',
        responsableTelefono: '3000000021',
      },
    ],
  },
  {
    departamento: 'Valle del Cauca',
    municipio: 'Santiago de Cali',
    nombre: 'Servicio Nacional de Aprendizaje',
    nombreCorto: 'SENA',
    nit: '899999034-1',
    tipo: 'INSTITUCION_EDUCATIVA',
    sectorEconomico: 'Educación para el trabajo',
    correo: 'sena.cali@huellacarbono.local',
    telefono: '6020000003',
    direccion: 'Santiago de Cali',
    representanteNombre: 'Representante SENA Cali',
    representanteTipoDocumento: 'CC',
    representanteNumeroDocumento: '1000000003',
    representanteCorreo: 'representante.cali@huellacarbono.local',
    representanteTelefono: '3000000003',
    sedes: [
      {
        codigo: 'CALI',
        nombre: 'Sede Cali',
        direccion: 'Santiago de Cali',
        telefono: '6020000031',
        correo: 'sede.cali@huellacarbono.local',
        responsableNombre: 'Subdirector Sede Cali',
        responsableCargo: 'Subdirector',
        responsableCorreo: 'subdirector.cali@huellacarbono.local',
        responsableTelefono: '3000000031',
      },
    ],
  },
  {
    departamento: 'Cauca',
    municipio: 'Popayán',
    nombre: 'Empresa Demo del Cauca',
    nombreCorto: 'Demo Cauca',
    nit: '900000001-1',
    tipo: 'EMPRESA',
    sectorEconomico: 'Alimentos',
    correo: 'demo.cauca@huellacarbono.local',
    telefono: '6020000100',
    direccion: 'Popayán',
    representanteNombre: 'Representante Demo Cauca',
    representanteTipoDocumento: 'CC',
    representanteNumeroDocumento: '1000000100',
    representanteCorreo: 'representante.demo@huellacarbono.local',
    representanteTelefono: '3000000100',
    sedes: [
      {
        codigo: 'PLANTA',
        nombre: 'Planta principal',
        direccion: 'Popayán',
        telefono: '6020000101',
        correo: 'planta.demo@huellacarbono.local',
        responsableNombre: 'Jefe de planta',
        responsableCargo: 'Jefe de planta',
        responsableCorreo: 'jefe.planta@huellacarbono.local',
        responsableTelefono: '3000000101',
      },
    ],
  },
]

export default class TerritorioSeeder extends BaseSeeder {
  async run() {
    const departamentos = JSON.parse(
      readFileSync(new URL('../data/divipola.json', import.meta.url), 'utf8')
    ) as DepartamentoSeed[]

    await db.transaction(async (trx) => {
      for (const departamento of departamentos) {
        const insertado = await trx.rawQuery(
          `INSERT INTO departamento (codigo, nombre)
           VALUES (?, ?)
           ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre
           RETURNING id_departamento`,
          [departamento.codigo, departamento.nombre]
        )
        const idDepartamento = insertado.rows[0].id_departamento as number
        const valores: string[] = []
        const parametros: Array<number | string> = []

        for (const municipio of departamento.municipios) {
          valores.push('(?, ?, ?)')
          parametros.push(idDepartamento, municipio.codigo, municipio.nombre)
        }

        await trx.rawQuery(
          `INSERT INTO municipio (id_departamento, codigo, nombre)
           VALUES ${valores.join(', ')}
           ON CONFLICT (codigo) DO UPDATE
             SET nombre = EXCLUDED.nombre,
                 id_departamento = EXCLUDED.id_departamento`,
          parametros
        )
      }

      for (const organizacion of ORGANIZACIONES) {
        const guardada = await trx.rawQuery(
          `INSERT INTO organizacion (
             id_municipio, nombre, nombre_corto, nit, tipo, sector_economico,
             correo, telefono, direccion, representante_nombre,
             representante_tipo_documento, representante_numero_documento,
             representante_correo, representante_telefono
           )
           SELECT municipio.id_municipio, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
           FROM municipio
           INNER JOIN departamento ON departamento.id_departamento = municipio.id_departamento
           WHERE municipio.nombre = ? AND departamento.nombre = ?
           ON CONFLICT (id_municipio, nombre) DO UPDATE SET
             nombre_corto = EXCLUDED.nombre_corto,
             nit = EXCLUDED.nit,
             tipo = EXCLUDED.tipo,
             sector_economico = EXCLUDED.sector_economico,
             correo = EXCLUDED.correo,
             telefono = EXCLUDED.telefono,
             direccion = EXCLUDED.direccion,
             representante_nombre = EXCLUDED.representante_nombre,
             representante_tipo_documento = EXCLUDED.representante_tipo_documento,
             representante_numero_documento = EXCLUDED.representante_numero_documento,
             representante_correo = EXCLUDED.representante_correo,
             representante_telefono = EXCLUDED.representante_telefono
           RETURNING id_organizacion`,
          [
            organizacion.nombre,
            organizacion.nombreCorto,
            organizacion.nit,
            organizacion.tipo,
            organizacion.sectorEconomico,
            organizacion.correo,
            organizacion.telefono,
            organizacion.direccion,
            organizacion.representanteNombre,
            organizacion.representanteTipoDocumento,
            organizacion.representanteNumeroDocumento,
            organizacion.representanteCorreo,
            organizacion.representanteTelefono,
            organizacion.municipio,
            organizacion.departamento,
          ]
        )

        if (!guardada.rows[0]) {
          throw new Error(`No existe el municipio ${organizacion.municipio}`)
        }

        const idOrganizacion = guardada.rows[0].id_organizacion as number

        for (const sede of organizacion.sedes) {
          await trx.rawQuery(
            `INSERT INTO sede (
               id_organizacion, codigo, nombre, direccion, telefono, correo,
               responsable_nombre, responsable_cargo, responsable_correo, responsable_telefono
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT (id_organizacion, nombre) DO UPDATE SET
               codigo = EXCLUDED.codigo,
               direccion = EXCLUDED.direccion,
               telefono = EXCLUDED.telefono,
               correo = EXCLUDED.correo,
               responsable_nombre = EXCLUDED.responsable_nombre,
               responsable_cargo = EXCLUDED.responsable_cargo,
               responsable_correo = EXCLUDED.responsable_correo,
               responsable_telefono = EXCLUDED.responsable_telefono`,
            [
              idOrganizacion,
              sede.codigo,
              sede.nombre,
              sede.direccion,
              sede.telefono,
              sede.correo,
              sede.responsableNombre,
              sede.responsableCargo,
              sede.responsableCorreo,
              sede.responsableTelefono,
            ]
          )
        }
      }
    })
  }
}
