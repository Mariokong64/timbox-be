import { pool } from "../../../config/database";
import {
  DestinatarioRespuestaSolicitud,
  FilaRespuestaSolicitudContacto,
  FilaSolicitudContacto,
  FiltroEstadoSolicitud,
  RespuestaSolicitudContacto,
  SolicitudContactoDetalle,
  SolicitudContactoResumen,
} from "./solicitudes.tipos";

const CAMPOS_SOLICITUD = `
  sc.id,
  sc.nombre,
  sc.correo,
  sc.telefono,
  sc.rfc,
  sc.mensaje,
  es.estatus,
  CASE
    WHEN LOWER(es.estatus) = 'nueva' THEN 'por_atender'
    WHEN LOWER(es.estatus) LIKE 'en atenci%' THEN 'en_atencion'
    ELSE 'cerrada'
  END AS estado_atencion,
  sc.fecha_registro
`;

function mapearSolicitud(
  fila: FilaSolicitudContacto
): SolicitudContactoResumen {
  return {
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo,
    telefono: fila.telefono,
    rfc: fila.rfc,
    mensaje: fila.mensaje,
    estatus: fila.estatus,
    estadoAtencion: fila.estado_atencion,
    fechaRegistro: fila.fecha_registro.toISOString(),
  };
}

function mapearRespuesta(
  fila: FilaRespuestaSolicitudContacto
): RespuestaSolicitudContacto {
  return {
    id: fila.id,
    detalles: fila.detalles,
    fechaAtencion: fila.fecha_atencion.toISOString(),
    usuarioId: fila.usuario_id,
    nombreUsuario: fila.nombre_usuario,
  };
}

export async function listarSolicitudesContacto(
  estado: FiltroEstadoSolicitud
): Promise<SolicitudContactoResumen[]> {
  const resultado = await pool.query<FilaSolicitudContacto>(
    `SELECT ${CAMPOS_SOLICITUD}
     FROM contacto.solicitudes_contacto sc
     INNER JOIN contacto.estatus_solicitudes es
       ON es.id = sc.estatus_id
     INNER JOIN contacto.origenes o
       ON o.id = sc.origen_id
     WHERE LOWER(o.origen) LIKE 'formulario%'
       AND (
         $1 = 'todas'
         OR CASE
           WHEN LOWER(es.estatus) = 'nueva' THEN 'por_atender'
           WHEN LOWER(es.estatus) LIKE 'en atenci%' THEN 'en_atencion'
           ELSE 'cerrada'
         END = $1
       )
     ORDER BY
       CASE
         WHEN LOWER(es.estatus) = 'nueva' THEN 0
         WHEN LOWER(es.estatus) LIKE 'en atenci%' THEN 1
         ELSE 2
       END,
       sc.fecha_registro DESC
     LIMIT 500`,
    [estado]
  );

  return resultado.rows.map(mapearSolicitud);
}

export async function obtenerSolicitudContactoPorId(
  id: string
): Promise<SolicitudContactoDetalle | null> {
  const resultado = await pool.query<FilaSolicitudContacto>(
    `SELECT ${CAMPOS_SOLICITUD}
     FROM contacto.solicitudes_contacto sc
     INNER JOIN contacto.estatus_solicitudes es
       ON es.id = sc.estatus_id
     INNER JOIN contacto.origenes o
       ON o.id = sc.origen_id
     WHERE sc.id = $1
       AND LOWER(o.origen) LIKE 'formulario%'
     LIMIT 1`,
    [id]
  );
  const solicitud = resultado.rows[0];

  if (!solicitud) {
    return null;
  }

  return {
    ...mapearSolicitud(solicitud),
    respuestas: await listarRespuestasSolicitud(id),
  };
}

export async function listarRespuestasSolicitud(
  solicitudId: string
): Promise<RespuestaSolicitudContacto[]> {
  const resultado = await pool.query<FilaRespuestaSolicitudContacto>(
    `SELECT
       a.id,
       a.detalles,
       a.fecha_atencion,
       a.usuario_id,
       u.nombre AS nombre_usuario
     FROM contacto.atenciones a
     INNER JOIN sys.usuarios u ON u.id = a.usuario_id
     WHERE a.solicitud_id = $1
     ORDER BY a.fecha_atencion ASC, a.id ASC`,
    [solicitudId]
  );

  return resultado.rows.map(mapearRespuesta);
}

