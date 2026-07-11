import { Router } from "express";
import multer from "multer";
import { validarCfdiController } from "./validador.controller";

const router = Router();
const cargarXml = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 6 * 1024 * 1024,
  },
});

router.post("/", cargarXml.single("file"), validarCfdiController);

export default router;
