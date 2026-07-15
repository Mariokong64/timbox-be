import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import usuariosRoutes from "../modules/usuarios/usuarios.routes";

const router = Router();

router.use(authMiddleware);

router.get("/prueba", (req: AuthRequest, res: Response) => {
  res.json({
    ok: true,
    usuario: req.usuario,
    mensaje: "Acceso autorizado",
  });
});

router.use("/dashboard", dashboardRoutes);
router.use("/usuarios", usuariosRoutes);

export default router;
