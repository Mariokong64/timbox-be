import { verificarCaptcha } from "../../shared/services/recaptcha.service";
import { consultarEstatusSat } from "./consultaSat.service";
import { crearInformacionCfdi, extraerDatosCfdi } from "./cfdi.service";
import { guardarValidacionCfdi } from "./validador.repository";
import { ResultadoValidacionCfdi } from "./validador.types";

const TAMANO_MAXIMO_XML = 6 * 1024 * 1024;

interface SolicitudValidacionCfdi {
  archivo?: Express.Multer.File;
  captchaToken: string;
}

function validarArchivoXml(archivo?: Express.Multer.File): Express.Multer.File {
  if (!archivo) {
    throw new Error("Selecciona un archivo XML.");
  }

  if (archivo.size > TAMANO_MAXIMO_XML) {
    throw new Error("El XML no debe pesar mas de 6 MB.");
  }

  const nombreEsXml = archivo.originalname.toLowerCase().endsWith(".xml");
  const tipoEsXml = ["text/xml", "application/xml", "text/plain", "application/octet-stream", ""].includes(
    archivo.mimetype
  );

  if (!nombreEsXml || !tipoEsXml) {
    throw new Error("El archivo debe tener formato XML.");
  }

  return archivo;
}

function crearMensajeConsultaSat(codigoEstatus: string, estado: string): string {
  if (!codigoEstatus && !estado) {
    return "No se recibio respuesta del SAT.";
  }

  return `CodigoEstatus:${codigoEstatus} Estado:${estado}.`;
}

function normalizarResultadoBaseDatos(estadoSat: string): string {
  const estado = estadoSat.trim().toLowerCase();

  if (estado === "vigente") {
    return "Vigente";
  }

  if (estado === "cancelado") {
    return "Cancelado";
  }

  if (estado === "no encontrado" || estado === "no encontrado.") {
    return "No encontrado";
  }

  return "Error de validación";
}

function guardarMetricasValidacion({
  resultado,
  rfcEmisor,
  rfcReceptor,
  total,
  uuidCfdi,
  nombreArchivo,
}: {
  resultado: string;
  rfcEmisor: string | null;
  rfcReceptor: string | null;
  total: string | null;
  uuidCfdi: string | null;
  nombreArchivo: string | null;
}) {
  void guardarValidacionCfdi({
    resultado,
    rfcEmisor,
    rfcReceptor,
    total,
    uuidCfdi,
    nombreArchivo,
  }).catch((error: unknown) => {
    console.error("No se pudo guardar la metrica de validacion CFDI.", error);
  });
}

export async function validarCfdiService({
  archivo,
  captchaToken,
}: SolicitudValidacionCfdi): Promise<ResultadoValidacionCfdi> {
  await verificarCaptcha(captchaToken);

  const archivoValidado = validarArchivoXml(archivo);
  const xml = archivoValidado.buffer.toString("utf8");
  const datosCfdi = extraerDatosCfdi(xml);
  const datosMetricas = {
    rfcEmisor: datosCfdi.rfcEmisor,
    rfcReceptor: datosCfdi.rfcReceptor,
    total: datosCfdi.total,
    uuidCfdi: datosCfdi.uuid,
    nombreArchivo: archivoValidado.originalname,
  };
  const consultaSat = await consultarEstatusSat(datosCfdi).catch((error: unknown) => {
    guardarMetricasValidacion({
      resultado: "Error de validación",
      ...datosMetricas,
    });

    throw error;
  });
  const estadoNormalizado = consultaSat.estado.toLowerCase();
  const valido = estadoNormalizado === "vigente";
  const resultadoBaseDatos = normalizarResultadoBaseDatos(consultaSat.estado);

  guardarMetricasValidacion({
    resultado: resultadoBaseDatos,
    ...datosMetricas,
  });

  return {
    valido,
    titulo: valido ? "Comprobante Valido" : "Comprobante Invalido",
    consultaSat: crearMensajeConsultaSat(consultaSat.codigoEstatus, consultaSat.estado),
    uuid: datosCfdi.uuid,
    numeroCertificadoSat: datosCfdi.numeroCertificadoSat,
    fechaTimbrado: datosCfdi.fechaTimbrado,
    rfcPac: datosCfdi.rfcPac,
    informacionCfdi: crearInformacionCfdi(datosCfdi),
    errores: valido
      ? []
      : [
          {
            error: "SAT",
            mensaje: consultaSat.estado || "El comprobante no se encuentra vigente.",
          },
        ],
  };
}
