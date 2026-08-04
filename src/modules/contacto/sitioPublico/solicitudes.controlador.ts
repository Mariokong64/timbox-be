import { Request, Response } from "express";
import { registrarSolicitudContacto } from "./solicitudes.servicio";

export async function registrarSolicitudContactoControlador(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const solicitud = await registrarSolicitudContacto(req.body);

    return res.status(201).json({
      ok: true,
      message: "Solicitud de contacto registrada correctamente.",
      data: solicitud,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(400).json({
        ok: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}
