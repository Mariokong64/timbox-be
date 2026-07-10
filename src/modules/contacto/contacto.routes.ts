import { Router } from "express";
import { registrarContactoController } from "./contacto.controller";

const router = Router();

router.post("/", registrarContactoController);

export default router;
