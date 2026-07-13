import bcrypt from "bcrypt";

const RONDAS_BCRYPT = 10;

function escaparSql(valor: string): string {
  return valor.replace(/'/g, "''");
}

async function main() {
  const argumentos = process.argv.slice(2);
  const [contrasena, usuario] = argumentos[0] === "--" ? argumentos.slice(1) : argumentos;

  if (!contrasena) {
    console.log('Uso: pnpm run hash:contrasena -- "NuevaContrasena" "usuarioOpcional"');
    process.exit(1);
  }

  const hash = await bcrypt.hash(contrasena, RONDAS_BCRYPT);

  console.log("\nHash bcrypt generado:\n");
  console.log(hash);

  if (usuario) {
    console.log("\nSQL sugerido para actualizar el usuario:\n");
    console.log(
      `UPDATE sys.usuarios
SET contrasena = '${escaparSql(hash)}',
    modificado = CURRENT_TIMESTAMP
WHERE usuario = '${escaparSql(usuario)}';`
    );
  }
}

main().catch((error: unknown) => {
  console.error("No se pudo generar el hash de la contraseña.", error);
  process.exit(1);
});
