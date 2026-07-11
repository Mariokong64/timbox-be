import { X509Certificate } from "crypto";
import { XMLParser } from "fast-xml-parser";
import { DatosCfdi, FilaInformacionCfdi } from "./validador.types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
});

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function buscarNodoPorSufijo(origen: unknown, sufijo: string): Record<string, unknown> | null {
  if (!esObjeto(origen)) {
    return null;
  }

  for (const [llave, valor] of Object.entries(origen)) {
    if (llave === sufijo || llave.endsWith(`:${sufijo}`)) {
      return esObjeto(valor) ? valor : null;
    }
  }

  return null;
}

function leerAtributo(nodo: Record<string, unknown>, nombre: string): string {
  const valor = nodo[nombre];

  if (typeof valor === "string" || typeof valor === "number") {
    return String(valor);
  }

  return "";
}

function requerirAtributo(nodo: Record<string, unknown>, nombre: string, mensaje: string): string {
  const valor = leerAtributo(nodo, nombre);

  if (!valor) {
    throw new Error(mensaje);
  }

  return valor;
}

function crearFila(atributo: string, valor: string | null, estatus?: boolean): FilaInformacionCfdi {
  return {
    atributo,
    valor: valor || "N/A",
    estatus,
  };
}

function formatearFechaUtc(fechaTexto: string): string {
  const fecha = new Date(fechaTexto);

  if (Number.isNaN(fecha.getTime())) {
    return fechaTexto.replace("GMT", "UTC");
  }

  const anio = fecha.getUTCFullYear();
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getUTCDate()).padStart(2, "0");
  const hora = String(fecha.getUTCHours()).padStart(2, "0");
  const minuto = String(fecha.getUTCMinutes()).padStart(2, "0");
  const segundo = String(fecha.getUTCSeconds()).padStart(2, "0");

  return `${anio}-${mes}-${dia} ${hora}:${minuto}:${segundo} UTC`;
}

function leerValidezCertificado(certificadoBase64: string): Pick<DatosCfdi, "validezCertificado" | "certificadoLeidoCorrectamente"> {
  try {
    const certificado = new X509Certificate(Buffer.from(certificadoBase64, "base64"));

    return {
      validezCertificado: `Desde: ${formatearFechaUtc(certificado.validFrom)} Hasta: ${formatearFechaUtc(
        certificado.validTo
      )}`,
      certificadoLeidoCorrectamente: true,
    };
  } catch {
    return {
      validezCertificado: "No se pudo leer la vigencia del certificado.",
      certificadoLeidoCorrectamente: false,
    };
  }
}

export function extraerDatosCfdi(xml: string): DatosCfdi {
  const documento = parser.parse(xml);
  const comprobante = buscarNodoPorSufijo(documento, "Comprobante");

  if (!comprobante) {
    throw new Error("El XML no contiene el nodo cfdi:Comprobante.");
  }

  const emisor = buscarNodoPorSufijo(comprobante, "Emisor");
  const receptor = buscarNodoPorSufijo(comprobante, "Receptor");
  const complemento = buscarNodoPorSufijo(comprobante, "Complemento");
  const timbre = buscarNodoPorSufijo(complemento, "TimbreFiscalDigital");

  if (!emisor) {
    throw new Error("El XML no contiene el nodo cfdi:Emisor.");
  }

  if (!receptor) {
    throw new Error("El XML no contiene el nodo cfdi:Receptor.");
  }

  if (!timbre) {
    throw new Error("El XML no contiene el timbre fiscal digital.");
  }

  const certificado = requerirAtributo(comprobante, "Certificado", "El XML no contiene certificado.");
  const validezCertificado = leerValidezCertificado(certificado);

  return {
    fechaEmision: requerirAtributo(comprobante, "Fecha", "El XML no contiene fecha de emision."),
    rfcEmisor: requerirAtributo(emisor, "Rfc", "El XML no contiene RFC emisor."),
    rfcReceptor: requerirAtributo(receptor, "Rfc", "El XML no contiene RFC receptor."),
    usoCfdi: leerAtributo(receptor, "UsoCFDI"),
    total: requerirAtributo(comprobante, "Total", "El XML no contiene total."),
    formaPago: leerAtributo(comprobante, "FormaPago") || null,
    metodoPago: leerAtributo(comprobante, "MetodoPago") || null,
    noCertificado: requerirAtributo(comprobante, "NoCertificado", "El XML no contiene numero de certificado."),
    certificado,
    ...validezCertificado,
    sello: requerirAtributo(comprobante, "Sello", "El XML no contiene sello."),
    uuid: requerirAtributo(timbre, "UUID", "El XML no contiene UUID."),
    numeroCertificadoSat: requerirAtributo(
      timbre,
      "NoCertificadoSAT",
      "El XML no contiene numero de certificado SAT."
    ),
    fechaTimbrado: requerirAtributo(timbre, "FechaTimbrado", "El XML no contiene fecha de timbrado."),
    rfcPac: requerirAtributo(timbre, "RfcProvCertif", "El XML no contiene RFC del PAC."),
  };
}

export function crearInformacionCfdi(datos: DatosCfdi): FilaInformacionCfdi[] {
  return [
    crearFila("fecha_emision", datos.fechaEmision),
    crearFila("rfc_emisor", datos.rfcEmisor),
    crearFila("rfc_receptor", datos.rfcReceptor),
    crearFila("uso_cfdi", datos.usoCfdi),
    crearFila("total", datos.total),
    crearFila("forma_pago", datos.formaPago),
    crearFila("metodo_pago", datos.metodoPago),
    crearFila("no_certificado", datos.noCertificado),
    crearFila("certificado", datos.certificado),
    crearFila("sello", datos.sello),
    crearFila("validez_certificado", datos.validezCertificado, datos.certificadoLeidoCorrectamente),
    crearFila("lco", "Validacion LCO pendiente: requiere consultar o cargar la lista LCO del SAT."),
  ];
}
