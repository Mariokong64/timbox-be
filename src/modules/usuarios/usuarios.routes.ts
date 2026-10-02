import { Router } from "express";
import {
  actualizarUsuarioController,
  crearUsuarioController,
  eliminarUsuarioController,
  listarUsuariosController,
  obtenerPermisosUsuarioController,
  verificarDisponibilidadUsuarioController,
} from "./usuarios.controller";

const router = Router();

router.get("/", listarUsuariosController);
router.get("/disponibilidad", verificarDisponibilidadUsuarioController);
router.get("/:id/permisos", obtenerPermisosUsuarioController);
router.post("/", crearUsuarioController);
router.put("/:id", actualizarUsuarioController);
router.delete("/:id", eliminarUsuarioController);

export default router;
