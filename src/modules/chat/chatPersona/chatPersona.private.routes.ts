import { Router } from "express";
import {
  eliminarConversacionInactivaController,
  enviarMensajeAgenteController,
  finalizarConversacionController,
  listarConversacionesController,
  obtenerConversacionAgenteController,
} from "./chatPersona.private.controller";

const router = Router();

router.get("/conversaciones", listarConversacionesController);
router.get("/conversaciones/:id", obtenerConversacionAgenteController);
router.post("/conversaciones/:id/mensajes", enviarMensajeAgenteController);
router.post("/conversaciones/:id/finalizar", finalizarConversacionController);
router.delete(
  "/conversaciones/:id",
  eliminarConversacionInactivaController
);

export default router;
