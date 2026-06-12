import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { buscarUsuarioPorUsuario } from "./auth.repository";
import { LoginRequest } from "./auth.types";

export async function loginService(data: LoginRequest) {
  const usuarioEncontrado = await buscarUsuarioPorUsuario(data.usuario);

  if (!usuarioEncontrado) {
    throw new Error("Usuario o contraseña incorrectos");
  }

  const passwordValida = await bcrypt.compare(
    data.contrasena,
    usuarioEncontrado.contrasena
  );

  if (!passwordValida) {
    throw new Error("Usuario o contraseña incorrectos");
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET no está configurado en el archivo .env");
  }

  const token = jwt.sign(
    {
      id: usuarioEncontrado.id,
      usuario: usuarioEncontrado.usuario,
      nombre: usuarioEncontrado.nombre,
      correo: usuarioEncontrado.correo,
    },
    secret,
    {
      expiresIn: "8h",
    }
  );

  return {
    token,
    usuario: {
      id: usuarioEncontrado.id,
      usuario: usuarioEncontrado.usuario,
      nombre: usuarioEncontrado.nombre,
      correo: usuarioEncontrado.correo,
    },
  };
}