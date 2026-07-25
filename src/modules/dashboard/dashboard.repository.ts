import { pool } from "../../config/database";
import {
  MetricaDashboard,
  MetricaDashboardRow,
  ResumenContactoDashboard,
  ResumenContactoRow,
  ResumenDashboard,
  ResumenValidadorDashboard,
  ResumenValidadorRow,
  SerieDiariaDashboard,
  SerieDiariaDashboardRow,
  SolicitudRecienteDashboard,
  SolicitudRecienteDashboardRow,
} from "./dashboard.types";

function aNumero(valor: string | number | null | undefined): number {
  return Number(valor ?? 0);
}

function mapearMetrica(row: MetricaDashboardRow): MetricaDashboard {
  return {
    etiqueta: row.etiqueta,
    valor: aNumero(row.valor),
  };
}

function mapearSerieDiaria(row: SerieDiariaDashboardRow): SerieDiariaDashboard {
  return {
    fecha: row.fecha,
    total: aNumero(row.total),
  };
}

function mapearSolicitudReciente(row: SolicitudRecienteDashboardRow): SolicitudRecienteDashboard {
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    estatus: row.estatus,
    origen: row.origen,
    fechaRegistro: row.fecha_registro,
  };
}

const FUENTES_SOLICITUDES = `
  WITH solicitudes AS (
    SELECT
      sc.id,
      sc.nombre,
      sc.correo,
      es.estatus,
      'Formulario público'::text AS origen,
      sc.fecha_registro
    FROM contacto.solicitudes_contacto sc
    INNER JOIN contacto.estatus_solicitudes es ON es.id = sc.estatus_id
    INNER JOIN contacto.origenes o ON o.id = sc.origen_id
    WHERE LOWER(o.origen) LIKE 'formulario%'

    UNION ALL

    SELECT
      c.id,
      sv.nombre,
      sv.correo,
      CASE
        WHEN c.fecha_fin IS NOT NULL THEN 'Atendida'
        WHEN EXISTS (
          SELECT 1
          FROM chatbot.mensajes m
          INNER JOIN chatbot.emisores e ON e.id = m.emisor_id
          WHERE m.conversacion_id = c.id
            AND e.emisor = 'Administrador'
        ) THEN 'En atención'
        ELSE 'Nueva'
      END AS estatus,
      'Chat'::text AS origen,
      c.fecha_inicio AS fecha_registro
    FROM chatbot.conversaciones c
    INNER JOIN chatbot.sesiones_visitantes sv
      ON sv.id = c.sesion_visitante_id
  )
`;

async function obtenerResumenContacto(): Promise<ResumenContactoDashboard> {
  const resumenQuery = `${FUENTES_SOLICITUDES}
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE estatus = 'Atendida') AS atendidas,
      COUNT(*) FILTER (
        WHERE estatus = 'Nueva' OR estatus ILIKE 'En atenci%'
      ) AS pendientes,
      COUNT(*) FILTER (WHERE estatus ILIKE 'En atenci%') AS en_atencion,
      COUNT(*) FILTER (WHERE estatus = 'Descartada') AS descartadas
    FROM solicitudes
  `;

  const porEstatusQuery = `${FUENTES_SOLICITUDES},
    catalogo(etiqueta, orden) AS (
      VALUES
        ('Nueva', 1),
        ('En atención', 2),
        ('Atendida', 3),
        ('Descartada', 4)
    )
    SELECT
      catalogo.etiqueta,
      COUNT(solicitudes.id) AS valor
    FROM catalogo
    LEFT JOIN solicitudes
      ON LOWER(solicitudes.estatus) = LOWER(catalogo.etiqueta)
      OR (
        catalogo.etiqueta = 'En atención'
        AND solicitudes.estatus ILIKE 'En atenci%'
      )
    GROUP BY catalogo.etiqueta, catalogo.orden
    ORDER BY catalogo.orden
  `;

  const porOrigenQuery = `${FUENTES_SOLICITUDES},
    origenes(etiqueta, orden) AS (
      VALUES
        ('Formulario público', 1),
        ('Chat', 2)
    )
    SELECT
      origenes.etiqueta,
      COUNT(solicitudes.id) AS valor
    FROM origenes
    LEFT JOIN solicitudes ON solicitudes.origen = origenes.etiqueta
    GROUP BY origenes.etiqueta, origenes.orden
    ORDER BY origenes.orden
  `;

  const porDiaQuery = `${FUENTES_SOLICITUDES},
    dias AS (
      SELECT generate_series(
        CURRENT_DATE - INTERVAL '13 days',
        CURRENT_DATE,
        INTERVAL '1 day'
      )::date AS fecha
    )
    SELECT
      TO_CHAR(dias.fecha, 'YYYY-MM-DD') AS fecha,
      COUNT(solicitudes.id) AS total
    FROM dias
    LEFT JOIN solicitudes
      ON solicitudes.fecha_registro::date = dias.fecha
    GROUP BY dias.fecha
    ORDER BY dias.fecha ASC
  `;

  const recientesQuery = `${FUENTES_SOLICITUDES}
    SELECT
      id,
      nombre,
      correo,
      estatus,
      origen,
      fecha_registro
    FROM solicitudes
    ORDER BY fecha_registro DESC
    LIMIT 6
  `;

  const [resumen, porEstatus, porOrigen, porDia, recientes] = await Promise.all([
    pool.query<ResumenContactoRow>(resumenQuery),
    pool.query<MetricaDashboardRow>(porEstatusQuery),
    pool.query<MetricaDashboardRow>(porOrigenQuery),
    pool.query<SerieDiariaDashboardRow>(porDiaQuery),
    pool.query<SolicitudRecienteDashboardRow>(recientesQuery),
  ]);
  const fila = resumen.rows[0];

  return {
    total: aNumero(fila?.total),
    atendidas: aNumero(fila?.atendidas),
    pendientes: aNumero(fila?.pendientes),
    enAtencion: aNumero(fila?.en_atencion),
    descartadas: aNumero(fila?.descartadas),
    porEstatus: porEstatus.rows.map(mapearMetrica),
    porOrigen: porOrigen.rows.map(mapearMetrica),
    porDia: porDia.rows.map(mapearSerieDiaria),
    recientes: recientes.rows.map(mapearSolicitudReciente),
  };
}

