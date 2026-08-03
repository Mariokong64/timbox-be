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
  correo: {
    habilitado: obtenerBooleano("CORREO_HABILITADO", false),
    cronReintentos: process.env.CORREO_REINTENTOS_CRON ?? "0 1-5 * * *",
    zonaHoraria:
      process.env.CORREO_REINTENTOS_ZONA_HORARIA ?? "America/Mexico_City",
    tamanoLote: obtenerNumeroPositivo("CORREO_TAMANO_LOTE", 10),
    maxIntentos: obtenerNumeroPositivo("CORREO_MAX_INTENTOS", 6),
    bloqueoExpiradoMs: obtenerNumeroPositivo(
      "CORREO_BLOQUEO_EXPIRADO_MS",
      300000
    ),
    smtp: {
      host: obtenerVariable("SMTP_HOST", false),
      port: obtenerNumeroPositivo("SMTP_PORT", 587),
      secure: obtenerBooleano("SMTP_SECURE", false),
      requireTls: obtenerBooleano("SMTP_REQUIRE_TLS", true),
      user: obtenerVariable("SMTP_USER", false),
      password: obtenerVariable("SMTP_PASSWORD", false),
      from: obtenerVariable("SMTP_FROM", false),
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
