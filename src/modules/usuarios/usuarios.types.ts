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
  permisos?: PermisoPantalla[];
}

export interface PermisoPantalla {
  pantallaId: string;
  clave: string;
  nombre: string;
  leer: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

export interface PermisoPantallaRow {
  pantalla_id: string;
  clave: string;
  nombre: string;
  leer: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
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
  permisos: PermisoPantalla[];
}
