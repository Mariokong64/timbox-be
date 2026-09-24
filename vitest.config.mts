import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    clearMocks: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/.pnpm-store/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
      include: [
        "src/modules/solicitudURL/solicitudURL.service.ts",
        "src/modules/chat/chatbot/chatbot.service.ts",
        "src/modules/chat/chatPersona/chatPersona.service.ts",
        "src/modules/contacto/sitioPrivado/solicitudes.servicio.ts",
      ],
    },
  },
});
