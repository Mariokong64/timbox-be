import { env } from "../../config/env";

interface RespuestaRecaptcha {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export async function verificarCaptcha(captchaToken: string): Promise<void> {
  if (!captchaToken) {
    throw new Error("Confirma el captcha antes de continuar.");
  }

  if (!env.recaptchaSecretKey) {
    throw new Error("RECAPTCHA_SECRET_KEY no esta configurado.");
  }

  const parametros = new URLSearchParams({
    secret: env.recaptchaSecretKey,
    response: captchaToken,
  });

  const respuesta = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: parametros,
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo verificar el captcha.");
  }

  const resultado = (await respuesta.json()) as RespuestaRecaptcha;

  if (!resultado.success) {
    throw new Error("Captcha invalido o expirado.");
  }
}
