import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  actualizarContenidoService,
  crearContenidoService,
  eliminarContenidoService,
  ErrorGestionContenido,
  listarContenidosService,
  listarSeccionesContenidoService,
} from "./gestionContenido.service";

function parametro(valor: unknown): string {
  return Array.isArray(valor) ? parametro(valor[0]) : typeof valor === "string" ? valor : "";
}

function manejarError(error: unknown, res: Response) {
  if (error instanceof ErrorGestionContenido) {
    return res.status(error.statusCode).json({ ok: false, message: error.message });
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    if ((error as { code?: string }).code === "23505") {
      return res.status(409).json({ ok: false, message: "Ya existe un contenido con esa clave." });
    }
  }

  console.error("Error en gestión de contenidos.", error);
  return res.status(500).json({ ok: false, message: "No se pudo procesar la gestión de contenidos." });
}

export async function listarSeccionesContenidoController(_req: AuthRequest, res: Response) {
  try {
    return res.status(200).json({ ok: true, data: await listarSeccionesContenidoService() });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function listarContenidosController(req: AuthRequest, res: Response) {
  try {
    const data = await listarContenidosService(req.query.seccionId, req.query.busqueda);
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function crearContenidoController(req: AuthRequest, res: Response) {
  try {
    const data = await crearContenidoService(req.body);
    return res.status(201).json({ ok: true, message: "Contenido creado correctamente.", data });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function actualizarContenidoController(req: AuthRequest, res: Response) {
  try {
    const data = await actualizarContenidoService(parametro(req.params.id), req.body);
    return res.status(200).json({ ok: true, message: "Contenido actualizado correctamente.", data });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function eliminarContenidoController(req: AuthRequest, res: Response) {
  try {
    await eliminarContenidoService(parametro(req.params.id));
    return res.status(200).json({ ok: true, message: "Contenido eliminado correctamente." });
  } catch (error) {
    return manejarError(error, res);
  }
}
