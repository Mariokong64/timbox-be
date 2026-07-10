import express from "express";
import authRoutes from "./modules/autenticacion/auth.routes";
import { corsMiddleware } from "./config/cors";
import publicRoutes from "./routes/public.routes";
import privateRoutes from "./routes/private.routes";

const app = express();

app.use(corsMiddleware);
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("TIMBOX Backend funcionando");
});

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/private", privateRoutes);

export default app;
