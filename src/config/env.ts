import dotenv from "dotenv";

dotenv.config();

function obtenerVariable(nombre: string, requerida = true): string {
  const valor = process.env[nombre];

  if (!valor && requerida) {
    throw new Error(`Falta configurar la variable de entorno ${nombre}`);
  }

  return valor ?? "";
}

function obtenerBooleano(nombre: string, valorPredeterminado: boolean): boolean {
  const valor = process.env[nombre];

  if (!valor) {
    return valorPredeterminado;
  }

  return valor.trim().toLowerCase() === "true";
}

function obtenerNumeroPositivo(
  nombre: string,
  valorPredeterminado: number
): number {
  const valor = Number(process.env[nombre] ?? valorPredeterminado);

  return Number.isFinite(valor) && valor > 0
    ? Math.trunc(valor)
    : valorPredeterminado;
}

const tamanoMaximoFotoPerfilMb = obtenerNumeroPositivo(
  "FOTO_PERFIL_TAMANO_MAXIMO_MB",
  5
);

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
  perfil: {
    rutaFotos: process.env.FOTOS_PERFIL_RUTA?.trim() || "FOTOS_PERFIL",
    tamanoMaximoFotoMb: tamanoMaximoFotoPerfilMb,
    tamanoMaximoFotoBytes: tamanoMaximoFotoPerfilMb * 1024 * 1024,
  },
  correo: {
    habilitado: obtenerBooleano("CORREO_HABILITADO", false),
    remitenteRespuestas: obtenerVariable(
      "CORREO_RESPUESTAS_REMITENTE",
      false
    ),
    smtp: {
      host: obtenerVariable("SMTP_HOST", false),
      port: obtenerNumeroPositivo("SMTP_PORT", 587),
      secure: obtenerBooleano("SMTP_SECURE", false),
      requireTls: obtenerBooleano("SMTP_REQUIRE_TLS", true),
      user: obtenerVariable("SMTP_USER", false),
      password: obtenerVariable("SMTP_PASSWORD", false),
      maxConnections: obtenerNumeroPositivo("SMTP_MAX_CONNECTIONS", 2),
    },
  },
  db: {
    host: obtenerVariable("DB_HOST", false),
    port: Number(process.env.DB_PORT ?? 5432),
    name: obtenerVariable("DB_NAME", false),
    user: obtenerVariable("DB_USER", false),
    password: obtenerVariable("DB_PASSWORD", false),
  },
};
