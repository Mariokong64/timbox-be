import { env } from "../../../config/env";
import { obtenerContextoChatbot } from "./chatbot.context";
import { ChatbotError } from "./chatbot.error";
import { consultarOllama } from "./ollama.provider";
import { ChatbotRequest, ChatbotResponse } from "./chatbot.types";

export async function responderMensajeChatbot(
  datos: ChatbotRequest
): Promise<ChatbotResponse> {
  const mensaje =
    typeof datos.mensaje === "string" ? datos.mensaje.trim() : "";

  if (!mensaje) {
    throw new ChatbotError("Escribe un mensaje.", 400);
  }

  if (mensaje.length > env.chatbot.maxMessageLength) {
    throw new ChatbotError(
      `El mensaje no debe superar ${env.chatbot.maxMessageLength} caracteres.`,
      400
    );
  }

  const contexto = await obtenerContextoChatbot();

  return consultarOllama(mensaje, contexto);
}
