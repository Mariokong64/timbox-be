export interface LoginRequest {
  usuario: string;
  contrasena: string;
}

export interface UsuarioAuth {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
  contrasena: string;
}

export interface JwtPayload {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
}