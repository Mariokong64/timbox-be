export type RemitenteChatPersona = "visitante" | "agente" | "sistema";
export type EstadoAtencionChat =
  | "por_atender"
  | "en_atencion"
  | "cerrada";
export type FiltroEstadoChat =
  | EstadoAtencionChat
  | "inactivas_30_dias"
  | "todas";

export interface CrearConversacionRequest {
  nombre?: unknown;
  correo?: unknown;
  telefono?: unknown;
  mensaje?: unknown;
}

export interface EnviarMensajeRequest {
  contenido?: unknown;
}

export interface MensajeChatPersona {
  id: string;
  contenido: string;
  remitente: RemitenteChatPersona;
  nombreRemitente: string | null;
  fechaRegistro: string;
}

export interface ConversacionChatPersona {
  id: string;
  nombreVisitante: string;
  correoVisitante: string;
  telefonoVisitante: string | null;
  estatus: string;
  fechaInicio: string;
  fechaFin: string | null;
  fechaUltimaActividad: string;
  estadoAtencion: EstadoAtencionChat;
  cantidadMensajes: number;
  ultimaFechaMensajeVisitante: string | null;
  eliminablePorInactividad: boolean;
  mensajes: MensajeChatPersona[];
}

export interface ConversacionChatPersonaResumen
  extends Omit<ConversacionChatPersona, "mensajes"> {
  ultimoMensaje: string | null;
}

export interface SesionChatPersonaCreada {
  token: string;
  conversacion: ConversacionChatPersona;
}
