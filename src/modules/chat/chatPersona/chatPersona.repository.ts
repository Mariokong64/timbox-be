import { PoolClient } from "pg";
import { pool } from "../../../config/database";
import {
  ConversacionChatPersona,
  ConversacionChatPersonaResumen,
  MensajeChatPersona,
} from "./chatPersona.types";

interface ConversacionRow {
  id: string;
  nombre_visitante: string;
  correo_visitante: string;
  telefono_visitante: string | null;
  estatus: string;
  fecha_inicio: Date;
  fecha_fin: Date | null;
  fecha_ultima_actividad: Date;
  estado_atencion: "por_atender" | "en_atencion" | "cerrada";
  cantidad_mensajes: string | number;
  ultima_fecha_mensaje_visitante: Date | null;
  eliminable_por_inactividad: boolean;
  ultimo_mensaje?: string | null;
}

interface MensajeRow {
  id: string;
  contenido: string;
  emisor: string;
  nombre_remitente: string | null;
  fecha_registro: Date;
}

function mapearMensaje(row: MensajeRow): MensajeChatPersona {
  const remitente =
    row.emisor === "Usuario"
      ? "visitante"
      : row.emisor === "Administrador"
        ? "agente"
        : "sistema";

  return {
    id: row.id,
    contenido: row.contenido,
    remitente,
    nombreRemitente: row.nombre_remitente,
    fechaRegistro: row.fecha_registro.toISOString(),
  };
}

function mapearConversacion(
  row: ConversacionRow,
  mensajes: MensajeChatPersona[] = []
): ConversacionChatPersona {
  return {
    id: row.id,
    nombreVisitante: row.nombre_visitante,
    correoVisitante: row.correo_visitante,
    telefonoVisitante: row.telefono_visitante,
    estatus: row.estatus,
    fechaInicio: row.fecha_inicio.toISOString(),
    fechaFin: row.fecha_fin?.toISOString() ?? null,
    fechaUltimaActividad: row.fecha_ultima_actividad.toISOString(),
    estadoAtencion: row.estado_atencion,
    cantidadMensajes: Number(row.cantidad_mensajes),
    ultimaFechaMensajeVisitante:
      row.ultima_fecha_mensaje_visitante?.toISOString() ?? null,
    eliminablePorInactividad: row.eliminable_por_inactividad,
    mensajes,
  };
}

async function obtenerEstatusId(
  cliente: PoolClient,
  estatus: string
): Promise<string> {
  const resultado = await cliente.query<{ id: string }>(
    `SELECT id
     FROM chatbot.estatus_conversaciones
     WHERE estatus = $1
     LIMIT 1`,
    [estatus]
  );
  const id = resultado.rows[0]?.id;

  if (!id) {
    throw new Error(`No existe el estatus de conversación: ${estatus}`);
  }

  return id;
}

async function obtenerEmisorId(
  cliente: PoolClient,
  emisor: string
): Promise<string> {
  const resultado = await cliente.query<{ id: string }>(
    `SELECT id
     FROM chatbot.emisores
     WHERE emisor = $1
     LIMIT 1`,
    [emisor]
  );
  const id = resultado.rows[0]?.id;

  if (!id) {
    throw new Error(`No existe el emisor de conversación: ${emisor}`);
  }

  return id;
}

const CAMPOS_CONVERSACION = `
  c.id,
  s.nombre AS nombre_visitante,
  s.correo AS correo_visitante,
  s.telefono AS telefono_visitante,
  ec.estatus,
  c.fecha_inicio,
  c.fecha_fin,
  c.fecha_ultima_actividad,
  CASE
    WHEN c.fecha_fin IS NOT NULL THEN 'cerrada'
    WHEN EXISTS (
      SELECT 1
      FROM chatbot.mensajes ma
      INNER JOIN chatbot.emisores ea ON ea.id = ma.emisor_id
      WHERE ma.conversacion_id = c.id
        AND ea.emisor = 'Administrador'
    ) THEN 'en_atencion'
    ELSE 'por_atender'
  END AS estado_atencion,
  (
    SELECT COUNT(*)
    FROM chatbot.mensajes mc
    WHERE mc.conversacion_id = c.id
  ) AS cantidad_mensajes,
  (
    SELECT MAX(mv.fecha_registro)
    FROM chatbot.mensajes mv
    INNER JOIN chatbot.emisores ev ON ev.id = mv.emisor_id
    WHERE mv.conversacion_id = c.id
      AND ev.emisor = 'Usuario'
  ) AS ultima_fecha_mensaje_visitante,
  COALESCE(
    (
      SELECT MAX(mv.fecha_registro)
      FROM chatbot.mensajes mv
      INNER JOIN chatbot.emisores ev ON ev.id = mv.emisor_id
      WHERE mv.conversacion_id = c.id
        AND ev.emisor = 'Usuario'
    ) < CURRENT_TIMESTAMP - INTERVAL '30 days',
    FALSE
  ) AS eliminable_por_inactividad
`;

