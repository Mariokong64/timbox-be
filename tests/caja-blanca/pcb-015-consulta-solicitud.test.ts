import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  cerrarSolicitudContacto: vi.fn(),
  guardarRespuestaSolicitudContacto: vi.fn(),
  listarSolicitudesContacto: vi.fn(),
  obtenerSolicitudContactoPorId: vi.fn(),
}));

vi.mock("../../src/modules/contacto/sitioPrivado/solicitudes.repositorio", () => repositoryMocks);
vi.mock("../../src/shared/correo/correo.service", () => ({ enviarCorreo: vi.fn() }));

import { obtenerSolicitud } from "../../src/modules/contacto/sitioPrivado/solicitudes.servicio";

const solicitudId = "123e4567-e89b-42d3-a456-426614174000";
const solicitud = {
  id: solicitudId,
  nombre: "Mario López",
  correo: "mario@example.com",
  telefono: "5512345678",
  rfc: "XAXX010101000",
  mensaje: "Solicito información.",
  estatus: "Activo",
  estadoAtencion: "por_atender" as const,
  fechaRegistro: "2026-09-10T12:00:00.000Z",
  respuestas: [],
};

describe("PCB-015 - Consulta de solicitud de contacto", () => {
  beforeEach(() => repositoryMocks.obtenerSolicitudContactoPorId.mockReset());

  it("rechaza un identificador que no es UUID", async () => {
    await expect(obtenerSolicitud("id-invalido")).rejects.toThrow("La solicitud no es válida.");
    expect(repositoryMocks.obtenerSolicitudContactoPorId).not.toHaveBeenCalled();
  });

  it("rechaza una solicitud inexistente", async () => {
    repositoryMocks.obtenerSolicitudContactoPorId.mockResolvedValue(null);
    await expect(obtenerSolicitud(solicitudId)).rejects.toThrow(
      "La solicitud de contacto no existe."
    );
  });

  it("devuelve la solicitud encontrada", async () => {
    repositoryMocks.obtenerSolicitudContactoPorId.mockResolvedValue(solicitud);
    await expect(obtenerSolicitud(solicitudId)).resolves.toEqual(solicitud);
  });
});
