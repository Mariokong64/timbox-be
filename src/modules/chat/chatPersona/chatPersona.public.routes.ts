import { Router } from "express";
import {
  crearConversacionController,
  enviarMensajeVisitanteController,
  obtenerConversacionVisitanteController,
} from "./chatPersona.public.controller";

const router = Router();

router.post("/conversaciones", crearConversacionController);
router.get("/conversacion", obtenerConversacionVisitanteController);
router.post("/mensajes", enviarMensajeVisitanteController);

export default router;
