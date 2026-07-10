import { Request, Response } from "express";
import { registrarContactoService } from "./contacto.service";

export async function registrarContactoController(req: Request, res: Response) {
  try {
    const solicitud = await registrarContactoService(req.body);

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
