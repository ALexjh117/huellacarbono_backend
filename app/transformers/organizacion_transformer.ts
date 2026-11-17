import type Organizacion from '#models/organizacion'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class OrganizacionTransformer extends BaseTransformer<Organizacion> {
  toObject() {
    const municipio = this.resource.municipio
    const departamento = municipio?.departamento

    return {
      id: this.resource.id,
      nombre: this.resource.nombre,
      nombreCorto: this.resource.nombreCorto,
      nit: this.resource.nit,
      tipo: this.resource.tipo,
      sectorEconomico: this.resource.sectorEconomico,
      correo: this.resource.correo,
      telefono: this.resource.telefono,
      direccion: this.resource.direccion,
      active: this.resource.estado,
      createdAt: this.resource.fechaCreacion?.toISO() ?? null,
      sedesActivas: Number(this.resource.$extras.sedes_count ?? 0),
      municipio: municipio
        ? {
            id: municipio.id,
            codigo: municipio.codigo,
            nombre: municipio.nombre,
            departamento: departamento
              ? {
                  id: departamento.id,
                  codigo: departamento.codigo,
                  nombre: departamento.nombre,
                }
              : null,
          }
        : null,
      representante: {
        nombre: this.resource.representanteNombre,
        tipoDocumento: this.resource.representanteTipoDocumento,
        numeroDocumento: this.resource.representanteNumeroDocumento,
        correo: this.resource.representanteCorreo,
        telefono: this.resource.representanteTelefono,
      },
    }
  }
}
