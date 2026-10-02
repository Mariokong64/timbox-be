import bcrypt from "bcrypt";
import { eliminarArchivoFotoPerfil } from "../perfil/perfil.servicio";
import { validarSeguridadContrasena } from "../../shared/validaciones/contrasena";
import {
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
  existeUsuarioPorNombre,
  obtenerUsuarioPorId,
  obtenerUsuarios,
  obtenerPermisosUsuario,
} from "./usuarios.repository";
import { PermisoPantalla, Usuario, UsuarioRequest } from "./usuarios.types";

const RONDAS_BCRYPT = 10;
const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ErrorUsuarios extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
  }
}

function limpiarTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function normalizarCorreo(valor: unknown): string {
  return limpiarTexto(valor).toLowerCase();
}

function normalizarUsuario(valor: unknown): string {
  return limpiarTexto(valor).toUpperCase();
}

function validarDatosBase(datos: UsuarioRequest) {
  const usuario = normalizarUsuario(datos.usuario);
  const nombre = limpiarTexto(datos.nombre);
  const correo = normalizarCorreo(datos.correo);

  if (!usuario) {
    throw new ErrorUsuarios("Ingresa el usuario.");
  }

  if (usuario.length > 100) {
    throw new ErrorUsuarios("El usuario no debe superar 100 caracteres.");
  }

  if (!nombre) {
    throw new ErrorUsuarios("Ingresa el nombre.");
  }

  if (nombre.length > 150) {
    throw new ErrorUsuarios("El nombre no debe superar 150 caracteres.");
  }

  if (!correo || !correoRegex.test(correo)) {
    throw new ErrorUsuarios("Ingresa un correo válido.");
  }

  if (correo.length > 150) {
    throw new ErrorUsuarios("El correo no debe superar 150 caracteres.");
  }

  return {
    usuario,
    nombre,
    correo,
  };
}

function validarContrasena(valor: unknown, requerida: boolean): string {
  const contrasena = limpiarTexto(valor);

  if (!contrasena && requerida) {
    throw new ErrorUsuarios("Ingresa la contraseña.");
  }

  if (!contrasena) {
    return "";
  }

  const errorSeguridad = validarSeguridadContrasena(contrasena);

  if (errorSeguridad) {
    throw new ErrorUsuarios(errorSeguridad);
  }

  return contrasena;
}

export async function listarUsuariosService(): Promise<Usuario[]> {
  return obtenerUsuarios();
}

export async function obtenerPermisosUsuarioService(id: string): Promise<PermisoPantalla[]> {
  const usuario = await obtenerUsuarioPorId(id);
  if (!usuario) {
    throw new ErrorUsuarios("No se encontró el usuario.", 404);
  }
  return obtenerPermisosUsuario(id);
}

function validarPermisos(valor: unknown, pantallas: PermisoPantalla[]): PermisoPantalla[] {
  if (!Array.isArray(valor) || valor.length !== pantallas.length) {
    throw new ErrorUsuarios("Debes enviar los permisos de todas las pantallas.");
  }

  const enviados = new Map<string, Record<string, unknown>>();
  for (const permiso of valor) {
    if (typeof permiso !== "object" || permiso === null || typeof permiso.pantallaId !== "string") {
      throw new ErrorUsuarios("Los permisos enviados no son válidos.");
    }
    if (enviados.has(permiso.pantallaId)) {
      throw new ErrorUsuarios("Hay una pantalla repetida en los permisos.");
    }
    enviados.set(permiso.pantallaId, permiso);
  }

  return pantallas.map((pantalla) => {
    const permiso = enviados.get(pantalla.pantallaId);
    if (!permiso || ["leer", "crear", "editar", "eliminar"].some((campo) => typeof permiso[campo] !== "boolean")) {
      throw new ErrorUsuarios("Los permisos enviados no son válidos.");
    }
    if (!permiso.leer && (permiso.crear || permiso.editar || permiso.eliminar)) {
      throw new ErrorUsuarios("Para crear, editar o eliminar también debes permitir la lectura.");
    }
    return {
      ...pantalla,
      leer: permiso.leer as boolean,
      crear: permiso.crear as boolean,
      editar: permiso.editar as boolean,
      eliminar: permiso.eliminar as boolean,
    };
  });
}

export async function verificarDisponibilidadUsuarioService(usuarioValor: unknown, excluirId: string | null) {
  const usuario = normalizarUsuario(usuarioValor);

  if (!usuario) {
    return {
      usuario,
      disponible: false,
    };
  }

  const existe = await existeUsuarioPorNombre(usuario, excluirId || null);

  return {
    usuario,
    disponible: !existe,
  };
}

async function asegurarUsuarioDisponible(usuario: string, excluirId: string | null) {
  const existe = await existeUsuarioPorNombre(usuario, excluirId);

  if (existe) {
    throw new ErrorUsuarios("Ese usuario ya existe.", 409);
  }
}

export async function crearUsuarioService(datos: UsuarioRequest, creadoPorId: string | null): Promise<Usuario> {
  const datosBase = validarDatosBase(datos);
  const contrasena = validarContrasena(datos.contrasena, true);
  await asegurarUsuarioDisponible(datosBase.usuario, null);
  const contrasenaHash = await bcrypt.hash(contrasena, RONDAS_BCRYPT);

  return crearUsuario({
    ...datosBase,
    contrasenaHash,
    creadoPorId,
  });
}

export async function actualizarUsuarioService(
  id: string,
  datos: UsuarioRequest,
  modificadoPorId: string | null
): Promise<Usuario> {
  const datosBase = validarDatosBase(datos);
  const contrasena = validarContrasena(datos.contrasena, false);
  await asegurarUsuarioDisponible(datosBase.usuario, id);
  const contrasenaHash = contrasena ? await bcrypt.hash(contrasena, RONDAS_BCRYPT) : null;
  const pantallas = await obtenerPermisosUsuarioService(id);
  const permisos = datos.permisos === undefined ? pantallas : validarPermisos(datos.permisos, pantallas);
  const usuario = await actualizarUsuario({
    id,
    ...datosBase,
    contrasenaHash,
    modificadoPorId,
    permisos,
  });

  if (!usuario) {
    throw new ErrorUsuarios("No se encontró el usuario.", 404);
  }

  return usuario;
}

export async function eliminarUsuarioService(id: string, usuarioSesionId: string | null): Promise<void> {
  if (id === usuarioSesionId) {
    throw new ErrorUsuarios("No puedes eliminar tu propio usuario.", 400);
  }

  const usuario = await obtenerUsuarioPorId(id);

  if (!usuario) {
    throw new ErrorUsuarios("No se encontró el usuario.", 404);
  }

  const eliminado = await eliminarUsuario(id);

  if (!eliminado) {
    throw new ErrorUsuarios("No se pudo eliminar el usuario.", 400);
  }

  try {
    await eliminarArchivoFotoPerfil(usuario.fotoPerfil);
  } catch (error) {
    console.error("El usuario fue eliminado, pero no se pudo borrar su fotografía.", error);
  }
}
