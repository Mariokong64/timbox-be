import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { env } from "../../config/env";
import { validarSeguridadContrasena } from "../../shared/validaciones/contrasena";
import {
  actualizarContrasenaPerfil,
  actualizarNombreFotoPerfil,
  obtenerCredencialesPerfil,
  obtenerPerfilUsuarioPorId,
} from "./perfil.repositorio";
import {
  ArchivoFotoPerfil,
  FotoPerfilLeida,
  PerfilUsuario,
  PeticionCambiarContrasena,
} from "./perfil.tipos";

const RONDAS_BCRYPT = 10;
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface FormatoFoto {
  extension: "jpg" | "png" | "webp";
  tipoContenido: "image/jpeg" | "image/png" | "image/webp";
}

export class ErrorPerfil extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
  }
}

function validarUsuarioId(usuarioId: string): void {
  if (!uuidRegex.test(usuarioId)) {
    throw new ErrorPerfil("La sesión del usuario no es válida.", 401);
  }
}

function limpiarTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function obtenerRutaFotos(): string {
  return path.isAbsolute(env.perfil.rutaFotos)
    ? env.perfil.rutaFotos
    : path.resolve(process.cwd(), env.perfil.rutaFotos);
}

function detectarFormatoFoto(contenido: Buffer): FormatoFoto | null {
  if (
    contenido.length >= 8 &&
    contenido.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  ) {
    return { extension: "png", tipoContenido: "image/png" };
  }

  if (
    contenido.length >= 3 &&
    contenido[0] === 0xff &&
    contenido[1] === 0xd8 &&
    contenido[2] === 0xff
  ) {
    return { extension: "jpg", tipoContenido: "image/jpeg" };
  }

  if (
    contenido.length >= 12 &&
    contenido.subarray(0, 4).toString("ascii") === "RIFF" &&
    contenido.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { extension: "webp", tipoContenido: "image/webp" };
  }

  return null;
}

function tipoContenidoPorNombre(nombreArchivo: string): string {
  const extension = path.extname(nombreArchivo).toLowerCase();

  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
}

async function eliminarArchivoSiExiste(nombreArchivo: string | null): Promise<void> {
  if (!nombreArchivo) {
    return;
  }

  const nombreSeguro = path.basename(nombreArchivo);

  if (nombreSeguro !== nombreArchivo) {
    return;
  }

  await rm(path.join(obtenerRutaFotos(), nombreSeguro), { force: true });
}

export async function eliminarArchivoFotoPerfil(
  nombreArchivo: string | null
): Promise<void> {
  await eliminarArchivoSiExiste(nombreArchivo);
}

export async function obtenerPerfil(usuarioId: string): Promise<PerfilUsuario> {
  validarUsuarioId(usuarioId);
  const perfil = await obtenerPerfilUsuarioPorId(usuarioId);

  if (!perfil) {
    throw new ErrorPerfil("No se encontró el usuario.", 404);
  }

  return perfil;
}

export async function cambiarContrasena(
  usuarioId: string,
  datos: PeticionCambiarContrasena
): Promise<void> {
  validarUsuarioId(usuarioId);
  const contrasenaActual = limpiarTexto(datos.contrasenaActual);
  const contrasenaNueva = limpiarTexto(datos.contrasenaNueva);
  const confirmacionContrasena = limpiarTexto(datos.confirmacionContrasena);

  if (!contrasenaActual || !contrasenaNueva || !confirmacionContrasena) {
    throw new ErrorPerfil("Completa todos los campos de contraseña.");
  }

  const errorSeguridad = validarSeguridadContrasena(
    contrasenaNueva,
    "La nueva contraseña"
  );

  if (errorSeguridad) {
    throw new ErrorPerfil(errorSeguridad);
  }

  if (contrasenaNueva !== confirmacionContrasena) {
    throw new ErrorPerfil("La confirmación de la nueva contraseña no coincide.");
  }

  const credenciales = await obtenerCredencialesPerfil(usuarioId);

  if (!credenciales) {
    throw new ErrorPerfil("No se encontró el usuario.", 404);
  }

  if (!(await bcrypt.compare(contrasenaActual, credenciales.contrasena))) {
    throw new ErrorPerfil("La contraseña actual es incorrecta.");
  }

  if (await bcrypt.compare(contrasenaNueva, credenciales.contrasena)) {
    throw new ErrorPerfil("La nueva contraseña debe ser diferente de la actual.");
  }

  const contrasenaHash = await bcrypt.hash(contrasenaNueva, RONDAS_BCRYPT);

  if (!(await actualizarContrasenaPerfil(usuarioId, contrasenaHash))) {
    throw new ErrorPerfil("No fue posible actualizar la contraseña.", 500);
  }
}

