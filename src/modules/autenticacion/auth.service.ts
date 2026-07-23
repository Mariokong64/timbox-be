import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { verificarCaptcha } from "../../shared/services/recaptcha.service";
import { buscarUsuarioPorIdentificador } from "./auth.repository";
import { LoginRequest, LoginResponse, UsuarioAuth, UsuarioSesion } from "./auth.types";

export class ErrorLogin extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
  }
}

const MENSAJE_CREDENCIALES_INVALIDAS = "Usuario o contraseña incorrectos.";

function limpiarTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function crearUsuarioSesion(usuario: UsuarioAuth): UsuarioSesion {
  return {
    id: usuario.id,
    usuario: usuario.usuario,
    nombre: usuario.nombre,
    correo: usuario.correo,
  };
}

export async function loginService(data: LoginRequest): Promise<LoginResponse> {
  const identificador = limpiarTexto(data?.usuario);
  const contrasena = limpiarTexto(data?.contrasena);
  const captchaToken = limpiarTexto(data?.captchaToken);

  if (!identificador || !contrasena) {
    throw new ErrorLogin("Usuario y contraseña son obligatorios.", 400);
  }

  try {
    await verificarCaptcha(captchaToken);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo verificar el captcha.";

    throw new ErrorLogin(mensaje, 400);
  }

  const usuarioEncontrado = await buscarUsuarioPorIdentificador(identificador);

  if (!usuarioEncontrado) {
    throw new ErrorLogin(MENSAJE_CREDENCIALES_INVALIDAS, 401);
  }

  const passwordValida = await bcrypt.compare(contrasena, usuarioEncontrado.contrasena);

  if (!passwordValida) {
    throw new ErrorLogin(MENSAJE_CREDENCIALES_INVALIDAS, 401);
  }

  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET no está configurado en el archivo .env.");
  }

  const usuarioSesion = crearUsuarioSesion(usuarioEncontrado);
  const token = jwt.sign(usuarioSesion, env.jwtSecret, {
    expiresIn: "8h",
  });

  return {
    token,
    usuario: usuarioSesion,
  };
}
