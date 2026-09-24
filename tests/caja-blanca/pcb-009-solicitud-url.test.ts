import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  obtenerURLActivaPorClave: vi.fn(),
}));

vi.mock("../../src/modules/solicitudURL/solicitudURL.repository", () => repositoryMocks);

import { solicitarURLService } from "../../src/modules/solicitudURL/solicitudURL.service";

describe("PCB-009 - Solicitud de URL pública", () => {
  beforeEach(() => repositoryMocks.obtenerURLActivaPorClave.mockReset());

  it("devuelve null cuando la clave no es una cadena", async () => {
    await expect(solicitarURLService(123)).resolves.toBeNull();
    expect(repositoryMocks.obtenerURLActivaPorClave).not.toHaveBeenCalled();
  });

  it("devuelve null cuando la clave no cumple el formato permitido", async () => {
    await expect(solicitarURLService("clave con espacios")).resolves.toBeNull();
    expect(repositoryMocks.obtenerURLActivaPorClave).not.toHaveBeenCalled();
  });

  it("devuelve null cuando no existe una URL activa", async () => {
    repositoryMocks.obtenerURLActivaPorClave.mockResolvedValue(null);
    await expect(solicitarURLService("validador")).resolves.toBeNull();
  });

  it("devuelve null cuando el repositorio entrega una URL ilegible", async () => {
    repositoryMocks.obtenerURLActivaPorClave.mockResolvedValue("no-es-url");
    await expect(solicitarURLService("validador")).resolves.toBeNull();
  });

  it("devuelve null cuando el protocolo no es HTTP o HTTPS", async () => {
    repositoryMocks.obtenerURLActivaPorClave.mockResolvedValue("ftp://example.com/recurso");
    await expect(solicitarURLService("validador")).resolves.toBeNull();
  });

  it("normaliza la clave y devuelve una URL HTTPS válida", async () => {
    repositoryMocks.obtenerURLActivaPorClave.mockResolvedValue("https://timbox.example/validador");

    await expect(solicitarURLService("  Validador.XML  ")).resolves.toBe(
      "https://timbox.example/validador"
    );
    expect(repositoryMocks.obtenerURLActivaPorClave).toHaveBeenCalledWith("validador.xml");
  });
});
