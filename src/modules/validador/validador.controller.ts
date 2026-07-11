import { Request, Response } from "express";
import { validarCfdiService } from "./validador.service";

export async function validarCfdiController(req: Request, res: Response) {
  try {
    const resultado = await validarCfdiService({
      archivo: req.file,
      captchaToken: req.body["g-recaptcha-response"] ?? req.body.captchaToken ?? "",
    });

    return res.status(200).json(resultado);
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
