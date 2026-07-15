import { Router } from "express";
import { obtenerResumenDashboardController } from "./dashboard.controller";

const router = Router();

router.get("/resumen", obtenerResumenDashboardController);

export default router;
