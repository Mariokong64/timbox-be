import { pool } from "../../config/database";
import {
  ContenidoAdministrable,
  ContenidoRow,
  DatosContenido,
  SeccionContenido,
} from "./gestionContenido.types";

function mapearContenido(row: ContenidoRow): ContenidoAdministrable {
  return {
    id: row.id,
    clave: row.clave,
    contenido: row.contenido,
    activo: row.activo,
    fechaActualizacion: row.fecha_actualizacion,
    seccion: {
      id: row.seccion_id,
      nombre: row.seccion,
      descripcion: row.seccion_descripcion,
    },
  };
}

const seleccionContenido = `
  SELECT c.id, c.clave, c.contenido, c.activo, c.fecha_actualizacion,
         s.id AS seccion_id, s.seccion, s.descripcion AS seccion_descripcion
  FROM contenidos.contenidos c
  INNER JOIN contenidos.secciones s ON s.id = c.seccion_id
`;

export async function obtenerSeccionesContenido(): Promise<SeccionContenido[]> {
  const resultado = await pool.query<{
    id: string;
    seccion: string;
    descripcion: string | null;
  }>(`
    SELECT id, seccion, descripcion
    FROM contenidos.secciones
    WHERE LOWER(seccion) IN ('empresa', 'soluciones')
    ORDER BY CASE LOWER(seccion) WHEN 'empresa' THEN 1 ELSE 2 END
  `);

  return resultado.rows.map((row) => ({
    id: row.id,
    nombre: row.seccion,
    descripcion: row.descripcion,
  }));
}

export async function obtenerSeccionContenidoPorId(id: string): Promise<SeccionContenido | null> {
  const resultado = await pool.query<{
    id: string;
    seccion: string;
    descripcion: string | null;
  }>(
    `SELECT id, seccion, descripcion
     FROM contenidos.secciones
     WHERE id = $1 AND LOWER(seccion) IN ('empresa', 'soluciones')
     LIMIT 1`,
    [id]
  );
  const row = resultado.rows[0];

  return row ? { id: row.id, nombre: row.seccion, descripcion: row.descripcion } : null;
}

export async function obtenerContenidos(
  seccionId: string | null,
  busqueda: string
): Promise<ContenidoAdministrable[]> {
  const resultado = await pool.query<ContenidoRow>(
    `${seleccionContenido}
     WHERE LOWER(s.seccion) IN ('empresa', 'soluciones')
       AND ($1::uuid IS NULL OR c.seccion_id = $1::uuid)
       AND ($2::text = '' OR c.clave ILIKE '%' || $2 || '%' OR c.contenido ILIKE '%' || $2 || '%')
     ORDER BY s.seccion ASC, c.clave ASC`,
    [seccionId, busqueda]
  );

  return resultado.rows.map(mapearContenido);
}

export async function obtenerContenidoPorId(id: string): Promise<ContenidoAdministrable | null> {
  const resultado = await pool.query<ContenidoRow>(
    `${seleccionContenido}
     WHERE c.id = $1 AND LOWER(s.seccion) IN ('empresa', 'soluciones')
     LIMIT 1`,
    [id]
  );
  const row = resultado.rows[0];

  return row ? mapearContenido(row) : null;
}

export async function crearContenido(datos: DatosContenido): Promise<ContenidoAdministrable> {
  const resultado = await pool.query<ContenidoRow>(
    `WITH nuevo AS (
       INSERT INTO contenidos.contenidos (clave, contenido, seccion_id, activo)
       VALUES ($1, $2, $3, $4)
       RETURNING *
     )
     SELECT n.id, n.clave, n.contenido, n.activo, n.fecha_actualizacion,
            s.id AS seccion_id, s.seccion, s.descripcion AS seccion_descripcion
     FROM nuevo n
     INNER JOIN contenidos.secciones s ON s.id = n.seccion_id`,
    [datos.clave, datos.contenido, datos.seccionId, datos.activo]
  );

  return mapearContenido(resultado.rows[0]);
}

export async function actualizarContenido(
  id: string,
  datos: DatosContenido
): Promise<ContenidoAdministrable | null> {
  const resultado = await pool.query<ContenidoRow>(
    `WITH actualizado AS (
       UPDATE contenidos.contenidos
       SET clave = $2,
           contenido = $3,
           seccion_id = $4,
           activo = $5,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *
     )
     SELECT a.id, a.clave, a.contenido, a.activo, a.fecha_actualizacion,
            s.id AS seccion_id, s.seccion, s.descripcion AS seccion_descripcion
     FROM actualizado a
     INNER JOIN contenidos.secciones s ON s.id = a.seccion_id`,
    [id, datos.clave, datos.contenido, datos.seccionId, datos.activo]
  );
  const row = resultado.rows[0];

  return row ? mapearContenido(row) : null;
}

export async function eliminarContenido(id: string): Promise<boolean> {
  const resultado = await pool.query("DELETE FROM contenidos.contenidos WHERE id = $1", [id]);

  return (resultado.rowCount ?? 0) > 0;
}