export async function guardarFotoPerfil(
  usuarioId: string,
  archivo: ArchivoFotoPerfil | undefined
): Promise<PerfilUsuario> {
  validarUsuarioId(usuarioId);

  if (!archivo?.buffer?.length) {
    throw new ErrorPerfil("Selecciona una fotografía.");
  }

  if (archivo.size > env.perfil.tamanoMaximoFotoBytes) {
    throw new ErrorPerfil(
      `La fotografía no debe superar ${env.perfil.tamanoMaximoFotoMb} MB.`
    );
  }

  const formato = detectarFormatoFoto(archivo.buffer);

  if (!formato) {
    throw new ErrorPerfil("La fotografía debe ser un archivo JPG, PNG o WebP.");
  }

  const perfilActual = await obtenerPerfil(usuarioId);
  const rutaFotos = obtenerRutaFotos();
  const nombreArchivo = `${usuarioId}.${formato.extension}`;
  const rutaFinal = path.join(rutaFotos, nombreArchivo);
  const rutaTemporal = path.join(rutaFotos, `${usuarioId}-${randomUUID()}.tmp`);
  let archivoColocado = false;

  await mkdir(rutaFotos, { recursive: true });
  await writeFile(rutaTemporal, archivo.buffer, { flag: "wx" });

  try {
    await rm(rutaFinal, { force: true });
    await rename(rutaTemporal, rutaFinal);
    archivoColocado = true;

    const perfilActualizado = await actualizarNombreFotoPerfil(
      usuarioId,
      nombreArchivo
    );

    if (!perfilActualizado) {
      await rm(rutaFinal, { force: true });
      throw new ErrorPerfil("No fue posible actualizar la fotografía.", 500);
    }

    if (perfilActual.fotoPerfil !== nombreArchivo) {
      try {
        await eliminarArchivoSiExiste(perfilActual.fotoPerfil);
      } catch (error) {
        console.error("La fotografía se actualizó, pero no se pudo borrar el archivo anterior.", error);
      }
    }

    return perfilActualizado;
  } catch (error) {
    await rm(rutaTemporal, { force: true });
    if (archivoColocado && perfilActual.fotoPerfil !== nombreArchivo) {
      await rm(rutaFinal, { force: true });
    }
    throw error;
  }
}

export async function leerFotoPerfil(usuarioId: string): Promise<FotoPerfilLeida> {
  const perfil = await obtenerPerfil(usuarioId);

  if (!perfil.fotoPerfil) {
    throw new ErrorPerfil("El usuario no tiene fotografía de perfil.", 404);
  }

  const nombreSeguro = path.basename(perfil.fotoPerfil);

  if (nombreSeguro !== perfil.fotoPerfil) {
    throw new ErrorPerfil("La fotografía de perfil no es válida.", 500);
  }

  try {
    return {
      contenido: await readFile(path.join(obtenerRutaFotos(), nombreSeguro)),
      tipoContenido: tipoContenidoPorNombre(nombreSeguro),
    };
  } catch (error) {
    const codigo =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";

    if (codigo === "ENOENT") {
      throw new ErrorPerfil("No se encontró la fotografía de perfil.", 404);
    }

    throw error;
  }
}

export async function eliminarFotoPerfil(usuarioId: string): Promise<PerfilUsuario> {
  const perfilActual = await obtenerPerfil(usuarioId);

  if (!perfilActual.fotoPerfil) {
    return perfilActual;
  }

  const perfilActualizado = await actualizarNombreFotoPerfil(usuarioId, null);

  if (!perfilActualizado) {
    throw new ErrorPerfil("No fue posible eliminar la fotografía.", 500);
  }

  try {
    await eliminarArchivoSiExiste(perfilActual.fotoPerfil);
  } catch (error) {
    console.error("La fotografía se quitó del perfil, pero no se pudo borrar el archivo.", error);
  }
  return perfilActualizado;
}
