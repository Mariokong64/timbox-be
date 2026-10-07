import { pool } from "../../config/database";
import { UsuarioAuth } from "./auth.types";

export async function buscarUsuarioPorIdentificador(identificador: string): Promise<UsuarioAuth | null> {
  const query = `
    SELECT id, usuario, nombre, correo, contrasena, foto_perfil
    FROM sys.usuarios
    WHERE eliminado = false
      AND (LOWER(usuario) = LOWER($1)
        OR LOWER(correo) = LOWER($1))
    LIMIT 1
  `;

  const result = await pool.query<UsuarioAuth>(query, [identificador]);

  return result.rows[0] ?? null;
}

export async function consultarCierreSesion(usuarioId: string): Promise<boolean | null> {
  const result = await pool.query<{ forzar_cierre_sesion: boolean }>(`
    SELECT forzar_cierre_sesion
    FROM sys.usuarios
    WHERE id = $1 AND eliminado = false
  `, [usuarioId]);

  return result.rows[0]?.forzar_cierre_sesion ?? null;
}

export async function restablecerCierreSesion(usuarioId: string): Promise<void> {
  await pool.query(
    "UPDATE sys.usuarios SET forzar_cierre_sesion = false WHERE id = $1 AND eliminado = false",
    [usuarioId]
  );
}
