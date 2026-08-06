export interface SeccionURL {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export interface EnlaceAdministrable {
  id: string;
  clave: string;
  url: string;
  activo: boolean;
  fechaActualizacion: Date;
  seccion: SeccionURL;
}

export interface EnlaceRow {
  id: string;
  clave: string;
  url: string;
  activo: boolean;
  fecha_actualizacion: Date;
  seccion_id: string;
  seccion: string;
  seccion_descripcion: string | null;
}

export interface EdicionEnlaceRequest {
  url?: unknown;
  activo?: unknown;
}

export interface DatosEdicionEnlace {
  url: string;
  activo: boolean;
}
