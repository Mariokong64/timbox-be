export function validarSeguridadContrasena(
  contrasena: string,
  nombre = "La contraseña"
): string {
  if (contrasena.length < 8) {
    return `${nombre} debe tener al menos 8 caracteres.`;
  }

  if (contrasena.length > 150) {
    return `${nombre} no debe superar 150 caracteres.`;
  }

  const tieneMayuscula = /\p{Lu}/u.test(contrasena);
  const tieneMinuscula = /\p{Ll}/u.test(contrasena);
  const tieneNumero = /\p{N}/u.test(contrasena);
  const tieneCaracterEspecial = /[\p{P}\p{S}]/u.test(contrasena);

  if (!tieneMayuscula || !tieneMinuscula || !tieneNumero || !tieneCaracterEspecial) {
    return `${nombre} debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial.`;
  }

  return "";
}
