import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  guardarRespuestaContactoService,
  listarSolicitudesContactoService,
  obtenerSolicitudContactoService,
} from "./contacto.service";

function parametro(valor: string | string[] | undefined): string {
  return Array.isArray(valor) ? valor[0] ?? "" : valor ?? "";
}

function manejarError(error: unknown, res: Response): Response {
  if (error instanceof Error) {
    const noEncontrada = error.message.includes("no existe");

    return res.status(noEncontrada ? 404 : 400).json({
      ok: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    ok: false,
    message: "No fue posible consultar las solicitudes de contacto.",
  });
}

export async function listarSolicitudesContactoController(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const solicitudes = await listarSolicitudesContactoService(
      parametro(req.query.estado as string | string[] | undefined)
    );

    return res.status(200).json({ ok: true, data: solicitudes });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function obtenerSolicitudContactoController(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const solicitud = await obtenerSolicitudContactoService(
      parametro(req.params.id)
    );

    return res.status(200).json({ ok: true, data: solicitud });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function guardarRespuestaContactoController(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    if (!req.usuario?.id) {
      return res.status(401).json({
        ok: false,
        message: "La sesión del usuario no es válida.",
      });
    }

    const respuesta = await guardarRespuestaContactoService(
      parametro(req.params.id),
      req.usuario.id,
      req.body
    );

    return res.status(201).json({
      ok: true,
      message:
        "Respuesta guardada correctamente. El correo electrónico aún no fue enviado.",
      data: respuesta,
    });
  } catch (error) {
    return manejarError(error, res);
  }
}
