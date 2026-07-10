import { Request, Response } from "express";

export async function validarCfdiController(_req: Request, res: Response) {
  return res.status(501).json({
    ok: false,
    message: "El validador CFDI aun no esta implementado en el backend.",
  });
}
