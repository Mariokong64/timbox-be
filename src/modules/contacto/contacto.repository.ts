import { pool } from "../../config/database";
import { ContactoDatosLimpios, SolicitudContactoCreada } from "./contacto.types";

const ESTATUS_INICIAL = "Nueva";
const ORIGEN_FORMULARIO_PUBLICO = "Formulario publico";
const ORIGEN_FORMULARIO_PUBLICO_CON_ACENTO = "Formulario público";

export async function crearSolicitudContacto(
  datos: ContactoDatosLimpios
): Promise<SolicitudContactoCreada> {
  const query = `
    INSERT INTO contacto.solicitudes_contacto (
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
    RETURNING id, fecha_registro
  `;

  const result = await pool.query<SolicitudContactoCreada>(query, [
    datos.nombre,
    datos.correo,
    datos.telefono,
    datos.rfc,
    datos.mensaje,
    ESTATUS_INICIAL,
    ORIGEN_FORMULARIO_PUBLICO,
    ORIGEN_FORMULARIO_PUBLICO_CON_ACENTO,
  ]);

  const solicitud = result.rows[0];

  if (!solicitud) {
    throw new Error("No se pudo registrar la solicitud de contacto.");
  }

  return solicitud;
}
