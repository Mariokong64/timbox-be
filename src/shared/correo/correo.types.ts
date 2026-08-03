export interface MensajeCorreo {
  destinatario: string;
  asunto: string;
  texto: string;
  html: string;
  responderA?: string;
}

export interface ResultadoEnvioCorreo {
  mensajeId: string | null;
}

export interface ProveedorCorreo {
  enviar(mensaje: MensajeCorreo): Promise<ResultadoEnvioCorreo>;
  verificarConexion(): Promise<void>;
}
