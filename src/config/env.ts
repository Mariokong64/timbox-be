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
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
    model: process.env.OLLAMA_MODEL ?? "qwen3:4b-q4_K_M",
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 120000),
    keepAlive: process.env.OLLAMA_KEEP_ALIVE ?? "10m",
  },
  chatbot: {
    contextFile: obtenerVariable("CHATBOT_CONTEXT_FILE", false),
    maxMessageLength: Number(process.env.CHATBOT_MAX_MESSAGE_LENGTH ?? 1000),
  },
  chatPersona: {
    maxMessageLength: Number(
      process.env.CHAT_PERSONA_MAX_MESSAGE_LENGTH ?? 2000
    ),
    tokenExpirationDays: Number(
      process.env.CHAT_PERSONA_TOKEN_EXPIRATION_DAYS ?? 30
    ),
  },
  db: {
    host: obtenerVariable("DB_HOST", false),
    port: Number(process.env.DB_PORT ?? 5432),
    name: obtenerVariable("DB_NAME", false),
    user: obtenerVariable("DB_USER", false),
    password: obtenerVariable("DB_PASSWORD", false),
  },
};
