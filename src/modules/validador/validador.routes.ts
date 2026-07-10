import { Router } from "express";
import { validarCfdiController } from "./validador.controller";

const router = Router();

router.post("/", validarCfdiController);

export default router;
