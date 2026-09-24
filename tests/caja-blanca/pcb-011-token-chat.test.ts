import { describe, expect, it } from "vitest";

import { obtenerTokenChatPersona } from "../../src/modules/chat/chatPersona/chatPersona.service";

describe("PCB-011 - Token de sesión del chat", () => {
  it("rechaza un token ausente", () => {
    expect(() => obtenerTokenChatPersona(undefined)).toThrow("La sesión del chat no es válida.");
  });

  it("rechaza un token menor de 32 caracteres", () => {
    expect(() => obtenerTokenChatPersona("a".repeat(31))).toThrow(
      "La sesión del chat no es válida."
    );
  });

  it("rechaza un token mayor de 200 caracteres", () => {
    expect(() => obtenerTokenChatPersona("a".repeat(201))).toThrow(
      "La sesión del chat no es válida."
    );
  });

  it("devuelve un token de texto válido sin espacios exteriores", () => {
    const token = "a".repeat(32);
    expect(obtenerTokenChatPersona(`  ${token}  `)).toBe(token);
  });

  it("toma y normaliza el primer token cuando recibe un arreglo", () => {
    const token = "b".repeat(40);
    expect(obtenerTokenChatPersona([` ${token} `, "ignorado"])).toBe(token);
  });
});
