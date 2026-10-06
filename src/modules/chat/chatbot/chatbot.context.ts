import { readFile, stat } from "node:fs/promises";
import { env } from "../../../config/env";
import { ChatbotError } from "./chatbot.error";

interface RegistroContexto {
  contenido: string;
  tokens: Set<string>;
  tokensClave: Set<string>;
}

interface ContextoCache {
  fechaModificacionMs: number;
  registros: RegistroContexto[];
}

interface RegistroPuntuado {
  registro: RegistroContexto;
  puntuacion: number;
}

const INICIO_REGISTRO =
  /^\[(FACT|FAQ|ROUTE|PLAN|METHOD|QA|CONFLICT|UNVERIFIED|INDEX)\b[^\]]*\]$/;

const PALABRAS_VACIAS = new Set([
  "a",
  "al",
  "algo",
  "como",
  "con",
  "cada",
  "cual",
  "cuales",
  "cuanto",
  "de",
  "del",
  "el",
  "en",
  "es",
  "esta",
  "estan",
  "esto",
  "hay",
  "la",
  "las",
  "lo",
  "los",
  "me",
  "mi",
  "para",
  "por",
  "puede",
  "pueden",
  "que",
  "se",
  "si",
  "su",
  "sus",
  "tienen",
  "tiene",
  "un",
  "una",
  "y",
]);

const GRUPOS_SINONIMOS = [
  [
    "precio",
    "precios",
    "costo",
    "costos",
    "cuesta",
    "tarifa",
    "tarifas",
    "cotizacion",
    "cotizar",
  ],
  ["vigencia", "vence", "vencen", "vencimiento", "caduca", "expira"],
  ["integrar", "integracion", "conectar", "conexion", "implementar"],
  ["error", "falla", "problema", "incidente", "rechazo"],
  ["cancelar", "cancelacion", "cancelo", "cancelado"],
  ["timbrar", "timbrado", "certificar", "certificacion"],
  ["lenguaje", "lenguajes", "codigo", "repositorio", "sdk", "dll"],
  ["multiempresa", "multirfc", "emisores", "rfcs"],
  ["gratis", "gratuito", "gratuita", "appgratis"],
  ["soporte", "ayuda", "contacto", "asesoria"],
  ["rest", "apirest", "api"],
];

const SINONIMOS = new Map<string, string[]>();

for (const grupo of GRUPOS_SINONIMOS) {
  for (const palabra of grupo) {
    SINONIMOS.set(palabra, grupo);
  }
}

let cache: ContextoCache | null = null;

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenizar(texto: string): Set<string> {
  const tokens = normalizar(texto)
    .split(/\s+/)
    .filter(
      (token) => token.length >= 3 && !PALABRAS_VACIAS.has(token)
    );

  return new Set(tokens);
}

function expandirTokens(tokens: Set<string>): Set<string> {
  const expandidos = new Set(tokens);

  for (const token of tokens) {
    for (const sinonimo of SINONIMOS.get(token) ?? []) {
      expandidos.add(sinonimo);
    }
  }

  return expandidos;
}

function extraerRegistros(contenido: string): RegistroContexto[] {
  const bloques: string[][] = [];
  let bloqueActual: string[] | null = null;

  for (const lineaOriginal of contenido.split(/\r?\n/)) {
    const linea = lineaOriginal.trimEnd();

    if (INICIO_REGISTRO.test(linea.trim())) {
      if (bloqueActual?.length) {
        bloques.push(bloqueActual);
      }

      bloqueActual = [linea.trim()];
      continue;
    }

    if (!bloqueActual || /^=+/.test(linea.trim())) {
      continue;
    }

    if (linea.trim()) {
      bloqueActual.push(linea);
    }
  }

  if (bloqueActual?.length) {
    bloques.push(bloqueActual);
  }

  return bloques.map((lineas) => {
    const contenidoRegistro = lineas.join("\n");
    const textoClave = lineas
      .filter((linea) =>
        /^(\[|ALIASES=|INTENTS=|Q=|CAPABILITIES=|AVAILABLE=|ACTION=)/.test(
          linea.trim()
        )
      )
      .join(" ");

    return {
      contenido: contenidoRegistro,
      tokens: tokenizar(contenidoRegistro),
      tokensClave: tokenizar(textoClave),
    };
  });
}

function puntuarRegistro(
  registro: RegistroContexto,
  tokensOriginales: Set<string>,
  tokensExpandidos: Set<string>
): number {
  let puntuacion = 0;

  for (const token of tokensOriginales) {
    if (registro.tokensClave.has(token)) {
      puntuacion += 8;
    } else if (registro.tokens.has(token)) {
      puntuacion += 3;
    }
  }

  for (const token of tokensExpandidos) {
    if (tokensOriginales.has(token)) {
      continue;
    }

    if (registro.tokensClave.has(token)) {
      puntuacion += 3;
    } else if (registro.tokens.has(token)) {
      puntuacion += 1;
    }
  }

  return puntuacion;
}

export function seleccionarContextoChatbot(
  registros: RegistroContexto[],
  mensaje: string
): string {
  const tokensOriginales = tokenizar(mensaje);

  if (!tokensOriginales.size) {
    return "SIN_RESULTADOS_RELEVANTES";
  }

  const tokensExpandidos = expandirTokens(tokensOriginales);
  const puntuados: RegistroPuntuado[] = registros
    .map((registro) => ({
      registro,
      puntuacion: puntuarRegistro(
        registro,
        tokensOriginales,
        tokensExpandidos
      ),
    }))
    .filter(({ puntuacion }) => puntuacion > 0)
    .sort((a, b) => b.puntuacion - a.puntuacion);

  const seleccionados: string[] = [];
  let caracteres = 0;

  for (const { registro } of puntuados) {
    if (seleccionados.length >= env.chatbot.contextMaxRecords) {
      break;
    }

    const longitudAdicional = registro.contenido.length + 2;

    if (
      seleccionados.length > 0 &&
      caracteres + longitudAdicional > env.chatbot.contextMaxChars
    ) {
      continue;
    }

    seleccionados.push(registro.contenido);
    caracteres += longitudAdicional;
  }

  return seleccionados.length
    ? seleccionados.join("\n\n")
    : "SIN_RESULTADOS_RELEVANTES";
}

export async function obtenerContextoChatbot(
  mensaje: string
): Promise<string> {
  const ruta = env.chatbot.contextFile.trim();

  if (!ruta) {
    throw new ChatbotError(
      "El archivo de contexto del chatbot no está configurado.",
      503
    );
  }

  try {
    const informacionArchivo = await stat(ruta);

    if (cache?.fechaModificacionMs !== informacionArchivo.mtimeMs) {
      const contenido = (await readFile(ruta, "utf8")).trim();

      if (!contenido) {
        throw new ChatbotError(
          "El archivo de contexto del chatbot está vacío.",
          503
        );
      }

      const registros = extraerRegistros(contenido);

      if (!registros.length) {
        throw new ChatbotError(
          "El archivo de contexto del chatbot no contiene registros válidos.",
          503
        );
      }

      cache = {
        fechaModificacionMs: informacionArchivo.mtimeMs,
        registros,
      };
    }

    return seleccionarContextoChatbot(cache.registros, mensaje);
  } catch (error: unknown) {
    if (error instanceof ChatbotError) {
      throw error;
    }

    throw new ChatbotError(
      "No fue posible leer el archivo de contexto del chatbot.",
      503
    );
  }
}
