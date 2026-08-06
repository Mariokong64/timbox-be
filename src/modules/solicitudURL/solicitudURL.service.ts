import { obtenerURLActivaPorClave } from "./solicitudURL.repository";

const claveRegex = /^[a-z0-9][a-z0-9._-]{0,99}$/;

function normalizarClave(valor: unknown): string | null {
  if (typeof valor !== "string") {
    return null;
  }

  const clave = valor.trim().toLowerCase();
  return claveRegex.test(clave) ? clave : null;
}

function validarURL(valor: string | null): string | null {
  if (!valor) {
    return null;
  }

  try {
    const url = new URL(valor);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function solicitarURLService(claveValor: unknown): Promise<string | null> {
  const clave = normalizarClave(claveValor);

  if (!clave) {
    return null;
  }

  return validarURL(await obtenerURLActivaPorClave(clave));
}
