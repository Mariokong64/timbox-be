import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  actualizarEnlaceService,
  ErrorGestionURL,
  listarEnlacesService,
  listarSeccionesURLService,
} from "./gestionURL.service";

function parametro(valor: unknown): string {
  return Array.isArray(valor) ? parametro(valor[0]) : typeof valor === "string" ? valor : "";
}

function manejarError(error: unknown, res: Response) {
  if (error instanceof ErrorGestionURL) {
    return res.status(error.statusCode).json({ ok: false, message: error.message });
  }

  console.error("Error en gestión de URL.", error);
  return res.status(500).json({ ok: false, message: "No se pudo procesar la gestión de URL." });
}

export async function listarSeccionesURLController(_req: AuthRequest, res: Response) {
  try {
    return res.status(200).json({ ok: true, data: await listarSeccionesURLService() });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function listarEnlacesController(req: AuthRequest, res: Response) {
  try {
    const data = await listarEnlacesService(req.query.seccionId, req.query.busqueda);
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function actualizarEnlaceController(req: AuthRequest, res: Response) {
  try {
    const data = await actualizarEnlaceService(parametro(req.params.id), req.body);
    return res.status(200).json({ ok: true, message: "Enlace actualizado correctamente.", data });
  } catch (error) {
    return manejarError(error, res);
  }
}
