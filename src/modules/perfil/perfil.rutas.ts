import { NextFunction, Response, Router } from "express";
import multer from "multer";
import { env } from "../../config/env";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  cambiarContrasenaControlador,
  eliminarFotoPerfilControlador,
  guardarFotoPerfilControlador,
  obtenerFotoPerfilControlador,
  obtenerPerfilControlador,
} from "./perfil.controlador";

const rutas = Router();
const cargarFoto = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.perfil.tamanoMaximoFotoBytes,
    files: 1,
  },
});

function procesarFoto(
  req: AuthRequest,
  res: Response,
  siguiente: NextFunction
): void {
  cargarFoto.single("foto")(req, res, (error: unknown) => {
    if (!error) {
      siguiente();
      return;
    }

    const mensaje =
      error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
        ? `La fotografía no debe superar ${env.perfil.tamanoMaximoFotoMb} MB.`
        : "No fue posible recibir la fotografía.";

    res.status(400).json({ ok: false, message: mensaje });
  });
}

rutas.get("/", obtenerPerfilControlador);
rutas.put("/contrasena", cambiarContrasenaControlador);
rutas.get("/foto", obtenerFotoPerfilControlador);
rutas.post("/foto", procesarFoto, guardarFotoPerfilControlador);
rutas.delete("/foto", eliminarFotoPerfilControlador);

export default rutas;