export async function crearConversacionRepositorio(datos: {
  tokenHash: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  mensaje: string;
  fechaExpiracion: Date;
}): Promise<ConversacionChatPersona> {
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    const sesion = await cliente.query<{ id: string }>(
      `INSERT INTO chatbot.sesiones_visitantes
        (token_hash, nombre, correo, telefono, fecha_expiracion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        datos.tokenHash,
        datos.nombre,
        datos.correo,
        datos.telefono,
        datos.fechaExpiracion,
      ]
    );
    const sesionId = sesion.rows[0].id;
    const estatusId = await obtenerEstatusId(cliente, "Abierta");

    const conversacion = await cliente.query<{ id: string }>(
      `INSERT INTO chatbot.conversaciones
        (estatus_id, sesion_visitante_id, fecha_ultima_actividad)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       RETURNING id`,
      [estatusId, sesionId]
    );
    const conversacionId = conversacion.rows[0].id;
    const emisorUsuarioId = await obtenerEmisorId(cliente, "Usuario");
    const emisorSistemaId = await obtenerEmisorId(cliente, "Sistema");

    await cliente.query(
      `INSERT INTO chatbot.mensajes
        (contenido, emisor_id, conversacion_id, fecha_registro)
       VALUES
        ($1, $2, $4, clock_timestamp()),
        ($3, $5, $4, clock_timestamp() + INTERVAL '1 millisecond')`,
      [
        datos.mensaje,
        emisorUsuarioId,
        "Gracias por escribirnos. Tu conversación está esperando a un integrante del equipo.",
        conversacionId,
        emisorSistemaId,
      ]
    );

    await cliente.query("COMMIT");

    const creada = await obtenerConversacionPorId(conversacionId);

    if (!creada) {
      throw new Error("No fue posible recuperar la conversación creada.");
    }

    return creada;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}

export async function obtenerConversacionPorTokenHash(
  tokenHash: string
): Promise<ConversacionChatPersona | null> {
  const resultado = await pool.query<ConversacionRow>(
    `SELECT ${CAMPOS_CONVERSACION}
     FROM chatbot.conversaciones c
     INNER JOIN chatbot.sesiones_visitantes s
       ON s.id = c.sesion_visitante_id
     INNER JOIN chatbot.estatus_conversaciones ec
       ON ec.id = c.estatus_id
     WHERE s.token_hash = $1
       AND s.fecha_expiracion > CURRENT_TIMESTAMP
     ORDER BY c.fecha_inicio DESC
     LIMIT 1`,
    [tokenHash]
  );
  const row = resultado.rows[0];

  if (!row) {
    return null;
  }

  const mensajes = await obtenerMensajesConversacion(row.id);
  return mapearConversacion(row, mensajes);
}

export async function obtenerConversacionPorId(
  conversacionId: string
): Promise<ConversacionChatPersona | null> {
  const resultado = await pool.query<ConversacionRow>(
    `SELECT ${CAMPOS_CONVERSACION}
     FROM chatbot.conversaciones c
     INNER JOIN chatbot.sesiones_visitantes s
       ON s.id = c.sesion_visitante_id
     INNER JOIN chatbot.estatus_conversaciones ec
       ON ec.id = c.estatus_id
     WHERE c.id = $1
     LIMIT 1`,
    [conversacionId]
  );
  const row = resultado.rows[0];

  if (!row) {
    return null;
  }

  const mensajes = await obtenerMensajesConversacion(row.id);
  return mapearConversacion(row, mensajes);
}

export async function obtenerMensajesConversacion(
  conversacionId: string
): Promise<MensajeChatPersona[]> {
  const resultado = await pool.query<MensajeRow>(
    `SELECT
       m.id,
       m.contenido,
       e.emisor,
       CASE
         WHEN e.emisor = 'Administrador' THEN u.nombre
         WHEN e.emisor = 'Usuario' THEN s.nombre
         ELSE NULL
       END AS nombre_remitente,
       m.fecha_registro
     FROM chatbot.mensajes m
     INNER JOIN chatbot.emisores e ON e.id = m.emisor_id
     INNER JOIN chatbot.conversaciones c ON c.id = m.conversacion_id
     LEFT JOIN chatbot.sesiones_visitantes s ON s.id = c.sesion_visitante_id
     LEFT JOIN sys.usuarios u ON u.id = m.usuario_id
     WHERE m.conversacion_id = $1
     ORDER BY m.fecha_registro ASC, m.id ASC
     LIMIT 500`,
    [conversacionId]
  );

  return resultado.rows.map(mapearMensaje);
}

export async function agregarMensajeVisitante(
  tokenHash: string,
  contenido: string
): Promise<MensajeChatPersona | null> {
  const resultado = await pool.query<MensajeRow>(
    `WITH conversacion_autorizada AS (
       SELECT c.id
       FROM chatbot.conversaciones c
       INNER JOIN chatbot.sesiones_visitantes s
         ON s.id = c.sesion_visitante_id
       WHERE s.token_hash = $1
         AND s.fecha_expiracion > CURRENT_TIMESTAMP
         AND c.fecha_fin IS NULL
       ORDER BY c.fecha_inicio DESC
       LIMIT 1
     ),
     mensaje_insertado AS (
       INSERT INTO chatbot.mensajes
         (contenido, emisor_id, conversacion_id)
       SELECT $2, e.id, ca.id
       FROM conversacion_autorizada ca
       CROSS JOIN chatbot.emisores e
       WHERE e.emisor = 'Usuario'
       RETURNING id, contenido, emisor_id, conversacion_id, fecha_registro
     ),
     actividad_actualizada AS (
       UPDATE chatbot.conversaciones c
       SET fecha_ultima_actividad = CURRENT_TIMESTAMP
       FROM conversacion_autorizada ca
       WHERE c.id = ca.id
       RETURNING c.id
     )
     SELECT
       mi.id,
       mi.contenido,
       e.emisor,
       s.nombre AS nombre_remitente,
       mi.fecha_registro
     FROM mensaje_insertado mi
     INNER JOIN chatbot.emisores e ON e.id = mi.emisor_id
     INNER JOIN chatbot.conversaciones c ON c.id = mi.conversacion_id
     INNER JOIN chatbot.sesiones_visitantes s ON s.id = c.sesion_visitante_id`,
    [tokenHash, contenido]
  );

  const row = resultado.rows[0];
  return row ? mapearMensaje(row) : null;
}

export async function listarConversacionesRepositorio(
  estado:
    | "por_atender"
    | "en_atencion"
    | "cerrada"
    | "inactivas_30_dias"
    | "todas"
): Promise<
  ConversacionChatPersonaResumen[]
> {
  const resultado = await pool.query<ConversacionRow>(
    `SELECT
       ${CAMPOS_CONVERSACION},
       ultimo.contenido AS ultimo_mensaje
     FROM chatbot.conversaciones c
     INNER JOIN chatbot.sesiones_visitantes s
       ON s.id = c.sesion_visitante_id
     INNER JOIN chatbot.estatus_conversaciones ec
       ON ec.id = c.estatus_id
     LEFT JOIN LATERAL (
       SELECT m.contenido
       FROM chatbot.mensajes m
       WHERE m.conversacion_id = c.id
       ORDER BY m.fecha_registro DESC, m.id DESC
       LIMIT 1
     ) ultimo ON TRUE
     WHERE
       $1 = 'todas'
       OR (
         $1 = 'cerrada'
         AND c.fecha_fin IS NOT NULL
       )
       OR (
         $1 = 'en_atencion'
         AND c.fecha_fin IS NULL
         AND EXISTS (
           SELECT 1
           FROM chatbot.mensajes ma
           INNER JOIN chatbot.emisores ea ON ea.id = ma.emisor_id
           WHERE ma.conversacion_id = c.id
             AND ea.emisor = 'Administrador'
         )
       )
       OR (
         $1 = 'por_atender'
         AND c.fecha_fin IS NULL
         AND NOT EXISTS (
           SELECT 1
           FROM chatbot.mensajes ma
           INNER JOIN chatbot.emisores ea ON ea.id = ma.emisor_id
           WHERE ma.conversacion_id = c.id
             AND ea.emisor = 'Administrador'
         )
       )
       OR (
         $1 = 'inactivas_30_dias'
         AND (
           SELECT MAX(mi.fecha_registro)
           FROM chatbot.mensajes mi
           INNER JOIN chatbot.emisores ei ON ei.id = mi.emisor_id
           WHERE mi.conversacion_id = c.id
             AND ei.emisor = 'Usuario'
         ) < CURRENT_TIMESTAMP - INTERVAL '30 days'
       )
     ORDER BY
       CASE
         WHEN c.fecha_fin IS NULL AND NOT EXISTS (
           SELECT 1
           FROM chatbot.mensajes mp
           INNER JOIN chatbot.emisores ep ON ep.id = mp.emisor_id
           WHERE mp.conversacion_id = c.id
             AND ep.emisor = 'Administrador'
         ) THEN 0
         WHEN c.fecha_fin IS NULL THEN 1
         ELSE 2
       END,
       c.fecha_ultima_actividad DESC
     LIMIT 500`,
    [estado]
  );

  return resultado.rows.map((row) => ({
    ...mapearConversacion(row),
    ultimoMensaje: row.ultimo_mensaje ?? null,
  }));
}

export async function eliminarConversacionInactivaRepositorio(
  conversacionId: string
): Promise<boolean> {
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    const conversacion = await cliente.query<{
      sesion_visitante_id: string | null;
    }>(
      `SELECT c.sesion_visitante_id
       FROM chatbot.conversaciones c
       WHERE c.id = $1
         AND (
           SELECT MAX(m.fecha_registro)
           FROM chatbot.mensajes m
           INNER JOIN chatbot.emisores e ON e.id = m.emisor_id
           WHERE m.conversacion_id = c.id
             AND e.emisor = 'Usuario'
         ) < CURRENT_TIMESTAMP - INTERVAL '30 days'
       FOR UPDATE`,
      [conversacionId]
    );
    const sesionVisitanteId =
      conversacion.rows[0]?.sesion_visitante_id ?? null;

    if (!conversacion.rows[0]) {
      await cliente.query("ROLLBACK");
      return false;
    }

    await cliente.query(
      `DELETE FROM contacto.solicitudes_contacto
       WHERE conversacion_id = $1`,
      [conversacionId]
    );
    await cliente.query(
      `DELETE FROM chatbot.conversaciones
       WHERE id = $1`,
      [conversacionId]
    );

    if (sesionVisitanteId) {
      await cliente.query(
        `DELETE FROM chatbot.sesiones_visitantes s
         WHERE s.id = $1
           AND NOT EXISTS (
             SELECT 1
             FROM chatbot.conversaciones c
             WHERE c.sesion_visitante_id = s.id
           )`,
        [sesionVisitanteId]
      );
    }

    await cliente.query("COMMIT");
    return true;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}

export async function agregarMensajeAgente(
  conversacionId: string,
  usuarioId: string,
  contenido: string
): Promise<MensajeChatPersona | null> {
  const resultado = await pool.query<MensajeRow>(
    `WITH conversacion_autorizada AS (
       SELECT c.id
       FROM chatbot.conversaciones c
       WHERE c.id = $1
         AND c.fecha_fin IS NULL
     ),
     mensaje_insertado AS (
       INSERT INTO chatbot.mensajes
         (contenido, emisor_id, conversacion_id, usuario_id)
       SELECT $3, e.id, ca.id, $2
       FROM conversacion_autorizada ca
       CROSS JOIN chatbot.emisores e
       WHERE e.emisor = 'Administrador'
       RETURNING id, contenido, emisor_id, usuario_id, fecha_registro
     ),
     actividad_actualizada AS (
       UPDATE chatbot.conversaciones c
       SET fecha_ultima_actividad = CURRENT_TIMESTAMP
       FROM conversacion_autorizada ca
       WHERE c.id = ca.id
       RETURNING c.id
     )
     SELECT
       mi.id,
       mi.contenido,
       e.emisor,
       u.nombre AS nombre_remitente,
       mi.fecha_registro
     FROM mensaje_insertado mi
     INNER JOIN chatbot.emisores e ON e.id = mi.emisor_id
     INNER JOIN sys.usuarios u ON u.id = mi.usuario_id`,
    [conversacionId, usuarioId, contenido]
  );

  const row = resultado.rows[0];
  return row ? mapearMensaje(row) : null;
}

export async function finalizarConversacionRepositorio(
  conversacionId: string
): Promise<boolean> {
  const resultado = await pool.query(
    `UPDATE chatbot.conversaciones
     SET fecha_fin = CURRENT_TIMESTAMP,
         estatus_id = (
           SELECT id
           FROM chatbot.estatus_conversaciones
           WHERE estatus = 'Finalizada'
           LIMIT 1
         ),
         fecha_ultima_actividad = CURRENT_TIMESTAMP
     WHERE id = $1
       AND fecha_fin IS NULL`,
    [conversacionId]
  );

  return (resultado.rowCount ?? 0) > 0;
}
