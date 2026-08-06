import { Router } from "express";
import { solicitarURLController } from "./solicitudURL.controller";

const router = Router();

router.get("/:clave", solicitarURLController);

export default router;
