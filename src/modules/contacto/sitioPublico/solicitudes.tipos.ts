export interface PeticionSolicitudContacto {
  nombre: string;
  correo: string;
  telefono?: string;
  rfc?: string;
  mensaje: string;
  captchaToken: string;
}

export interface DatosSolicitudContactoLimpios {
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
