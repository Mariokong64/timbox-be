import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  obtenerContextoChatbot: vi.fn(),
  consultarOllama: vi.fn(),
}));

vi.mock("../../src/modules/chat/chatbot/chatbot.context", () => ({
  obtenerContextoChatbot: serviceMocks.obtenerContextoChatbot,
}));
vi.mock("../../src/modules/chat/chatbot/ollama.provider", () => ({
  consultarOllama: serviceMocks.consultarOllama,
}));

import { env } from "../../src/config/env";
import { responderMensajeChatbot } from "../../src/modules/chat/chatbot/chatbot.service";

describe("PCB-010 - Validación y respuesta del chatbot", () => {
  beforeEach(() => {
    serviceMocks.obtenerContextoChatbot.mockReset();
    serviceMocks.consultarOllama.mockReset();
  });

  it("rechaza un mensaje vacío", async () => {
    await expect(responderMensajeChatbot({ mensaje: "   " })).rejects.toMatchObject({
      message: "Escribe un mensaje.",
      statusCode: 400,
    });
  });

  it("rechaza un mensaje que supera el límite", async () => {
    await expect(
      responderMensajeChatbot({ mensaje: "M".repeat(env.chatbot.maxMessageLength + 1) })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("consulta el contexto y devuelve la respuesta de Ollama", async () => {
    const respuesta = { respuesta: "Puedes validar tu CFDI en el portal.", modelo: "modelo-prueba" };
    serviceMocks.obtenerContextoChatbot.mockResolvedValue("Contexto de TIMBOX");
    serviceMocks.consultarOllama.mockResolvedValue(respuesta);

    await expect(responderMensajeChatbot({ mensaje: "  ¿Cómo valido mi CFDI?  " })).resolves.toEqual(
      respuesta
    );
    expect(serviceMocks.consultarOllama).toHaveBeenCalledWith(
      "¿Cómo valido mi CFDI?",
      "Contexto de TIMBOX"
    );
  });
});
