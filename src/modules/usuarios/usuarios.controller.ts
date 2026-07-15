import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  actualizarUsuarioService,
  crearUsuarioService,
  eliminarUsuarioService,
  ErrorUsuarios,
  listarUsuariosService,
  verificarDisponibilidadUsuarioService,
} from "./usuarios.service";

function manejarErrorUsuarios(error: unknown, res: Response) {
  if (error instanceof ErrorUsuarios) {
    return res.status(error.statusCode).json({
      ok: false,
      message: error.message,
    });
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  ) {
    return res.status(409).json({
      ok: false,
      message: "Ya existe un usuario o correo con esos datos.",
    });
  }

  console.error("Error en usuarios.", error);

  return res.status(500).json({
    ok: false,
    message: "No se pudo procesar la solicitud de usuarios.",
  });
}

function obtenerParametroTexto(valor: unknown): string {
  if (Array.isArray(valor)) {
    return obtenerParametroTexto(valor[0]);
  }

  return typeof valor === "string" ? valor : "";
}

export async function listarUsuariosController(_req: AuthRequest, res: Response) {
  try {
    const usuarios = await listarUsuariosService();

    return res.status(200).json({
      ok: true,
      data: usuarios,
    });
  } catch (error) {
    return manejarErrorUsuarios(error, res);
  }
}

export async function verificarDisponibilidadUsuarioController(req: AuthRequest, res: Response) {
  try {
    const resultado = await verificarDisponibilidadUsuarioService(
      obtenerParametroTexto(req.query.usuario),
      obtenerParametroTexto(req.query.excluirId) || null
    );

    return res.status(200).json({
      ok: true,
      data: resultado,
    });
  } catch (error) {
    return manejarErrorUsuarios(error, res);
  }
}

export async function crearUsuarioController(req: AuthRequest, res: Response) {
  try {
    const usuario = await crearUsuarioService(req.body, req.usuario?.id ?? null);

    return res.status(201).json({
      ok: true,
      message: "Usuario creado correctamente.",
      data: usuario,
    });
  } catch (error) {
    return manejarErrorUsuarios(error, res);
  }
}

export async function actualizarUsuarioController(req: AuthRequest, res: Response) {
  try {
    const usuario = await actualizarUsuarioService(obtenerParametroTexto(req.params.id), req.body, req.usuario?.id ?? null);

    return res.status(200).json({
      ok: true,
      message: "Usuario actualizado correctamente.",
      data: usuario,
    });
  } catch (error) {
    return manejarErrorUsuarios(error, res);
  }
}

export async function eliminarUsuarioController(req: AuthRequest, res: Response) {
  try {
    await eliminarUsuarioService(obtenerParametroTexto(req.params.id), req.usuario?.id ?? null);

    return res.status(200).json({
      ok: true,
      message: "Usuario eliminado correctamente.",
    });
  } catch (error) {
    return manejarErrorUsuarios(error, res);
  }
}
