import nodemailer, { Transporter } from "nodemailer";
import { env } from "../../../config/env";
import {
  MensajeCorreo,
  ProveedorCorreo,
  ResultadoEnvioCorreo,
} from "../correo.types";

export class SmtpNodemailerProvider implements ProveedorCorreo {
  private readonly transportador: Transporter;

  constructor() {
    const configuracion = env.correo.smtp;

    if (!configuracion.host) {
      throw new Error("Falta configurar la variable de entorno SMTP_HOST.");
    }

    if (Boolean(configuracion.user) !== Boolean(configuracion.password)) {
      throw new Error(
        "SMTP_USER y SMTP_PASSWORD deben configurarse juntos o dejarse ambos vacíos."
      );
    }

    this.transportador = nodemailer.createTransport({
      pool: true,
      maxConnections: configuracion.maxConnections,
      maxMessages: 100,
      host: configuracion.host,
      port: configuracion.port,
      secure: configuracion.secure,
      requireTLS: configuracion.requireTls,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
      auth: configuracion.user
        ? {
            user: configuracion.user,
            pass: configuracion.password,
          }
        : undefined,
    });
  }

  async enviar(mensaje: MensajeCorreo): Promise<ResultadoEnvioCorreo> {
    const resultado = await this.transportador.sendMail({
      from: mensaje.remitente,
      to: mensaje.destinatario,
      replyTo: mensaje.responderA,
      subject: mensaje.asunto,
      text: mensaje.texto,
      html: mensaje.html,
    });

    if (!Array.isArray(resultado.accepted) || resultado.accepted.length === 0) {
      throw new Error("El servidor SMTP no aceptó al destinatario.");
    }

    return {
      mensajeId:
        typeof resultado.messageId === "string" ? resultado.messageId : null,
    };
  }

  async verificarConexion(): Promise<void> {
    await this.transportador.verify();
  }
}
