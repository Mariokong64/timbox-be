import {
  actualizarEnlace,
  crearEnlace,
  eliminarEnlace,
  obtenerEnlacePorId,
  obtenerEnlaces,
  obtenerSeccionURLPorId,
  obtenerSeccionesURL,
} from "./gestionURL.repository";
import {
  DatosEnlace,
  EnlaceAdministrable,
  EnlaceRequest,
  SeccionURL,
} from "./gestionURL.types";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const claveRegex = /^[a-z0-9][a-z0-9._-]*$/;

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

async function validarDatos(datos: EnlaceRequest): Promise<DatosEnlace> {
  const clave = texto(datos.clave).toLowerCase();
  const url = validarURL(datos.url);
  const seccionId = validarUuid(datos.seccionId, "La sección");

  if (!clave || clave.length > 100 || !claveRegex.test(clave)) {
    throw new ErrorGestionURL(
      "La clave debe tener máximo 100 caracteres y usar únicamente letras minúsculas, números, punto, guion o guion bajo."
    );
  }

  if (typeof datos.activo !== "boolean") {
    throw new ErrorGestionURL("Indica si el enlace está activo.");
  }

  if (!(await obtenerSeccionURLPorId(seccionId))) {
    throw new ErrorGestionURL("La sección debe ser General o Integradores.");
  }

  return { clave, url, seccionId, activo: datos.activo };
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

export async function crearEnlaceService(datos: EnlaceRequest): Promise<EnlaceAdministrable> {
  return crearEnlace(await validarDatos(datos));
}

export async function actualizarEnlaceService(
  idValor: unknown,
  datos: EnlaceRequest
): Promise<EnlaceAdministrable> {
  const id = validarUuid(idValor, "El enlace");
  const actualizado = await actualizarEnlace(id, await validarDatos(datos));

  if (!actualizado) {
    throw new ErrorGestionURL("No se encontró el enlace.", 404);
  }

  return actualizado;
}

export async function eliminarEnlaceService(idValor: unknown): Promise<void> {
  const id = validarUuid(idValor, "El enlace");

  if (!(await obtenerEnlacePorId(id))) {
    throw new ErrorGestionURL("No se encontró el enlace.", 404);
  }

  await eliminarEnlace(id);
}
