import { verificarCaptcha } from "../../shared/services/recaptcha.service";
import { crearSolicitudContacto } from "./contacto.repository";
import { ContactoDatosLimpios, ContactoRequest, SolicitudContactoCreada } from "./contacto.types";

const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const telefonoRegex = /^[0-9\s()+-]{8,20}$/;
const rfcRegex = /^([A-ZÑ&]{3,4})(\d{6})([A-Z0-9]{3})?$/i;

function limpiarTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function validarContacto(datos: ContactoRequest): ContactoDatosLimpios {
  const nombre = limpiarTexto(datos.nombre);
  const correo = limpiarTexto(datos.correo).toLowerCase();
  const telefono = limpiarTexto(datos.telefono);
  const rfc = limpiarTexto(datos.rfc).toUpperCase();
  const mensaje = limpiarTexto(datos.mensaje);

  if (!nombre) {
    throw new Error("Ingresa tu nombre.");
  }

  if (nombre.length > 150) {
    throw new Error("El nombre no debe superar 150 caracteres.");
  }

  if (!correo || !correoRegex.test(correo)) {
    throw new Error("Ingresa un correo valido.");
  }

  if (correo.length > 150) {
    throw new Error("El correo no debe superar 150 caracteres.");
  }

  if (telefono && !telefonoRegex.test(telefono)) {
    throw new Error("Ingresa un telefono valido.");
  }

  if (rfc && !rfcRegex.test(rfc)) {
    throw new Error("Ingresa un RFC valido.");
  }

  if (!mensaje) {
    throw new Error("Escribe un mensaje.");
  }

  if (mensaje.length > 2000) {
    throw new Error("El mensaje no debe superar 2000 caracteres.");
  }

  return {
    nombre,
    correo,
    telefono: telefono || null,
    rfc: rfc || null,
    mensaje,
  };
}

export async function registrarContactoService(
  datos: ContactoRequest
): Promise<SolicitudContactoCreada> {
  const datosLimpios = validarContacto(datos);

  await verificarCaptcha(datos.captchaToken);

  return crearSolicitudContacto(datosLimpios);
}
