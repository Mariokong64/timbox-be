import { Request, Response } from "express";
import { ErrorLogin, loginService } from "./auth.service";

export async function loginController(req: Request, res: Response) {
  try {
    const resultado = await loginService(req.body);

    return res.status(200).json({
      ok: true,
      message: "Sesión iniciada correctamente.",
      data: resultado,
    });
  } catch (error: unknown) {
    if (error instanceof ErrorLogin) {
      return res.status(error.statusCode).json({
        ok: false,
        message: error.message,
      });
    }

    console.error("Error al iniciar sesión.", error);

    return res.status(500).json({
      ok: false,
      message: "No se pudo iniciar sesión.",
    });
  }
}
