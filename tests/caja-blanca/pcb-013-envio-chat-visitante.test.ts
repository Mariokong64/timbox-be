import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  agregarMensajeAgente: vi.fn(),
  agregarMensajeVisitante: vi.fn(),
  crearConversacionRepositorio: vi.fn(),
  eliminarConversacionInactivaRepositorio: vi.fn(),
  finalizarConversacionRepositorio: vi.fn(),
  listarConversacionesRepositorio: vi.fn(),
  obtenerConversacionPorId: vi.fn(),
  obtenerConversacionPorTokenHash: vi.fn(),
}));

vi.mock("../../src/modules/chat/chatPersona/chatPersona.repository", () => repositoryMocks);

import { env } from "../../src/config/env";
import { enviarMensajeVisitanteService } from "../../src/modules/chat/chatPersona/chatPersona.service";

const token = "token-de-prueba-con-longitud-suficiente-1234567890";
const mensajeGuardado = {
  id: "223e4567-e89b-42d3-a456-426614174000",
  contenido: "Necesito ayuda con mi CFDI.",
  remitente: "visitante" as const,
  nombreRemitente: "Mario López",
  fechaRegistro: "2026-09-10T12:00:00.000Z",
};

describe("PCB-013 - Envío de mensaje del visitante", () => {
  beforeEach(() => repositoryMocks.agregarMensajeVisitante.mockReset());

  it("rechaza un mensaje vacío", async () => {
    await expect(enviarMensajeVisitanteService(token, { contenido: "   " })).rejects.toMatchObject({
      message: "Escribe un mensaje.",
      statusCode: 400,
    });
  });

  it("rechaza un mensaje que supera el límite", async () => {
    await expect(
      enviarMensajeVisitanteService(token, {
        contenido: "M".repeat(env.chatPersona.maxMessageLength + 1),
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rechaza el envío cuando la conversación terminó o expiró", async () => {
    repositoryMocks.agregarMensajeVisitante.mockResolvedValue(null);
    await expect(
      enviarMensajeVisitanteService(token, { contenido: "Necesito ayuda" })
    ).rejects.toMatchObject({
      message: "La conversación terminó o la sesión expiró.",
      statusCode: 409,
    });
  });

  it("guarda y devuelve un mensaje válido", async () => {
    repositoryMocks.agregarMensajeVisitante.mockResolvedValue(mensajeGuardado);
    await expect(
      enviarMensajeVisitanteService(token, { contenido: "  Necesito ayuda con mi CFDI.  " })
    ).resolves.toEqual(mensajeGuardado);
    expect(repositoryMocks.agregarMensajeVisitante).toHaveBeenCalledWith(
      createHash("sha256").update(token).digest("hex"),
      "Necesito ayuda con mi CFDI."
    );
  });
});
