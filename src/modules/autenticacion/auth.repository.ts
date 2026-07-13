import { pool } from "../../config/database";
import { UsuarioAuth } from "./auth.types";

export async function buscarUsuarioPorIdentificador(identificador: string): Promise<UsuarioAuth | null> {
  const query = `
    SELECT id, usuario, nombre, correo, contrasena
    FROM sys.usuarios
    WHERE LOWER(usuario) = LOWER($1)
       OR LOWER(correo) = LOWER($1)
    LIMIT 1
  `;

  const result = await pool.query<UsuarioAuth>(query, [identificador]);

  return result.rows[0] ?? null;
}
