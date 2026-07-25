import { Request, Response } from "express";
import { ChatbotError } from "./chatbot.error";
import { responderMensajeChatbot } from "./chatbot.service";
import { ChatbotRequest } from "./chatbot.types";

export async function responderMensajeChatbotController(
  req: Request<unknown, unknown, ChatbotRequest>,
  res: Response
): Promise<Response> {
  try {
    const respuesta = await responderMensajeChatbot(req.body);

    return res.status(200).json({
      ok: true,
      data: respuesta,
    });
  } catch (error: unknown) {
    if (error instanceof ChatbotError) {
      return res.status(error.statusCode).json({
        ok: false,
        message: error.message,
      });
    }

    console.error("Error inesperado en chatbot:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}
