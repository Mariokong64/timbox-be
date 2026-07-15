import { Router } from "express";
import {
  actualizarUsuarioController,
  crearUsuarioController,
  eliminarUsuarioController,
  listarUsuariosController,
  verificarDisponibilidadUsuarioController,
} from "./usuarios.controller";

const router = Router();

router.get("/", listarUsuariosController);
router.get("/disponibilidad", verificarDisponibilidadUsuarioController);
router.post("/", crearUsuarioController);
router.put("/:id", actualizarUsuarioController);
router.delete("/:id", eliminarUsuarioController);

export default router;
