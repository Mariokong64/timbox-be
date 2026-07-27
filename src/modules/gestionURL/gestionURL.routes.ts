import { Router } from "express";
import {
  actualizarEnlaceController,
  crearEnlaceController,
  eliminarEnlaceController,
  listarEnlacesController,
  listarSeccionesURLController,
} from "./gestionURL.controller";

const router = Router();

router.get("/secciones", listarSeccionesURLController);
router.get("/", listarEnlacesController);
router.post("/", crearEnlaceController);
router.put("/:id", actualizarEnlaceController);
router.delete("/:id", eliminarEnlaceController);

export default router;