async function obtenerResumenValidador(): Promise<ResumenValidadorDashboard> {
  const resumenQuery = `
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE rv.resultado = 'Vigente') AS vigentes,
      COUNT(*) FILTER (WHERE rv.resultado = 'Cancelado') AS cancelados,
      COUNT(*) FILTER (WHERE rv.resultado = 'No encontrado') AS no_encontrados,
      COUNT(*) FILTER (WHERE rv.resultado ILIKE 'Error de validaci%') AS errores
    FROM cfdi.validaciones_cfdi vc
    INNER JOIN cfdi.resultados_validaciones rv ON rv.id = vc.resultado_id
  `;

  const porResultadoQuery = `
    SELECT rv.resultado AS etiqueta, COUNT(vc.id) AS valor
    FROM cfdi.resultados_validaciones rv
    LEFT JOIN cfdi.validaciones_cfdi vc ON vc.resultado_id = rv.id
    GROUP BY rv.resultado
    ORDER BY valor DESC, rv.resultado ASC
  `;

  const porDiaQuery = `
    WITH dias AS (
      SELECT generate_series(
        CURRENT_DATE - INTERVAL '13 days',
        CURRENT_DATE,
        INTERVAL '1 day'
      )::date AS fecha
    )
    SELECT
      TO_CHAR(dias.fecha, 'YYYY-MM-DD') AS fecha,
      COUNT(vc.id) AS total
    FROM dias
    LEFT JOIN cfdi.validaciones_cfdi vc
      ON vc.fecha_validacion::date = dias.fecha
    GROUP BY dias.fecha
    ORDER BY dias.fecha ASC
  `;

  const [resumen, porResultado, porDia] = await Promise.all([
    pool.query<ResumenValidadorRow>(resumenQuery),
    pool.query<MetricaDashboardRow>(porResultadoQuery),
    pool.query<SerieDiariaDashboardRow>(porDiaQuery),
  ]);
  const fila = resumen.rows[0];

  return {
    total: aNumero(fila?.total),
    vigentes: aNumero(fila?.vigentes),
    cancelados: aNumero(fila?.cancelados),
    noEncontrados: aNumero(fila?.no_encontrados),
    errores: aNumero(fila?.errores),
    porResultado: porResultado.rows.map(mapearMetrica),
    porDia: porDia.rows.map(mapearSerieDiaria),
  };
}

export async function obtenerResumenDashboard(): Promise<ResumenDashboard> {
  const [contacto, validador] = await Promise.all([
    obtenerResumenContacto(),
    obtenerResumenValidador(),
  ]);

  return {
    contacto,
    validador,
  };
}
