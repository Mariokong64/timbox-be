import { pool } from "../../config/database";
import {
  ContactoDatosLimpios,
  FiltroEstadoSolicitud,
  RespuestaSolicitudContacto,
  RespuestaSolicitudContactoRow,
  SolicitudContactoCreada,
  SolicitudContactoDetalle,
  SolicitudContactoRow,
  SolicitudContactoResumen,
} from "./contacto.types";
import { crearEnviosPendientesSolicitud } from "./contacto.notificaciones.repository";

const ESTATUS_INICIAL = "Nueva";
const ORIGEN_FORMULARIO_PUBLICO = "Formulario publico";
const ORIGEN_FORMULARIO_PUBLICO_CON_ACENTO = "Formulario público";

export async function crearSolicitudContacto(
  datos: ContactoDatosLimpios
): Promise<SolicitudContactoCreada> {
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    const result = await cliente.query<SolicitudContactoCreada>(
      `INSERT INTO contacto.solicitudes_contacto (
         nombre,
         correo,
         telefono,
         rfc,
         mensaje,
         estatus_id,
         origen_id
       )
       VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         (SELECT id FROM contacto.estatus_solicitudes WHERE estatus = $6 LIMIT 1),
         (
           SELECT id
           FROM contacto.origenes
           WHERE origen IN ($7, $8)
           LIMIT 1
         )
       )
       RETURNING id, fecha_registro`,
      [
        datos.nombre,
        datos.correo,
        datos.telefono,
        datos.rfc,
        datos.mensaje,
        ESTATUS_INICIAL,
        ORIGEN_FORMULARIO_PUBLICO,
        ORIGEN_FORMULARIO_PUBLICO_CON_ACENTO,
      ]
    );
    const solicitud = result.rows[0];

    if (!solicitud) {
      throw new Error("No se pudo registrar la solicitud de contacto.");
    }

    await crearEnviosPendientesSolicitud(cliente, solicitud.id);
    await cliente.query("COMMIT");

    return solicitud;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}

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
  fila: SolicitudContactoRow
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

export async function listarSolicitudesContacto(
  estado: FiltroEstadoSolicitud
): Promise<SolicitudContactoResumen[]> {
  const resultado = await pool.query<SolicitudContactoRow>(
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
  const resultado = await pool.query<SolicitudContactoRow>(
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

  const respuestas = await listarRespuestasSolicitud(id);

  return {
    ...mapearSolicitud(solicitud),
    respuestas,
  };
}

function mapearRespuesta(
  fila: RespuestaSolicitudContactoRow
): RespuestaSolicitudContacto {
  return {
    id: fila.id,
    detalles: fila.detalles,
    fechaAtencion: fila.fecha_atencion.toISOString(),
    usuarioId: fila.usuario_id,
    nombreUsuario: fila.nombre_usuario,
  };
}

export async function listarRespuestasSolicitud(
  solicitudId: string
): Promise<RespuestaSolicitudContacto[]> {
  const resultado = await pool.query<RespuestaSolicitudContactoRow>(
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
  | { resultado: "guardada"; respuesta: RespuestaSolicitudContacto }
  | { resultado: "no_existe" | "cerrada" }
> {
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    const solicitud = await cliente.query<{ estatus: string }>(
      `SELECT es.estatus
       FROM contacto.solicitudes_contacto sc
       INNER JOIN contacto.estatus_solicitudes es ON es.id = sc.estatus_id
       WHERE sc.id = $1
       FOR UPDATE OF sc`,
      [solicitudId]
    );
    const estatus = solicitud.rows[0]?.estatus;

    if (!estatus) {
      await cliente.query("ROLLBACK");
      return { resultado: "no_existe" };
    }

    if (
      estatus.toLowerCase() !== "nueva" &&
      !estatus.toLowerCase().startsWith("en atenci")
    ) {
      await cliente.query("ROLLBACK");
      return { resultado: "cerrada" };
    }

    const guardada = await cliente.query<RespuestaSolicitudContactoRow>(
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
    };
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}
