import { Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import {
  cerrarSolicitud,
  guardarRespuesta,
  listarSolicitudes,
  obtenerSolicitud,
} from "./solicitudes.servicio";

function parametro(valor: string | string[] | undefined): string {
  return Array.isArray(valor) ? valor[0] ?? "" : valor ?? "";
}

function usuarioId(req: AuthRequest): string {
  if (!req.usuario?.id) {
    throw new Error("La sesión del usuario no es válida.");
  }

  return req.usuario.id;
}

function manejarError(error: unknown, res: Response): Response {
  if (error instanceof Error) {
    const noEncontrada = error.message.includes("no existe");
    const sesionInvalida = error.message.includes("sesión");

    return res.status(sesionInvalida ? 401 : noEncontrada ? 404 : 400).json({
      ok: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    ok: false,
    message: "No fue posible procesar la solicitud de contacto.",
  });
}

export async function listarSolicitudesControlador(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const solicitudes = await listarSolicitudes(
      parametro(req.query.estado as string | string[] | undefined)
    );

    return res.status(200).json({ ok: true, data: solicitudes });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function obtenerSolicitudControlador(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const solicitud = await obtenerSolicitud(parametro(req.params.id));
    return res.status(200).json({ ok: true, data: solicitud });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function guardarRespuestaControlador(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const resultado = await guardarRespuesta(
      parametro(req.params.id),
      usuarioId(req),
      req.body
    );

    return res.status(201).json({
      ok: true,
      message: resultado.correoEnviado
        ? "Respuesta guardada y enviada por correo electrónico."
        : "Respuesta guardada, pero no fue posible enviar el correo electrónico.",
      data: resultado,
    });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function cerrarSolicitudControlador(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    usuarioId(req);
    await cerrarSolicitud(parametro(req.params.id));

    return res.status(200).json({
      ok: true,
      message: "Solicitud de contacto cerrada correctamente.",
    });
  } catch (error) {
    return manejarError(error, res);
  }
}
