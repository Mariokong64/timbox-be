import { env } from "../../../config/env";
import { enviarCorreo } from "../../../shared/correo/correo.service";
import { crearCorreoRespuestaSolicitud } from "./respuesta-correo.plantilla";
import {
  cerrarSolicitudContacto,
  guardarRespuestaSolicitudContacto,
  listarSolicitudesContacto,
  obtenerSolicitudContactoPorId,
} from "./solicitudes.repositorio";
import {
  FiltroEstadoSolicitud,
  PeticionGuardarRespuesta,
  ResultadoGuardarRespuesta,
  SolicitudContactoDetalle,
  SolicitudContactoResumen,
} from "./solicitudes.tipos";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const filtrosEstado: FiltroEstadoSolicitud[] = [
  "por_atender",
  "en_atencion",
  "cerrada",
  "todas",
];

function limpiarTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function validarUuid(id: string, mensaje: string): void {
  if (!uuidRegex.test(id)) {
    throw new Error(mensaje);
  }
}

function normalizarFiltroEstado(valor: unknown): FiltroEstadoSolicitud {
  const estado =
    typeof valor === "string" && valor.trim()
      ? valor.trim().toLowerCase()
      : "todas";

  if (!filtrosEstado.includes(estado as FiltroEstadoSolicitud)) {
    throw new Error("El filtro de estado no es válido.");
  }

  return estado as FiltroEstadoSolicitud;
}

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function listarSolicitudes(
  estado: unknown
): Promise<SolicitudContactoResumen[]> {
  return listarSolicitudesContacto(normalizarFiltroEstado(estado));
}

export async function obtenerSolicitud(
  id: string
): Promise<SolicitudContactoDetalle> {
  validarUuid(id, "La solicitud no es válida.");

  const solicitud = await obtenerSolicitudContactoPorId(id);

  if (!solicitud) {
    throw new Error("La solicitud de contacto no existe.");
  }

  return solicitud;
}

export async function guardarRespuesta(
  solicitudId: string,
  usuarioId: string,
  datos: PeticionGuardarRespuesta
): Promise<ResultadoGuardarRespuesta> {
  validarUuid(solicitudId, "La solicitud no es válida.");
  validarUuid(usuarioId, "La sesión del usuario no es válida.");

  const respuesta = limpiarTexto(datos.respuesta);

  if (!respuesta) {
    throw new Error("Escribe una respuesta.");
  }

  if (respuesta.length > 5000) {
    throw new Error("La respuesta no debe superar 5000 caracteres.");
  }

  const resultado = await guardarRespuestaSolicitudContacto(
    solicitudId,
    usuarioId,
    respuesta
  );

  if (resultado.resultado !== "guardada") {
    throw new Error(
      resultado.resultado === "no_existe"
        ? "La solicitud de contacto no existe."
        : "No puedes responder una solicitud cerrada."
    );
  }

  let correoEnviado = false;

  try {
    if (!env.correo.remitenteRespuestas) {
      throw new Error("Falta configurar CORREO_RESPUESTAS_REMITENTE.");
    }

    await enviarCorreo(
      crearCorreoRespuestaSolicitud(
        resultado.destinatario,
        respuesta,
        env.correo.remitenteRespuestas
      )
    );
    correoEnviado = true;
  } catch (error) {
    console.error(
      `La respuesta ${resultado.respuesta.id} fue guardada, pero su correo no pudo enviarse:`,
      mensajeError(error)
    );
  }

  return {
    respuesta: resultado.respuesta,
    correoEnviado,
  };
}

export async function cerrarSolicitud(solicitudId: string): Promise<void> {
  validarUuid(solicitudId, "La solicitud no es válida.");

  const resultado = await cerrarSolicitudContacto(solicitudId);

  if (resultado !== "cerrada") {
    throw new Error(
      resultado === "no_existe"
        ? "La solicitud de contacto no existe."
        : "La solicitud de contacto ya está cerrada."
    );
  }
}
