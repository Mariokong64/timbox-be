export interface PerfilUsuario {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
  fotoPerfil: string | null;
}

export interface FilaPerfilUsuario {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
  foto_perfil: string | null;
}

export interface CredencialesPerfilUsuario {
  contrasena: string;
}

export interface PeticionCambiarContrasena {
  contrasenaActual?: unknown;
  contrasenaNueva?: unknown;
  confirmacionContrasena?: unknown;
}

export interface ArchivoFotoPerfil {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface FotoPerfilLeida {
  contenido: Buffer;
  tipoContenido: string;
}
