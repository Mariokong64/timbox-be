import { pool } from "../../config/database";
import {
  CredencialesPerfilUsuario,
  FilaPerfilUsuario,
  PerfilUsuario,
} from "./perfil.tipos";

function mapearPerfil(fila: FilaPerfilUsuario): PerfilUsuario {
  return {
    id: fila.id,
    usuario: fila.usuario,
    nombre: fila.nombre,
    correo: fila.correo,
    fotoPerfil: fila.foto_perfil,
  };
}

export async function obtenerPerfilUsuarioPorId(
  usuarioId: string
): Promise<PerfilUsuario | null> {
  const resultado = await pool.query<FilaPerfilUsuario>(
    `SELECT id, usuario, nombre, correo, foto_perfil
     FROM sys.usuarios
     WHERE id = $1
     LIMIT 1`,
    [usuarioId]
  );
  const perfil = resultado.rows[0];

  return perfil ? mapearPerfil(perfil) : null;
}

export async function obtenerCredencialesPerfil(
  usuarioId: string
): Promise<CredencialesPerfilUsuario | null> {
  const resultado = await pool.query<CredencialesPerfilUsuario>(
    `SELECT contrasena
     FROM sys.usuarios
     WHERE id = $1
     LIMIT 1`,
    [usuarioId]
  );

  return resultado.rows[0] ?? null;
}

export async function actualizarContrasenaPerfil(
  usuarioId: string,
  contrasenaHash: string
): Promise<boolean> {
  const resultado = await pool.query(
    `UPDATE sys.usuarios
     SET contrasena = $2,
         modificado = CURRENT_TIMESTAMP,
         modificado_por_id = $1
     WHERE id = $1`,
    [usuarioId, contrasenaHash]
  );

  return (resultado.rowCount ?? 0) > 0;
}

export async function actualizarNombreFotoPerfil(
  usuarioId: string,
  nombreArchivo: string | null
): Promise<PerfilUsuario | null> {
  const resultado = await pool.query<FilaPerfilUsuario>(
    `UPDATE sys.usuarios
     SET foto_perfil = $2,
         modificado = CURRENT_TIMESTAMP,
         modificado_por_id = $1
     WHERE id = $1
     RETURNING id, usuario, nombre, correo, foto_perfil`,
    [usuarioId, nombreArchivo]
  );
  const perfil = resultado.rows[0];

  return perfil ? mapearPerfil(perfil) : null;
}
