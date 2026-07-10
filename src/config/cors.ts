import cors, { CorsOptions } from "cors";
import { env } from "./env";

const originsPermitidos = env.frontendUrl
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const opcionesCors: CorsOptions = {
  origin: originsPermitidos.length > 0 ? originsPermitidos : true,
};

export const corsMiddleware = cors(opcionesCors);
