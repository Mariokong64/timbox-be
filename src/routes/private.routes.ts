import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/prueba", (req: AuthRequest, res: Response) => {
  res.json({
    ok: true,
    usuario: req.usuario,
    mensaje: "Acceso autorizado",
  });
});

export default router;
