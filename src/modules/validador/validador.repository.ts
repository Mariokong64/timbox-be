import { pool } from "../../config/database";

export interface RegistroValidacionCfdi {
  resultado: string;
  rfcEmisor: string | null;
  rfcReceptor: string | null;
  total: string | null;
  uuidCfdi: string | null;
  nombreArchivo: string | null;
}

export async function guardarValidacionCfdi(datos: RegistroValidacionCfdi): Promise<void> {
  const query = `
    INSERT INTO cfdi.validaciones_cfdi (
      resultado_id,
      rfc_emisor,
      rfc_receptor,
      total,
      uuid_cfdi,
      nombre_archivo
    )
    SELECT
      resultado.id,
      $2,
      $3,
      $4,
      $5,
      $6
    FROM cfdi.resultados_validaciones resultado
    WHERE resultado.resultado = $1
    LIMIT 1
  `;

  const resultado = await pool.query(query, [
    datos.resultado,
    datos.rfcEmisor,
    datos.rfcReceptor,
    datos.total,
    datos.uuidCfdi,
    datos.nombreArchivo,
  ]);

  if (resultado.rowCount === 0) {
    throw new Error(`No existe el resultado de validacion CFDI: ${datos.resultado}`);
  }
}
