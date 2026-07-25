export interface ContactoRequest {
  nombre: string;
  correo: string;
  telefono?: string;
  rfc?: string;
  mensaje: string;
  captchaToken: string;
}

export interface ContactoDatosLimpios {
  nombre: string;
  correo: string;
  telefono: string | null;
  rfc: string | null;
  mensaje: string;
}

export interface SolicitudContactoCreada {
  id: string;
  fecha_registro: Date;
}

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

export interface SolicitudContactoRow {
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

export interface RespuestaSolicitudContactoRow {
  id: string;
  detalles: string;
  fecha_atencion: Date;
  usuario_id: string;
  nombre_usuario: string;
}

export interface GuardarRespuestaContactoRequest {
  respuesta?: unknown;
}
