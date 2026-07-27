import { Router } from "express";
import {
  actualizarContenidoController,
  crearContenidoController,
  eliminarContenidoController,
  listarContenidosController,
  listarSeccionesContenidoController,
} from "./gestionContenido.controller";

const router = Router();

router.get("/secciones", listarSeccionesContenidoController);
router.get("/", listarContenidosController);
router.post("/", crearContenidoController);
router.put("/:id", actualizarContenidoController);
router.delete("/:id", eliminarContenidoController);

export default router;
