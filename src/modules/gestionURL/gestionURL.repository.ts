import { pool } from "../../config/database";
import {
  DatosEnlace,
  EnlaceAdministrable,
  EnlaceRow,
  SeccionURL,
} from "./gestionURL.types";

function mapearEnlace(row: EnlaceRow): EnlaceAdministrable {
  return {
    id: row.id,
    clave: row.clave,
    url: row.url,
    activo: row.activo,
    fechaActualizacion: row.fecha_actualizacion,
    seccion: {
      id: row.seccion_id,
      nombre: row.seccion,
      descripcion: row.seccion_descripcion,
    },
  };
}

const seleccionEnlace = `
  SELECT e.id, e.clave, e.url, e.activo, e.fecha_actualizacion,
         s.id AS seccion_id, s.seccion, s.descripcion AS seccion_descripcion
  FROM contenidos.enlaces_url e
  INNER JOIN contenidos.secciones s ON s.id = e.seccion_id
`;

export async function obtenerSeccionesURL(): Promise<SeccionURL[]> {
  const resultado = await pool.query<{
    id: string;
    seccion: string;
    descripcion: string | null;
  }>(`
    SELECT id, seccion, descripcion
    FROM contenidos.secciones
    WHERE LOWER(seccion) IN ('general', 'integradores')
    ORDER BY CASE LOWER(seccion) WHEN 'general' THEN 1 ELSE 2 END
  `);

  return resultado.rows.map((row) => ({
    id: row.id,
    nombre: row.seccion,
    descripcion: row.descripcion,
  }));
}

export async function obtenerSeccionURLPorId(id: string): Promise<SeccionURL | null> {
  const resultado = await pool.query<{
    id: string;
    seccion: string;
    descripcion: string | null;
  }>(
    `SELECT id, seccion, descripcion
     FROM contenidos.secciones
     WHERE id = $1 AND LOWER(seccion) IN ('general', 'integradores')
     LIMIT 1`,
    [id]
  );
  const row = resultado.rows[0];

  return row ? { id: row.id, nombre: row.seccion, descripcion: row.descripcion } : null;
}

export async function obtenerEnlaces(
  seccionId: string | null,
  busqueda: string
): Promise<EnlaceAdministrable[]> {
  const resultado = await pool.query<EnlaceRow>(
    `${seleccionEnlace}
     WHERE LOWER(s.seccion) IN ('general', 'integradores')
       AND ($1::uuid IS NULL OR e.seccion_id = $1::uuid)
       AND ($2::text = '' OR e.clave ILIKE '%' || $2 || '%' OR e.url ILIKE '%' || $2 || '%')
     ORDER BY s.seccion ASC, e.clave ASC`,
    [seccionId, busqueda]
  );

  return resultado.rows.map(mapearEnlace);
}

export async function obtenerEnlacePorId(id: string): Promise<EnlaceAdministrable | null> {
  const resultado = await pool.query<EnlaceRow>(
    `${seleccionEnlace}
     WHERE e.id = $1 AND LOWER(s.seccion) IN ('general', 'integradores')
     LIMIT 1`,
    [id]
  );
  const row = resultado.rows[0];

  return row ? mapearEnlace(row) : null;
}

export async function crearEnlace(datos: DatosEnlace): Promise<EnlaceAdministrable> {
  const resultado = await pool.query<EnlaceRow>(
    `WITH nuevo AS (
       INSERT INTO contenidos.enlaces_url (clave, url, seccion_id, activo)
       VALUES ($1, $2, $3, $4)
       RETURNING *
     )
     SELECT n.id, n.clave, n.url, n.activo, n.fecha_actualizacion,
            s.id AS seccion_id, s.seccion, s.descripcion AS seccion_descripcion
     FROM nuevo n
     INNER JOIN contenidos.secciones s ON s.id = n.seccion_id`,
    [datos.clave, datos.url, datos.seccionId, datos.activo]
  );

  return mapearEnlace(resultado.rows[0]);
}

export async function actualizarEnlace(
  id: string,
  datos: DatosEnlace
): Promise<EnlaceAdministrable | null> {
  const resultado = await pool.query<EnlaceRow>(
    `WITH actualizado AS (
       UPDATE contenidos.enlaces_url
       SET clave = $2,
           url = $3,
           seccion_id = $4,
           activo = $5,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *
     )
     SELECT a.id, a.clave, a.url, a.activo, a.fecha_actualizacion,
            s.id AS seccion_id, s.seccion, s.descripcion AS seccion_descripcion
     FROM actualizado a
     INNER JOIN contenidos.secciones s ON s.id = a.seccion_id`,
    [id, datos.clave, datos.url, datos.seccionId, datos.activo]
  );
  const row = resultado.rows[0];

  return row ? mapearEnlace(row) : null;
}

export async function eliminarEnlace(id: string): Promise<boolean> {
  const resultado = await pool.query("DELETE FROM contenidos.enlaces_url WHERE id = $1", [id]);

  return (resultado.rowCount ?? 0) > 0;
}
