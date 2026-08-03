import { verificarCaptcha } from "../../shared/services/recaptcha.service";
import {
  crearSolicitudContacto,
  guardarRespuestaSolicitudContacto,
  listarSolicitudesContacto,
  obtenerSolicitudContactoPorId,
} from "./contacto.repository";
import {
  ContactoDatosLimpios,
  ContactoRequest,
  FiltroEstadoSolicitud,
  GuardarRespuestaContactoRequest,
  RespuestaSolicitudContacto,
  SolicitudContactoCreada,
  SolicitudContactoDetalle,
  SolicitudContactoResumen,
} from "./contacto.types";
import { procesarNotificacionesSolicitudContacto } from "./contacto.notificaciones.service";

const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const telefonoRegex = /^[0-9\s()+-]{8,20}$/;
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const filtrosEstado: FiltroEstadoSolicitud[] = [
  "por_atender",
  "en_atencion",
  "cerrada",
  "todas",
];
const rfcRegex = /^([A-ZÑ&]{3,4})(\d{6})([A-Z0-9]{3})?$/i;

function limpiarTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function validarContacto(datos: ContactoRequest): ContactoDatosLimpios {
  const nombre = limpiarTexto(datos.nombre);
  const correo = limpiarTexto(datos.correo).toLowerCase();
  const telefono = limpiarTexto(datos.telefono);
  const rfc = limpiarTexto(datos.rfc).toUpperCase();
  const mensaje = limpiarTexto(datos.mensaje);

  if (!nombre) {
    throw new Error("Ingresa tu nombre.");
  }

  if (nombre.length > 150) {
    throw new Error("El nombre no debe superar 150 caracteres.");
  }

  if (!correo || !correoRegex.test(correo)) {
    throw new Error("Ingresa un correo valido.");
  }

  if (correo.length > 150) {
    throw new Error("El correo no debe superar 150 caracteres.");
  }

  if (telefono && !telefonoRegex.test(telefono)) {
    throw new Error("Ingresa un telefono valido.");
  }

  if (rfc && !rfcRegex.test(rfc)) {
    throw new Error("Ingresa un RFC valido.");
  }

  if (!mensaje) {
    throw new Error("Escribe un mensaje.");
  }

  if (mensaje.length > 2000) {
    throw new Error("El mensaje no debe superar 2000 caracteres.");
  }

  return {
    nombre,
    correo,
    telefono: telefono || null,
    rfc: rfc || null,
    mensaje,
  };
}

export async function registrarContactoService(
  datos: ContactoRequest
): Promise<SolicitudContactoCreada> {
  const datosLimpios = validarContacto(datos);

  await verificarCaptcha(datos.captchaToken);

  const solicitud = await crearSolicitudContacto(datosLimpios);

  void procesarNotificacionesSolicitudContacto(solicitud.id).catch((error) => {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error(
      `No fue posible iniciar el envío de la solicitud ${solicitud.id}:`,
      mensaje
    );
  });

  return solicitud;
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

export async function listarSolicitudesContactoService(
  estado: unknown
): Promise<SolicitudContactoResumen[]> {
  return listarSolicitudesContacto(normalizarFiltroEstado(estado));
}

export async function obtenerSolicitudContactoService(
  id: string
): Promise<SolicitudContactoDetalle> {
  if (!uuidRegex.test(id)) {
    throw new Error("La solicitud no es válida.");
  }

  const solicitud = await obtenerSolicitudContactoPorId(id);

  if (!solicitud) {
    throw new Error("La solicitud de contacto no existe.");
  }

  return solicitud;
}

export async function guardarRespuestaContactoService(
  solicitudId: string,
  usuarioId: string,
  datos: GuardarRespuestaContactoRequest
): Promise<RespuestaSolicitudContacto> {
  if (!uuidRegex.test(solicitudId)) {
    throw new Error("La solicitud no es válida.");
  }

  if (!uuidRegex.test(usuarioId)) {
    throw new Error("La sesión del usuario no es válida.");
  }

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

  return resultado.respuesta;
}
