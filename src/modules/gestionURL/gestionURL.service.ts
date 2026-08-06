import {
  actualizarEnlace,
  obtenerEnlaces,
  obtenerSeccionesURL,
} from "./gestionURL.repository";
import {
  DatosEdicionEnlace,
  EdicionEnlaceRequest,
  EnlaceAdministrable,
  SeccionURL,
} from "./gestionURL.types";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ErrorGestionURL extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
  }
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function validarUuid(valor: unknown, nombre: string): string {
  const id = texto(valor);

  if (!uuidRegex.test(id)) {
    throw new ErrorGestionURL(`${nombre} no es válido.`);
  }

  return id;
}

function validarURL(valor: unknown): string {
  const url = texto(valor);

  if (!url || url.length > 2000) {
    throw new ErrorGestionURL("Ingresa una URL de máximo 2000 caracteres.");
  }

  try {
    const resultado = new URL(url);

    if (!["http:", "https:"].includes(resultado.protocol)) {
      throw new Error();
    }
  } catch {
    throw new ErrorGestionURL("La URL debe ser válida y comenzar con http:// o https://.");
  }

  return url;
}

function validarEdicion(datos: EdicionEnlaceRequest): DatosEdicionEnlace {
  const url = validarURL(datos.url);

  if (typeof datos.activo !== "boolean") {
    throw new ErrorGestionURL("Indica si el enlace está activo.");
  }

  return { url, activo: datos.activo };
}

export async function listarSeccionesURLService(): Promise<SeccionURL[]> {
  return obtenerSeccionesURL();
}

export async function listarEnlacesService(
  seccionIdValor: unknown,
  busquedaValor: unknown
): Promise<EnlaceAdministrable[]> {
  const seccionId = texto(seccionIdValor);

  if (seccionId && !uuidRegex.test(seccionId)) {
    throw new ErrorGestionURL("La sección no es válida.");
  }

  return obtenerEnlaces(seccionId || null, texto(busquedaValor).slice(0, 200));
}

export async function actualizarEnlaceService(
  idValor: unknown,
  datos: EdicionEnlaceRequest
): Promise<EnlaceAdministrable> {
  const id = validarUuid(idValor, "El enlace");
  const actualizado = await actualizarEnlace(id, validarEdicion(datos));

  if (!actualizado) {
    throw new ErrorGestionURL("No se encontró el enlace.", 404);
  }

  return actualizado;
}
