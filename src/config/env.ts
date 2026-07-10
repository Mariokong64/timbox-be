import dotenv from "dotenv";

dotenv.config();

function obtenerVariable(nombre: string, requerida = true): string {
  const valor = process.env[nombre];

  if (!valor && requerida) {
    throw new Error(`Falta configurar la variable de entorno ${nombre}`);
  }

  return valor ?? "";
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  frontendUrl: process.env.FRONTEND_URL ?? "",
  jwtSecret: obtenerVariable("JWT_SECRET", false),
  recaptchaSecretKey: obtenerVariable("RECAPTCHA_SECRET_KEY", false),
  db: {
    host: obtenerVariable("DB_HOST", false),
    port: Number(process.env.DB_PORT ?? 5432),
    name: obtenerVariable("DB_NAME", false),
    user: obtenerVariable("DB_USER", false),
    password: obtenerVariable("DB_PASSWORD", false),
  },
};
