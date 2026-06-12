import { Request, Response } from "express";
import { loginService } from "./auth.service";

export async function loginController(req: Request, res: Response) {
  try {
    const resultado = await loginService(req.body);

    return res.status(200).json({
      ok: true,
      message: "Login correcto",
      data: resultado,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(401).json({
        ok: false,
        message: error.message,
      }); 
    }

    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
    });
  }
}