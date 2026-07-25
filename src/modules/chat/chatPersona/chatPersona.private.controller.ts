import { Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { ChatPersonaError } from "./chatPersona.error";
import {
  eliminarConversacionInactivaService,
  enviarMensajeAgenteService,
  finalizarConversacionService,
  listarConversacionesService,
  obtenerConversacionAgenteService,
} from "./chatPersona.service";

function parametro(valor: string | string[] | undefined): string {
  return Array.isArray(valor) ? valor[0] ?? "" : valor ?? "";
}

function manejarError(error: unknown, res: Response): Response {
  if (error instanceof ChatPersonaError) {
    return res.status(error.statusCode).json({
      ok: false,
      message: error.message,
    });
  }

  console.error("Error en atención de chats.", error);
  return res.status(500).json({
    ok: false,
    message: "No fue posible procesar la conversación.",
  });
}

function usuarioId(req: AuthRequest): string {
  if (!req.usuario?.id) {
    throw new ChatPersonaError("La sesión del usuario no es válida.", 401);
  }

  return req.usuario.id;
}

export async function listarConversacionesController(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const conversaciones = await listarConversacionesService(
      parametro(req.query.estado as string | string[] | undefined)
    );
    return res.status(200).json({ ok: true, data: conversaciones });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function obtenerConversacionAgenteController(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const conversacion = await obtenerConversacionAgenteService(
      parametro(req.params.id)
    );
    return res.status(200).json({ ok: true, data: conversacion });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function enviarMensajeAgenteController(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const mensaje = await enviarMensajeAgenteService(
      parametro(req.params.id),
      usuarioId(req),
      req.body
    );
    return res.status(201).json({ ok: true, data: mensaje });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function finalizarConversacionController(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    await finalizarConversacionService(parametro(req.params.id));
    return res.status(200).json({
      ok: true,
      message: "Conversación finalizada correctamente.",
    });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function eliminarConversacionInactivaController(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    await eliminarConversacionInactivaService(parametro(req.params.id));

    return res.status(200).json({
      ok: true,
      message: "Conversación eliminada correctamente.",
    });
  } catch (error) {
    return manejarError(error, res);
  }
}
