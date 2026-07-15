import { obtenerResumenDashboard } from "./dashboard.repository";
import { ResumenDashboard } from "./dashboard.types";

export async function obtenerResumenDashboardService(): Promise<ResumenDashboard> {
  return obtenerResumenDashboard();
}
