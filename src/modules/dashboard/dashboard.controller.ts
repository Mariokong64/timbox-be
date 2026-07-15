import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { obtenerResumenDashboardService } from "./dashboard.service";

export async function obtenerResumenDashboardController(_req: AuthRequest, res: Response) {
  try {
    const resumen = await obtenerResumenDashboardService();

    return res.status(200).json({
      ok: true,
      data: resumen,
    });
  } catch (error) {
    console.error("Error en dashboard.", error);

    return res.status(500).json({
      ok: false,
      message: "No se pudo obtener la informacion del dashboard.",
    });
  }
}
