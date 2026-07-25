import { Request, Response } from "express";
import { ChatPersonaError } from "./chatPersona.error";
import {
  crearConversacionService,
  enviarMensajeVisitanteService,
  obtenerConversacionVisitanteService,
  obtenerTokenChatPersona,
} from "./chatPersona.service";

function manejarError(error: unknown, res: Response): Response {
  if (error instanceof ChatPersonaError) {
    return res.status(error.statusCode).json({
      ok: false,
      message: error.message,
    });
  }

  console.error("Error en chat con persona.", error);

  return res.status(500).json({
    ok: false,
    message: "No fue posible procesar la conversación.",
  });
}

export async function crearConversacionController(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const sesion = await crearConversacionService(req.body);
    return res.status(201).json({ ok: true, data: sesion });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function obtenerConversacionVisitanteController(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const token = obtenerTokenChatPersona(req.headers["x-chat-token"]);
    const conversacion = await obtenerConversacionVisitanteService(token);
    return res.status(200).json({ ok: true, data: conversacion });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function enviarMensajeVisitanteController(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const token = obtenerTokenChatPersona(req.headers["x-chat-token"]);
    const mensaje = await enviarMensajeVisitanteService(token, req.body);
    return res.status(201).json({ ok: true, data: mensaje });
  } catch (error) {
    return manejarError(error, res);
  }
}
