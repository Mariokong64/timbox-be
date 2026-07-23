export interface LoginRequest {
  usuario: string;
  contrasena: string;
  captchaToken: string;
}

export interface UsuarioAuth {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
  contrasena: string;
}

export interface UsuarioSesion {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
}

export interface LoginResponse {
  token: string;
  usuario: UsuarioSesion;
}

export interface JwtPayload {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
}
