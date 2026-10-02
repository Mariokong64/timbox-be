import type { PermisoPantalla } from "../usuarios/usuarios.types";

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
  foto_perfil: string | null;
}

export interface UsuarioSesion {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
  fotoPerfil: string | null;
}

export interface LoginResponse {
  token: string;
  usuario: UsuarioSesion;
  permisos: PermisoPantalla[];
}

export interface JwtPayload {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
  fotoPerfil: string | null;
}
