import express from "express";
import cors from "cors";
import authRoutes from "./modules/autenticacion/auth.routes";
import { authMiddleware, AuthRequest } from "./middlewares/auth.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("TIMBOX Backend funcionando");
});

app.use("/api/auth", authRoutes);

app.get(
  "/api/privado/prueba",
  authMiddleware,
  (req: AuthRequest, res) => {

    res.json({
      ok: true,
      usuario: req.usuario,
      mensaje: "Acceso autorizado"
    });

  }
);

export default app;