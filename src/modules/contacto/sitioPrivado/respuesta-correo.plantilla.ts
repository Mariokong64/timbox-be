import { MensajeCorreo } from "../../../shared/correo/correo.types";
import { DestinatarioRespuestaSolicitud } from "./solicitudes.tipos";

function escaparHtml(valor: string): string {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function crearCorreoRespuestaSolicitud(
  destinatario: DestinatarioRespuestaSolicitud,
  respuesta: string,
  remitente: string
): MensajeCorreo {
  return {
    remitente,
    destinatario: destinatario.correo,
    asunto: "Respuesta a tu solicitud de contacto | TIMBOX",
    texto: [
      `Hola ${destinatario.nombre},`,
      "",
      "Hemos respondido tu solicitud de contacto:",
      "",
      respuesta,
      "",
      `Folio de solicitud: ${destinatario.solicitudId}`,
      "",
      "Atentamente,",
      "Equipo TIMBOX",
    ].join("\n"),
    html: `
      <h2>Respuesta a tu solicitud de contacto</h2>
      <p>Hola ${escaparHtml(destinatario.nombre)},</p>
      <p>Hemos respondido tu solicitud de contacto:</p>
      <div style="padding: 16px; background: #f5f6f7; border-radius: 8px; white-space: pre-wrap;">${escaparHtml(respuesta)}</div>
      <p><strong>Folio de solicitud:</strong> ${escaparHtml(destinatario.solicitudId)}</p>
      <p>Atentamente,<br>Equipo TIMBOX</p>
    `.trim(),
  };
}
