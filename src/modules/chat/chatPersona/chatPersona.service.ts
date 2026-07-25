import { createHash, randomBytes } from "node:crypto";
import { env } from "../../../config/env";
import { ChatPersonaError } from "./chatPersona.error";
import {
  agregarMensajeAgente,
  agregarMensajeVisitante,
  crearConversacionRepositorio,
  eliminarConversacionInactivaRepositorio,
  finalizarConversacionRepositorio,
  listarConversacionesRepositorio,
  obtenerConversacionPorId,
  obtenerConversacionPorTokenHash,
} from "./chatPersona.repository";
import {
  ConversacionChatPersona,
  ConversacionChatPersonaResumen,
  CrearConversacionRequest,
  EnviarMensajeRequest,
  FiltroEstadoChat,
  MensajeChatPersona,
  SesionChatPersonaCreada,
} from "./chatPersona.types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FILTROS_ESTADO: FiltroEstadoChat[] = [
  "por_atender",
  "en_atencion",
  "cerrada",
  "inactivas_30_dias",
  "todas",
];

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function validarContenido(valor: unknown): string {
  const contenido = texto(valor);

  if (!contenido) {
    throw new ChatPersonaError("Escribe un mensaje.", 400);
  }

  if (contenido.length > env.chatPersona.maxMessageLength) {
    throw new ChatPersonaError(
      `El mensaje no debe superar ${env.chatPersona.maxMessageLength} caracteres.`,
      400
    );
  }

  return contenido;
}

function validarId(id: string): string {
  if (!UUID_REGEX.test(id)) {
    throw new ChatPersonaError("La conversación no es válida.", 400);
  }

  return id;
}

export function obtenerTokenChatPersona(
  valor: string | string[] | undefined
): string {
  const token = Array.isArray(valor) ? valor[0]?.trim() : valor?.trim();

  if (!token || token.length < 32 || token.length > 200) {
    throw new ChatPersonaError("La sesión del chat no es válida.", 401);
  }

  return token;
}

function crearToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");

  return {
    token,
    tokenHash: crearTokenHash(token),
  };
}

function crearTokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function crearConversacionService(
  datos: CrearConversacionRequest
): Promise<SesionChatPersonaCreada> {
  const nombre = texto(datos.nombre);
  const correo = texto(datos.correo).toLowerCase();
  const telefono = texto(datos.telefono) || null;
  const mensaje = validarContenido(datos.mensaje);

  if (nombre.length < 2 || nombre.length > 150) {
    throw new ChatPersonaError("Escribe un nombre válido.", 400);
  }

  if (!CORREO_REGEX.test(correo) || correo.length > 150) {
    throw new ChatPersonaError("Escribe un correo electrónico válido.", 400);
  }

  if (telefono && (telefono.length < 7 || telefono.length > 20)) {
    throw new ChatPersonaError("Escribe un teléfono válido.", 400);
  }

  const { token, tokenHash } = crearToken();
  const fechaExpiracion = new Date();
  fechaExpiracion.setDate(
    fechaExpiracion.getDate() + env.chatPersona.tokenExpirationDays
  );
  const conversacion = await crearConversacionRepositorio({
    tokenHash,
    nombre,
    correo,
    telefono,
    mensaje,
    fechaExpiracion,
  });

  return { token, conversacion };
}

export async function obtenerConversacionVisitanteService(
  token: string
): Promise<ConversacionChatPersona> {
  const conversacion = await obtenerConversacionPorTokenHash(
    crearTokenHash(token)
  );

  if (!conversacion) {
    throw new ChatPersonaError(
      "La conversación no existe o la sesión expiró.",
      404
    );
  }

  return conversacion;
}

export async function enviarMensajeVisitanteService(
  token: string,
  datos: EnviarMensajeRequest
): Promise<MensajeChatPersona> {
  const mensaje = await agregarMensajeVisitante(
    crearTokenHash(token),
    validarContenido(datos.contenido)
  );

  if (!mensaje) {
    throw new ChatPersonaError(
      "La conversación terminó o la sesión expiró.",
      409
    );
  }

  return mensaje;
}

export async function listarConversacionesService(
  estadoValor?: unknown
): Promise<
  ConversacionChatPersonaResumen[]
> {
  const estado =
    typeof estadoValor === "string" && estadoValor.trim()
      ? estadoValor.trim().toLowerCase()
      : "todas";

  if (!FILTROS_ESTADO.includes(estado as FiltroEstadoChat)) {
    throw new ChatPersonaError("El filtro de estado no es válido.", 400);
  }

  return listarConversacionesRepositorio(estado as FiltroEstadoChat);
}

export async function obtenerConversacionAgenteService(
  id: string
): Promise<ConversacionChatPersona> {
  const conversacion = await obtenerConversacionPorId(validarId(id));

  if (!conversacion) {
    throw new ChatPersonaError("La conversación no existe.", 404);
  }

  return conversacion;
}

export async function enviarMensajeAgenteService(
  id: string,
  usuarioId: string,
  datos: EnviarMensajeRequest
): Promise<MensajeChatPersona> {
  const mensaje = await agregarMensajeAgente(
    validarId(id),
    usuarioId,
    validarContenido(datos.contenido)
  );

  if (!mensaje) {
    throw new ChatPersonaError(
      "La conversación ya fue finalizada.",
      409
    );
  }

  return mensaje;
}

export async function finalizarConversacionService(
  id: string
): Promise<void> {
  const finalizada = await finalizarConversacionRepositorio(
    validarId(id)
  );

  if (!finalizada) {
    throw new ChatPersonaError(
      "No puedes finalizar esta conversación.",
      409
    );
  }
}

export async function eliminarConversacionInactivaService(
  id: string
): Promise<void> {
  const eliminada = await eliminarConversacionInactivaRepositorio(
    validarId(id)
  );

  if (!eliminada) {
    throw new ChatPersonaError(
      "La conversación no cumple el periodo de inactividad de 30 días.",
      409
    );
  }
}
