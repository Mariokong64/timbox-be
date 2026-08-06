import { pool } from "../../config/database";

export async function obtenerURLActivaPorClave(clave: string): Promise<string | null> {
  const resultado = await pool.query<{ url: string }>(
    `SELECT url
     FROM contenidos.enlaces_url
     WHERE clave = $1
       AND activo = TRUE
     LIMIT 1`,
    [clave]
  );

  return resultado.rows[0]?.url ?? null;
}
