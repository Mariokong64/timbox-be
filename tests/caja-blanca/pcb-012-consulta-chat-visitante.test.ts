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

import { obtenerConversacionVisitanteService } from "../../src/modules/chat/chatPersona/chatPersona.service";

const token = "token-de-prueba-con-longitud-suficiente-1234567890";
const conversacion = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  nombreVisitante: "Mario López",
  correoVisitante: "mario@example.com",
  telefonoVisitante: null,
  estatus: "Activo",
  fechaInicio: "2026-09-10T12:00:00.000Z",
  fechaFin: null,
  fechaUltimaActividad: "2026-09-10T12:00:00.000Z",
  estadoAtencion: "por_atender" as const,
  cantidadMensajes: 1,
  ultimaFechaMensajeVisitante: "2026-09-10T12:00:00.000Z",
  eliminablePorInactividad: false,
  mensajes: [],
};

describe("PCB-012 - Consulta de conversación del visitante", () => {
  beforeEach(() => repositoryMocks.obtenerConversacionPorTokenHash.mockReset());

  it("rechaza una conversación inexistente o expirada", async () => {
    repositoryMocks.obtenerConversacionPorTokenHash.mockResolvedValue(null);
    await expect(obtenerConversacionVisitanteService(token)).rejects.toMatchObject({
      message: "La conversación no existe o la sesión expiró.",
      statusCode: 404,
    });
  });

  it("devuelve la conversación encontrada mediante el hash del token", async () => {
    repositoryMocks.obtenerConversacionPorTokenHash.mockResolvedValue(conversacion);
    await expect(obtenerConversacionVisitanteService(token)).resolves.toEqual(conversacion);
    expect(repositoryMocks.obtenerConversacionPorTokenHash).toHaveBeenCalledWith(
      createHash("sha256").update(token).digest("hex")
    );
  });
});
