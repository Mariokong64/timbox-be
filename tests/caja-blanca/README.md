# Pruebas automatizadas de caja blanca PCB-009 a PCB-016

Las pruebas se ejecutan desde la carpeta raíz de `timbox-be`.

```powershell
pnpm test
```

Para ejecutar las pruebas y generar el reporte de cobertura:

```powershell
pnpm test:coverage
```

El reporte HTML queda en `coverage/index.html`. Las dependencias externas se sustituyen con mocks, por lo que no se requiere iniciar el servidor, conectarse a la base de datos ni ejecutar Ollama.

Para obtener una evidencia individual se puede ejecutar, por ejemplo:

```powershell
pnpm exec vitest run tests/caja-blanca/pcb-009-solicitud-url.test.ts
```
