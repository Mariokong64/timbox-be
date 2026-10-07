export interface MetricaDashboard {
  etiqueta: string;
  valor: number;
}

export interface SerieDiariaDashboard {
  fecha: string;
  total: number;
}

export interface ResumenContactoDashboard {
  total: number;
  atendidas: number;
  pendientes: number;
  porEstatus: MetricaDashboard[];
  porOrigen: MetricaDashboard[];
  porDia: SerieDiariaDashboard[];
}

export interface ResumenValidadorDashboard {
  total: number;
  vigentes: number;
  cancelados: number;
  noEncontrados: number;
  errores: number;
  porResultado: MetricaDashboard[];
  porDia: SerieDiariaDashboard[];
}

export interface ResumenDashboard {
  contacto: ResumenContactoDashboard;
  validador: ResumenValidadorDashboard;
}

export interface ResumenContactoRow {
  total: string | number;
  atendidas: string | number;
  pendientes: string | number;
}

export interface ResumenValidadorRow {
  total: string | number;
  vigentes: string | number;
  cancelados: string | number;
  no_encontrados: string | number;
  errores: string | number;
}

export interface MetricaDashboardRow {
  etiqueta: string;
  valor: string | number;
}

export interface SerieDiariaDashboardRow {
  fecha: string;
  total: string | number;
}
