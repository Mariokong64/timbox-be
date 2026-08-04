export type EstadoAtencionSolicitud =
  | "por_atender"
  | "en_atencion"
  | "cerrada";

export type FiltroEstadoSolicitud = EstadoAtencionSolicitud | "todas";

export interface SolicitudContactoResumen {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  rfc: string | null;
  mensaje: string | null;
  estatus: string;
  estadoAtencion: EstadoAtencionSolicitud;
  fechaRegistro: string;
}

export interface RespuestaSolicitudContacto {
  id: string;
  detalles: string;
  fechaAtencion: string;
  usuarioId: string;
  nombreUsuario: string;
}

export interface SolicitudContactoDetalle
  extends SolicitudContactoResumen {
  respuestas: RespuestaSolicitudContacto[];
}

export interface FilaSolicitudContacto {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  rfc: string | null;
  mensaje: string | null;
  estatus: string;
  estado_atencion: EstadoAtencionSolicitud;
  fecha_registro: Date;
}

export interface FilaRespuestaSolicitudContacto {
  id: string;
  detalles: string;
  fecha_atencion: Date;
  usuario_id: string;
  nombre_usuario: string;
}

export interface PeticionGuardarRespuesta {
  respuesta?: unknown;
}

export interface DestinatarioRespuestaSolicitud {
  solicitudId: string;
  nombre: string;
  correo: string;
}

export interface ResultadoGuardarRespuesta {
  respuesta: RespuestaSolicitudContacto;
  correoEnviado: boolean;
}
