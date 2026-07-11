export interface DatosCfdi {
  fechaEmision: string;
  rfcEmisor: string;
  rfcReceptor: string;
  usoCfdi: string;
  total: string;
  formaPago: string | null;
  metodoPago: string | null;
  noCertificado: string;
  certificado: string;
  validezCertificado: string;
  certificadoLeidoCorrectamente: boolean;
  sello: string;
  uuid: string;
  numeroCertificadoSat: string;
  fechaTimbrado: string;
  rfcPac: string;
}

export interface ResultadoConsultaSat {
  codigoEstatus: string;
  estado: string;
  esCancelable?: string;
  estatusCancelacion?: string;
  validacionEfos?: string;
}

export interface FilaInformacionCfdi {
  atributo: string;
  valor: string;
  estatus?: boolean;
}

export interface ResultadoValidacionCfdi {
  valido: boolean;
  titulo: string;
  consultaSat: string;
  uuid: string;
  numeroCertificadoSat: string;
  fechaTimbrado: string;
  rfcPac: string;
  informacionCfdi: FilaInformacionCfdi[];
  errores: Array<{
    error: string;
    mensaje: string;
  }>;
}
