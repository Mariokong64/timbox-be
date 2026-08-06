import { Request, Response } from "express";
import { solicitarURLService } from "./solicitudURL.service";

function parametro(valor: unknown): string {
  return Array.isArray(valor) ? parametro(valor[0]) : typeof valor === "string" ? valor : "";
}

export async function solicitarURLController(req: Request, res: Response): Promise<Response> {
  try {
    const url = await solicitarURLService(parametro(req.params.clave));

    if (!url) {
      return res.status(404).json({ ok: false });
    }

    return res.status(200).json({ ok: true, data: { url } });
  } catch (error) {
    console.error("No se pudo resolver la URL pública.", error);
    return res.status(500).json({ ok: false });
  }
}
