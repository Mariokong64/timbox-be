import cron, { ScheduledTask } from "node-cron";
import { env } from "../../config/env";
import {
  enviarCorreo,
  verificarConexionCorreo,
} from "../../shared/correo/correo.service";
import { crearCorreoSolicitudContacto } from "./contacto.email";
import {
  marcarEnvioExitoso,
  marcarEnvioFallido,
  marcarEnvioPendiente,
  recuperarEnviosInterrumpidos,
  tomarEnviosPendientes,
} from "./contacto.notificaciones.repository";
import { EnvioSolicitudContactoPendiente } from "./contacto.types";

let tareaProgramada: ScheduledTask | null = null;

function obtenerMensajeError(error: unknown): string {
  const mensaje = error instanceof Error ? error.message : String(error);
  return mensaje.slice(0, 4000);
}

async function procesarEnvio(
  envio: EnvioSolicitudContactoPendiente
): Promise<void> {
  try {
    const resultado = await enviarCorreo(crearCorreoSolicitudContacto(envio));
    await marcarEnvioExitoso(envio.envio_id, resultado.mensajeId);
  } catch (error) {
    const mensajeError = obtenerMensajeError(error);

    if (envio.intentos >= env.correo.maxIntentos) {
      await marcarEnvioFallido(envio.envio_id, mensajeError);
      return;
    }

    await marcarEnvioPendiente(envio.envio_id, mensajeError);
  }
}

async function procesarEnvios(
  envios: EnvioSolicitudContactoPendiente[]
): Promise<void> {
  await Promise.all(envios.map(procesarEnvio));
}

export async function procesarNotificacionesSolicitudContacto(
  solicitudContactoId: string
): Promise<void> {
  if (!env.correo.habilitado) {
    return;
  }

  const envios = await tomarEnviosPendientes(
    env.correo.tamanoLote,
    env.correo.maxIntentos,
    solicitudContactoId
  );

  await procesarEnvios(envios);
}

export async function procesarReintentosNotificacionesContacto(): Promise<void> {
  if (!env.correo.habilitado) {
    return;
  }

  try {
    await recuperarEnviosInterrumpidos(
      env.correo.maxIntentos,
      env.correo.bloqueoExpiradoMs
    );

    const envios = await tomarEnviosPendientes(
      env.correo.tamanoLote,
      env.correo.maxIntentos
    );

    await procesarEnvios(envios);
  } catch (error) {
    console.error(
      "No fue posible procesar las notificaciones de contacto:",
      obtenerMensajeError(error)
    );
  }
}

export async function iniciarProcesadorNotificacionesContacto(): Promise<void> {
  if (!env.correo.habilitado || tareaProgramada) {
    if (!env.correo.habilitado) {
      console.log("Envío de correo deshabilitado por configuración.");
    }
    return;
  }

  if (!cron.validate(env.correo.cronReintentos)) {
    console.error(
      `La expresión CORREO_REINTENTOS_CRON no es válida: ${env.correo.cronReintentos}`
    );
    return;
  }

  try {
    await verificarConexionCorreo();
    console.log("Servidor SMTP conectado.");
  } catch (error) {
    console.error(
      "No fue posible verificar el servidor SMTP:",
      obtenerMensajeError(error)
    );
  }

  try {
    await recuperarEnviosInterrumpidos(
      env.correo.maxIntentos,
      env.correo.bloqueoExpiradoMs
    );
  } catch (error) {
    console.error(
      "No fue posible recuperar los envíos interrumpidos:",
      obtenerMensajeError(error)
    );
  }

  tareaProgramada = cron.schedule(
    env.correo.cronReintentos,
    () => procesarReintentosNotificacionesContacto(),
    {
      name: "reintentos-notificaciones-contacto",
      timezone: env.correo.zonaHoraria,
      noOverlap: true,
    }
  );

  console.log(
    `Reintentos de correo programados con "${env.correo.cronReintentos}" ` +
      `en la zona ${env.correo.zonaHoraria}.`
  );
}
