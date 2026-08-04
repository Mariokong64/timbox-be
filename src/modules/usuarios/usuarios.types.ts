export interface Usuario {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
  fotoPerfil: string | null;
  fechaRegistro: Date;
  creado: Date;
  modificado: Date | null;
}

export interface UsuarioRow {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
  foto_perfil: string | null;
  fecha_registro: Date;
  creado: Date;
  modificado: Date | null;
}

export interface UsuarioRequest {
  usuario?: string;
  nombre?: string;
  correo?: string;
  contrasena?: string;
}

export interface UsuarioDatosCreacion {
  usuario: string;
  nombre: string;
  correo: string;
  contrasenaHash: string;
  creadoPorId: string | null;
}

export interface UsuarioDatosActualizacion {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
  contrasenaHash: string | null;
  modificadoPorId: string | null;
}
