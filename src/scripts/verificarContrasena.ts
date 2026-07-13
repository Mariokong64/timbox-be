import bcrypt from "bcrypt";

async function main() {
  const argumentos = process.argv.slice(2);
  const [contrasena, hash] = argumentos[0] === "--" ? argumentos.slice(1) : argumentos;

  if (!contrasena || !hash) {
    console.log('Uso: pnpm run verificar:contrasena -- "ContrasenaCandidata" "$2b$10$..."');
    process.exit(1);
  }

  const coincide = await bcrypt.compare(contrasena, hash);

  console.log(coincide ? "La contraseña coincide con el hash." : "La contraseña no coincide con el hash.");
}

main().catch((error: unknown) => {
  console.error("No se pudo verificar la contraseña.", error);
  process.exit(1);
});
