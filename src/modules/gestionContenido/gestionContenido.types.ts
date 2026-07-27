export interface SeccionContenido {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export interface ContenidoAdministrable {
  id: string;
  clave: string;
  contenido: string;
  activo: boolean;
  fechaActualizacion: Date;
  seccion: SeccionContenido;
}

export interface ContenidoRow {
  id: string;
  clave: string;
  contenido: string;
  activo: boolean;
  fecha_actualizacion: Date;
  seccion_id: string;
  seccion: string;
  seccion_descripcion: string | null;
}

export interface ContenidoRequest {
  clave?: unknown;
  contenido?: unknown;
  seccionId?: unknown;
  activo?: unknown;
}

export interface DatosContenido {
  clave: string;
  contenido: string;
  seccionId: string;
  activo: boolean;
}
