import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  cambiarContrasena,
  eliminarFotoPerfil,
  ErrorPerfil,
  guardarFotoPerfil,
  leerFotoPerfil,
  obtenerPerfil,
} from "./perfil.servicio";

function obtenerUsuarioId(req: AuthRequest): string {
  if (!req.usuario?.id) {
    throw new ErrorPerfil("La sesión del usuario no es válida.", 401);
  }

  return req.usuario.id;
}

function manejarErrorPerfil(error: unknown, res: Response): Response {
  if (error instanceof ErrorPerfil) {
    return res.status(error.statusCode).json({
      ok: false,
      message: error.message,
    });
  }

  console.error("Error al procesar el perfil del usuario.", error);
  return res.status(500).json({
    ok: false,
    message: "No fue posible procesar el perfil del usuario.",
  });
}

export async function obtenerPerfilControlador(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    return res.status(200).json({
      ok: true,
      data: await obtenerPerfil(obtenerUsuarioId(req)),
    });
  } catch (error) {
    return manejarErrorPerfil(error, res);
  }
}

export async function cambiarContrasenaControlador(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    await cambiarContrasena(obtenerUsuarioId(req), req.body);

    return res.status(200).json({
      ok: true,
      message: "Contraseña actualizada correctamente.",
    });
  } catch (error) {
    return manejarErrorPerfil(error, res);
  }
}

export async function guardarFotoPerfilControlador(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const perfil = await guardarFotoPerfil(obtenerUsuarioId(req), req.file);

    return res.status(200).json({
      ok: true,
      message: "Fotografía actualizada correctamente.",
      data: perfil,
    });
  } catch (error) {
    return manejarErrorPerfil(error, res);
  }
}

export async function obtenerFotoPerfilControlador(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const foto = await leerFotoPerfil(obtenerUsuarioId(req));

    res.setHeader("Content-Type", foto.tipoContenido);
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return res.status(200).send(foto.contenido);
  } catch (error) {
    return manejarErrorPerfil(error, res);
  }
}

export async function eliminarFotoPerfilControlador(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const perfil = await eliminarFotoPerfil(obtenerUsuarioId(req));

    return res.status(200).json({
      ok: true,
      message: "Fotografía eliminada correctamente.",
      data: perfil,
    });
  } catch (error) {
    return manejarErrorPerfil(error, res);
  }
}
