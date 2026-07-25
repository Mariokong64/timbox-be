import { readFile, stat } from "node:fs/promises";
import { env } from "../../../config/env";
import { ChatbotError } from "./chatbot.error";

interface ContextoCache {
  contenido: string;
  fechaModificacionMs: number;
}

let cache: ContextoCache | null = null;

export async function obtenerContextoChatbot(): Promise<string> {
  const ruta = env.chatbot.contextFile.trim();

  if (!ruta) {
    throw new ChatbotError(
      "El archivo de contexto del chatbot no está configurado.",
      503
    );
  }

  try {
    const informacionArchivo = await stat(ruta);

    if (cache?.fechaModificacionMs === informacionArchivo.mtimeMs) {
      return cache.contenido;
    }

    const contenido = (await readFile(ruta, "utf8")).trim();

    if (!contenido) {
      throw new ChatbotError(
        "El archivo de contexto del chatbot está vacío.",
        503
      );
    }

    cache = {
      contenido,
      fechaModificacionMs: informacionArchivo.mtimeMs,
    };

    return contenido;
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
