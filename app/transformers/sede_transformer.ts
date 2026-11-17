import type Sede from '#models/sede'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class SedeTransformer extends BaseTransformer<Sede> {
  toObject() {
    const usuarios = this.resource.usuarios ?? []

    return {
      id: this.resource.id,
      organizacionId: this.resource.organizacionId,
      codigo: this.resource.codigo,
      nombre: this.resource.nombre,
      direccion: this.resource.direccion,
      telefono: this.resource.telefono,
      correo: this.resource.correo,
      responsable: {
        nombre: this.resource.responsableNombre,
        cargo: this.resource.responsableCargo,
        correo: this.resource.responsableCorreo,
        telefono: this.resource.responsableTelefono,
      },
      active: this.resource.estado,
      procesosActivos: Number(this.resource.$extras.procesos_count ?? 0),
      createdAt: this.resource.fechaCreacion?.toISO() ?? null,
      usuarios: usuarios.map((usuario) => ({
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        active: usuario.estado,
      })),
    }
  }
}
