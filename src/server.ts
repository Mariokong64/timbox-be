import express from "express";
import app from "./app";
import { pool } from "./config/database";
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

pool.connect().then(() => {
    console.log("Base de datos conectada");
  }).catch((error: unknown) => {
    if (error instanceof Error) {
      console.error("Error conectando BD:", error.message);
      return;
    }
    console.error("Error desconocido:", error);
  });