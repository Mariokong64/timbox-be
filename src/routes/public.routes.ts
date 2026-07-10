import { Router } from "express";
import contactoRoutes from "../modules/contacto/contacto.routes";
import validadorRoutes from "../modules/validador/validador.routes";

const router = Router();

router.use("/contacto", contactoRoutes);
router.use("/validador", validadorRoutes);

export default router;
