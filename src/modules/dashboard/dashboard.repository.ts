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

async function obtenerResumenContacto(): Promise<ResumenContactoDashboard> {
  const resumenQuery = `
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE es.estatus = 'Atendida') AS atendidas,
      COUNT(*) FILTER (WHERE es.estatus = 'Nueva' OR es.estatus ILIKE 'En atenci%') AS pendientes,
      COUNT(*) FILTER (WHERE es.estatus ILIKE 'En atenci%') AS en_atencion,
      COUNT(*) FILTER (WHERE es.estatus = 'Descartada') AS descartadas
    FROM contacto.solicitudes_contacto sc
    INNER JOIN contacto.estatus_solicitudes es ON es.id = sc.estatus_id
  `;

  const porEstatusQuery = `
    SELECT es.estatus AS etiqueta, COUNT(sc.id) AS valor
    FROM contacto.estatus_solicitudes es
    LEFT JOIN contacto.solicitudes_contacto sc ON sc.estatus_id = es.id
    GROUP BY es.estatus
    ORDER BY valor DESC, es.estatus ASC
  `;

  const porOrigenQuery = `
    SELECT o.origen AS etiqueta, COUNT(sc.id) AS valor
    FROM contacto.origenes o
    LEFT JOIN contacto.solicitudes_contacto sc ON sc.origen_id = o.id
    GROUP BY o.origen
    ORDER BY valor DESC, o.origen ASC
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
      COUNT(sc.id) AS total
    FROM dias
    LEFT JOIN contacto.solicitudes_contacto sc
      ON sc.fecha_registro::date = dias.fecha
    GROUP BY dias.fecha
    ORDER BY dias.fecha ASC
  `;

  const recientesQuery = `
    SELECT
      sc.id,
      sc.nombre,
      sc.correo,
      es.estatus,
      o.origen,
      sc.fecha_registro
    FROM contacto.solicitudes_contacto sc
    INNER JOIN contacto.estatus_solicitudes es ON es.id = sc.estatus_id
    INNER JOIN contacto.origenes o ON o.id = sc.origen_id
    ORDER BY sc.fecha_registro DESC
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
