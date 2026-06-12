import { pool } from "../../config/database";
import { UsuarioAuth } from "./auth.types";

export async function buscarUsuarioPorUsuario(
  usuario: string
): Promise<UsuarioAuth | null> {
  const query = `
    SELECT id, usuario, nombre, correo, contrasena
    FROM sys.usuarios
    WHERE usuario = $1
    LIMIT 1
  `;

  const result = await pool.query<UsuarioAuth>(query, [usuario]);

  return result.rows[0] ?? null;
}