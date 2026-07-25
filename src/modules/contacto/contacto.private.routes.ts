import { Router } from "express";
import {
  guardarRespuestaContactoController,
  listarSolicitudesContactoController,
  obtenerSolicitudContactoController,
} from "./contacto.private.controller";

const router = Router();

router.get("/solicitudes", listarSolicitudesContactoController);
router.get("/solicitudes/:id", obtenerSolicitudContactoController);
router.post(
  "/solicitudes/:id/respuestas",
  guardarRespuestaContactoController
);

export default router;
