import { Router } from "express";
import {
  actualizarEnlaceController,
  listarEnlacesController,
  listarSeccionesURLController,
} from "./gestionURL.controller";

const router = Router();

router.get("/secciones", listarSeccionesURLController);
router.get("/", listarEnlacesController);
router.put("/:id", actualizarEnlaceController);

export default router;
