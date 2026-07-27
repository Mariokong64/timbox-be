import {
  actualizarContenido,
  crearContenido,
  eliminarContenido,
  obtenerContenidoPorId,
  obtenerContenidos,
  obtenerSeccionContenidoPorId,
  obtenerSeccionesContenido,
} from "./gestionContenido.repository";
import {
  ContenidoAdministrable,
  ContenidoRequest,
  DatosContenido,
  SeccionContenido,
} from "./gestionContenido.types";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const claveRegex = /^[a-z0-9][a-z0-9._-]*$/;

export class ErrorGestionContenido extends Error {
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
    throw new ErrorGestionContenido(`${nombre} no es válido.`);
  }

  return id;
}

async function validarDatos(datos: ContenidoRequest): Promise<DatosContenido> {
  const clave = texto(datos.clave).toLowerCase();
  const contenido = texto(datos.contenido);
  const seccionId = validarUuid(datos.seccionId, "La sección");

  if (!clave || clave.length > 100 || !claveRegex.test(clave)) {
    throw new ErrorGestionContenido(
      "La clave debe tener máximo 100 caracteres y usar únicamente letras minúsculas, números, punto, guion o guion bajo."
    );
  }

  if (!contenido) {
    throw new ErrorGestionContenido("Ingresa el contenido.");
  }

  if (contenido.length > 30000) {
    throw new ErrorGestionContenido("El contenido no debe superar 30000 caracteres.");
  }

  if (typeof datos.activo !== "boolean") {
    throw new ErrorGestionContenido("Indica si el contenido está activo.");
  }

  if (!(await obtenerSeccionContenidoPorId(seccionId))) {
    throw new ErrorGestionContenido("La sección debe ser Empresa o Soluciones.");
  }

  return { clave, contenido, seccionId, activo: datos.activo };
}

export async function listarSeccionesContenidoService(): Promise<SeccionContenido[]> {
  return obtenerSeccionesContenido();
}

export async function listarContenidosService(
  seccionIdValor: unknown,
  busquedaValor: unknown
): Promise<ContenidoAdministrable[]> {
  const seccionId = texto(seccionIdValor);

  if (seccionId && !uuidRegex.test(seccionId)) {
    throw new ErrorGestionContenido("La sección no es válida.");
  }

  return obtenerContenidos(seccionId || null, texto(busquedaValor).slice(0, 200));
}

export async function crearContenidoService(datos: ContenidoRequest): Promise<ContenidoAdministrable> {
  return crearContenido(await validarDatos(datos));
}

export async function actualizarContenidoService(
  idValor: unknown,
  datos: ContenidoRequest
): Promise<ContenidoAdministrable> {
  const id = validarUuid(idValor, "El contenido");
  const actualizado = await actualizarContenido(id, await validarDatos(datos));

  if (!actualizado) {
    throw new ErrorGestionContenido("No se encontró el contenido.", 404);
  }

  return actualizado;
}

export async function eliminarContenidoService(idValor: unknown): Promise<void> {
  const id = validarUuid(idValor, "El contenido");

  if (!(await obtenerContenidoPorId(id))) {
    throw new ErrorGestionContenido("No se encontró el contenido.", 404);
  }

  await eliminarContenido(id);
}
