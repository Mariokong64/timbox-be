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

import { listarConversacionesService } from "../../src/modules/chat/chatPersona/chatPersona.service";

describe("PCB-014 - Listado de conversaciones por estado", () => {
  beforeEach(() => {
    repositoryMocks.listarConversacionesRepositorio.mockReset();
    repositoryMocks.listarConversacionesRepositorio.mockResolvedValue([]);
  });

  it("usa el filtro todas cuando el valor no es una cadena", async () => {
    await expect(listarConversacionesService(undefined)).resolves.toEqual([]);
    expect(repositoryMocks.listarConversacionesRepositorio).toHaveBeenCalledWith("todas");
  });

  it("usa el filtro todas cuando recibe una cadena vacía", async () => {
    await listarConversacionesService("   ");
    expect(repositoryMocks.listarConversacionesRepositorio).toHaveBeenCalledWith("todas");
  });

  it("normaliza y consulta un filtro válido", async () => {
    await listarConversacionesService("  CERRADA  ");
    expect(repositoryMocks.listarConversacionesRepositorio).toHaveBeenCalledWith("cerrada");
  });

  it("rechaza un filtro que no pertenece al catálogo", async () => {
    await expect(listarConversacionesService("desconocida")).rejects.toMatchObject({
      message: "El filtro de estado no es válido.",
      statusCode: 400,
    });
  });
});
