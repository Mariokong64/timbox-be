import { XMLParser } from "fast-xml-parser";
import { DatosCfdi, ResultadoConsultaSat } from "./validador.types";

const URL_CONSULTA_SAT = "https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc";
const SOAP_ACTION = "http://tempuri.org/IConsultaCFDIService/Consulta";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
  removeNSPrefix: true,
});

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function buscarNodo(origen: unknown, nombre: string): Record<string, unknown> | null {
  if (!esObjeto(origen)) {
    return null;
  }

  for (const [llave, valor] of Object.entries(origen)) {
    if (llave === nombre && esObjeto(valor)) {
      return valor;
    }

    const encontrado = buscarNodo(valor, nombre);

    if (encontrado) {
      return encontrado;
    }
  }

  return null;
}

function leerTexto(origen: Record<string, unknown>, nombre: string): string {
  const valor = origen[nombre];

  if (typeof valor === "string" || typeof valor === "number" || typeof valor === "boolean") {
    return String(valor);
  }

  return "";
}

function crearExpresionImpresa(datos: DatosCfdi): string {
  const parametros = new URLSearchParams({
    re: datos.rfcEmisor,
    rr: datos.rfcReceptor,
    tt: datos.total,
    id: datos.uuid,
  });

  return `?${parametros.toString()}`;
}

function crearSobreSoap(expresionImpresa: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:Consulta>
      <tem:expresionImpresa><![CDATA[${expresionImpresa}]]></tem:expresionImpresa>
    </tem:Consulta>
  </soapenv:Body>
</soapenv:Envelope>`;
}

export async function consultarEstatusSat(datos: DatosCfdi): Promise<ResultadoConsultaSat> {
  const expresionImpresa = crearExpresionImpresa(datos);
  const respuesta = await fetch(URL_CONSULTA_SAT, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: SOAP_ACTION,
    },
    body: crearSobreSoap(expresionImpresa),
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo consultar el servicio del SAT.");
  }

  const xmlRespuesta = await respuesta.text();
  console.log("Respuesta SAT:", xmlRespuesta);
  const documento = parser.parse(xmlRespuesta);
  const resultado = buscarNodo(documento, "ConsultaResult");

  if (!resultado) {
    throw new Error("El SAT regreso una respuesta inesperada.");
  }

  return {
    codigoEstatus: leerTexto(resultado, "CodigoEstatus"),
    estado: leerTexto(resultado, "Estado"),
    esCancelable: leerTexto(resultado, "EsCancelable"),
    estatusCancelacion: leerTexto(resultado, "EstatusCancelacion"),
    validacionEfos: leerTexto(resultado, "ValidacionEFOS"),
  };
}
