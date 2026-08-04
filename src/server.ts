import app from "./app";
import { pool } from "./config/database";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`Servidor corriendo en http://localhost:${env.port}`);
});

pool.query("SELECT 1").then(() => {
    console.log("Base de datos conectada");
  }).catch((error: unknown) => {
    if (error instanceof Error) {
      console.error("Error conectando BD:", error.message);
      return;
    }
    console.error("Error desconocido:", error);
  });
