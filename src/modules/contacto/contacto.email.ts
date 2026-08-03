import { MensajeCorreo } from "../../shared/correo/correo.types";
import { EnvioSolicitudContactoPendiente } from "./contacto.types";

function escaparHtml(valor: string): string {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function valorVisible(valor: string | null): string {
  return valor?.trim() || "No proporcionado";
}

export function crearCorreoSolicitudContacto(
  envio: EnvioSolicitudContactoPendiente
): MensajeCorreo {
  const telefono = valorVisible(envio.telefono);
  const rfc = valorVisible(envio.rfc);
  const mensaje = valorVisible(envio.mensaje);
  const nombreAsunto = envio.nombre.replace(/[\r\n]+/g, " ").trim();
  const fecha = envio.fecha_registro.toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
  });

  return {
    destinatario: envio.correo_destinatario,
    responderA: envio.correo,
    asunto: `Nueva solicitud de contacto - ${nombreAsunto}`,
    texto: [
      "Se recibió una nueva solicitud de contacto.",
      "",
      `Folio: ${envio.solicitud_contacto_id}`,
      `Fecha: ${fecha}`,
      `Nombre: ${envio.nombre}`,
      `Correo: ${envio.correo}`,
      `Teléfono: ${telefono}`,
      `RFC: ${rfc}`,
      "",
      "Mensaje:",
      mensaje,
    ].join("\n"),
    html: `
      <h2>Nueva solicitud de contacto</h2>
      <p><strong>Folio:</strong> ${escaparHtml(envio.solicitud_contacto_id)}</p>
      <p><strong>Fecha:</strong> ${escaparHtml(fecha)}</p>
      <p><strong>Nombre:</strong> ${escaparHtml(envio.nombre)}</p>
      <p><strong>Correo:</strong> ${escaparHtml(envio.correo)}</p>
      <p><strong>Teléfono:</strong> ${escaparHtml(telefono)}</p>
      <p><strong>RFC:</strong> ${escaparHtml(rfc)}</p>
      <p><strong>Mensaje:</strong></p>
      <p style="white-space: pre-wrap;">${escaparHtml(mensaje)}</p>
    `.trim(),
  };
}
