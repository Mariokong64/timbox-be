import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  cerrarSolicitudContacto: vi.fn(),
  guardarRespuestaSolicitudContacto: vi.fn(),
  listarSolicitudesContacto: vi.fn(),
  obtenerSolicitudContactoPorId: vi.fn(),
}));

vi.mock("../../src/modules/contacto/sitioPrivado/solicitudes.repositorio", () => repositoryMocks);
vi.mock("../../src/shared/correo/correo.service", () => ({ enviarCorreo: vi.fn() }));

import { cerrarSolicitud } from "../../src/modules/contacto/sitioPrivado/solicitudes.servicio";

const solicitudId = "123e4567-e89b-42d3-a456-426614174000";

describe("PCB-016 - Cierre de solicitud de contacto", () => {
  beforeEach(() => repositoryMocks.cerrarSolicitudContacto.mockReset());

  it("rechaza un identificador que no es UUID", async () => {
    await expect(cerrarSolicitud("id-invalido")).rejects.toThrow("La solicitud no es válida.");
    expect(repositoryMocks.cerrarSolicitudContacto).not.toHaveBeenCalled();
  });

  it("rechaza una solicitud inexistente", async () => {
    repositoryMocks.cerrarSolicitudContacto.mockResolvedValue("no_existe");
    await expect(cerrarSolicitud(solicitudId)).rejects.toThrow(
      "La solicitud de contacto no existe."
    );
  });

  it("rechaza una solicitud que ya estaba cerrada", async () => {
    repositoryMocks.cerrarSolicitudContacto.mockResolvedValue("ya_cerrada");
    await expect(cerrarSolicitud(solicitudId)).rejects.toThrow(
      "La solicitud de contacto ya está cerrada."
    );
  });

  it("finaliza correctamente una solicitud abierta", async () => {
    repositoryMocks.cerrarSolicitudContacto.mockResolvedValue("cerrada");
    await expect(cerrarSolicitud(solicitudId)).resolves.toBeUndefined();
  });
});