export async function guardarRespuestaSolicitudContacto(
  solicitudId: string,
  usuarioId: string,
  respuesta: string
): Promise<
  | {
      resultado: "guardada";
      respuesta: RespuestaSolicitudContacto;
      destinatario: DestinatarioRespuestaSolicitud;
    }
  | { resultado: "no_existe" | "cerrada" }
> {
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    const consultaSolicitud = await cliente.query<{
      estatus: string;
      nombre: string;
      correo: string;
    }>(
      `SELECT es.estatus, sc.nombre, sc.correo
       FROM contacto.solicitudes_contacto sc
       INNER JOIN contacto.estatus_solicitudes es
         ON es.id = sc.estatus_id
       INNER JOIN contacto.origenes o
         ON o.id = sc.origen_id
       WHERE sc.id = $1
         AND LOWER(o.origen) LIKE 'formulario%'
       FOR UPDATE OF sc`,
      [solicitudId]
    );
    const solicitud = consultaSolicitud.rows[0];

    if (!solicitud) {
      await cliente.query("ROLLBACK");
      return { resultado: "no_existe" };
    }

    if (
      solicitud.estatus.toLowerCase() !== "nueva" &&
      !solicitud.estatus.toLowerCase().startsWith("en atenci")
    ) {
      await cliente.query("ROLLBACK");
      return { resultado: "cerrada" };
    }

    const guardada = await cliente.query<FilaRespuestaSolicitudContacto>(
      `WITH respuesta AS (
         INSERT INTO contacto.atenciones
           (usuario_id, solicitud_id, detalles)
         VALUES ($1, $2, $3)
         RETURNING id, detalles, fecha_atencion, usuario_id
       )
       SELECT
         r.id,
         r.detalles,
         r.fecha_atencion,
         r.usuario_id,
         u.nombre AS nombre_usuario
       FROM respuesta r
       INNER JOIN sys.usuarios u ON u.id = r.usuario_id`,
      [usuarioId, solicitudId, respuesta]
    );

    await cliente.query(
      `UPDATE contacto.solicitudes_contacto
       SET estatus_id = (
         SELECT id
         FROM contacto.estatus_solicitudes
         WHERE LOWER(estatus) LIKE 'en atenci%'
         LIMIT 1
       )
       WHERE id = $1`,
      [solicitudId]
    );

    await cliente.query("COMMIT");

    return {
      resultado: "guardada",
      respuesta: mapearRespuesta(guardada.rows[0]),
      destinatario: {
        solicitudId,
        nombre: solicitud.nombre,
        correo: solicitud.correo,
      },
    };
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}

export async function cerrarSolicitudContacto(
  solicitudId: string
): Promise<"cerrada" | "no_existe" | "ya_cerrada"> {
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    const resultado = await cliente.query<{ estatus: string }>(
      `SELECT es.estatus
       FROM contacto.solicitudes_contacto sc
       INNER JOIN contacto.estatus_solicitudes es
         ON es.id = sc.estatus_id
       INNER JOIN contacto.origenes o
         ON o.id = sc.origen_id
       WHERE sc.id = $1
         AND LOWER(o.origen) LIKE 'formulario%'
       FOR UPDATE OF sc`,
      [solicitudId]
    );
    const estatus = resultado.rows[0]?.estatus;

    if (!estatus) {
      await cliente.query("ROLLBACK");
      return "no_existe";
    }

    if (
      estatus.toLowerCase() !== "nueva" &&
      !estatus.toLowerCase().startsWith("en atenci")
    ) {
      await cliente.query("ROLLBACK");
      return "ya_cerrada";
    }

    await cliente.query(
      `UPDATE contacto.solicitudes_contacto
       SET estatus_id = (
         SELECT id
         FROM contacto.estatus_solicitudes
         WHERE LOWER(estatus) = 'atendida'
         LIMIT 1
       )
       WHERE id = $1`,
      [solicitudId]
    );

    await cliente.query("COMMIT");
    return "cerrada";
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}
