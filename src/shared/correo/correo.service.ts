import { env } from "../../config/env";
import { MensajeCorreo, ProveedorCorreo } from "./correo.types";
import { SmtpNodemailerProvider } from "./providers/smtp-nodemailer.provider";

let proveedor: ProveedorCorreo | null = null;

function obtenerProveedor(): ProveedorCorreo {
  if (!env.correo.habilitado) {
    throw new Error("El envío de correo está deshabilitado.");
  }

  proveedor ??= new SmtpNodemailerProvider();
  return proveedor;
}

export async function enviarCorreo(mensaje: MensajeCorreo) {
  return obtenerProveedor().enviar(mensaje);
}

export async function verificarConexionCorreo(): Promise<void> {
  await obtenerProveedor().verificarConexion();
}
