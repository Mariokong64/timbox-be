import { PoolClient } from "pg";
import { pool } from "../../config/database";
import { EnvioSolicitudContactoPendiente } from "./contacto.types";

const ESTATUS_PENDIENTE = "Pendiente";
const ESTATUS_PROCESANDO = "Procesando";
const ESTATUS_ENVIADO = "Enviado";
const ESTATUS_FALLIDO = "Fallido";

export async function crearEnviosPendientesSolicitud(
  cliente: PoolClient,
  solicitudContactoId: string
): Promise<void> {
  await cliente.query(
    `INSERT INTO contacto.envios_solicitudes_contacto (
       solicitud_contacto_id,
       destinatario_notificacion_id,
       correo_destinatario,
       estatus_envio_id
     )
     SELECT
       $1,
       d.id,
       d.correo,
       (
         SELECT id
         FROM contacto.estatus_envios_correo
         WHERE estatus = $2
       )
     FROM contacto.destinatarios_notificacion d
     WHERE d.activo = TRUE
     ON CONFLICT DO NOTHING`,
    [solicitudContactoId, ESTATUS_PENDIENTE]
  );
}

export async function recuperarEnviosInterrumpidos(
  maxIntentos: number,
  bloqueoExpiradoMs: number
): Promise<void> {
  await pool.query(
    `UPDATE contacto.envios_solicitudes_contacto e
     SET estatus_envio_id = CASE
           WHEN e.intentos >= $1 THEN (
             SELECT id
             FROM contacto.estatus_envios_correo
             WHERE estatus = $3
           )
           ELSE (
             SELECT id
             FROM contacto.estatus_envios_correo
             WHERE estatus = $4
           )
         END,
         ultimo_error = COALESCE(
           e.ultimo_error,
           'El procesamiento anterior fue interrumpido.'
         ),
         modificado = CURRENT_TIMESTAMP
     WHERE e.estatus_envio_id = (
           SELECT id
           FROM contacto.estatus_envios_correo
           WHERE estatus = $5
         )
       AND e.ultimo_intento <= CURRENT_TIMESTAMP
         - ($2::double precision * INTERVAL '1 millisecond')`,
    [
      maxIntentos,
      bloqueoExpiradoMs,
      ESTATUS_FALLIDO,
      ESTATUS_PENDIENTE,
      ESTATUS_PROCESANDO,
    ]
  );
}

export async function tomarEnviosPendientes(
  limite: number,
  maxIntentos: number,
  solicitudContactoId: string | null = null
): Promise<EnvioSolicitudContactoPendiente[]> {
  const resultado = await pool.query<EnvioSolicitudContactoPendiente>(
    `WITH candidatos AS (
       SELECT e.id
       FROM contacto.envios_solicitudes_contacto e
       WHERE e.intentos < $2
         AND e.estatus_envio_id = (
           SELECT id
           FROM contacto.estatus_envios_correo
           WHERE estatus = $3
         )
         AND e.proximo_intento <= CURRENT_TIMESTAMP
         AND ($5::uuid IS NULL OR e.solicitud_contacto_id = $5)
       ORDER BY e.creado ASC
       FOR UPDATE SKIP LOCKED
       LIMIT $1
     ),
     tomados AS (
       UPDATE contacto.envios_solicitudes_contacto e
       SET estatus_envio_id = (
             SELECT id
             FROM contacto.estatus_envios_correo
             WHERE estatus = $4
           ),
           intentos = e.intentos + 1,
           ultimo_intento = CURRENT_TIMESTAMP,
           modificado = CURRENT_TIMESTAMP
       FROM candidatos c
       WHERE e.id = c.id
       RETURNING e.*
     )
     SELECT
       e.id AS envio_id,
       e.intentos,
       e.correo_destinatario,
       e.solicitud_contacto_id,
       sc.nombre,
       sc.correo,
       sc.telefono,
       sc.rfc,
       sc.mensaje,
       sc.fecha_registro
     FROM tomados e
     INNER JOIN contacto.solicitudes_contacto sc
       ON sc.id = e.solicitud_contacto_id
     ORDER BY e.creado ASC`,
    [
      limite,
      maxIntentos,
      ESTATUS_PENDIENTE,
      ESTATUS_PROCESANDO,
      solicitudContactoId,
    ]
  );

  return resultado.rows;
}

export async function marcarEnvioExitoso(
  envioId: string,
  mensajeId: string | null
): Promise<void> {
  await pool.query(
    `UPDATE contacto.envios_solicitudes_contacto
     SET estatus_envio_id = (
           SELECT id
           FROM contacto.estatus_envios_correo
           WHERE estatus = $3
         ),
         fecha_envio = CURRENT_TIMESTAMP,
         mensaje_id = $2,
         ultimo_error = NULL,
         modificado = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [envioId, mensajeId, ESTATUS_ENVIADO]
  );
}

export async function marcarEnvioFallido(
  envioId: string,
  error: string
): Promise<void> {
  await pool.query(
    `UPDATE contacto.envios_solicitudes_contacto
     SET estatus_envio_id = (
           SELECT id
           FROM contacto.estatus_envios_correo
           WHERE estatus = $3
         ),
         ultimo_error = $2,
         modificado = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [envioId, error, ESTATUS_FALLIDO]
  );
}

export async function marcarEnvioPendiente(
  envioId: string,
  error: string
): Promise<void> {
  await pool.query(
    `UPDATE contacto.envios_solicitudes_contacto
     SET estatus_envio_id = (
           SELECT id
           FROM contacto.estatus_envios_correo
           WHERE estatus = $3
         ),
         ultimo_error = $2,
         proximo_intento = CURRENT_TIMESTAMP,
         modificado = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [envioId, error, ESTATUS_PENDIENTE]
  );
}
