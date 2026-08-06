import { pool } from "../../config/database";
import {
  DatosEdicionEnlace,
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

export async function actualizarEnlace(
  id: string,
  datos: DatosEdicionEnlace
): Promise<EnlaceAdministrable | null> {
  const resultado = await pool.query<EnlaceRow>(
    `WITH actualizado AS (
       UPDATE contenidos.enlaces_url
       SET url = $2,
           activo = $3,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *
     )
     SELECT a.id, a.clave, a.url, a.activo, a.fecha_actualizacion,
            s.id AS seccion_id, s.seccion, s.descripcion AS seccion_descripcion
     FROM actualizado a
     INNER JOIN contenidos.secciones s ON s.id = a.seccion_id`,
    [id, datos.url, datos.activo]
  );
  const row = resultado.rows[0];

  return row ? mapearEnlace(row) : null;
}
