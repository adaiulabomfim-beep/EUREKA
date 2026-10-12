export interface CenarioHistorico {
  id: string;
  timestamp: number;
  dataHora: string;
  modulo: 'corpos-imersos' | 'barragens' | 'comportas' | string;
  moduloNome: string;
  titulo: string;
  parametros: Record<string, string | number>;
  resultados: {
    empuxo: number;
    empuxoFormatado: string;
    peso?: number;
    pesoFormatado?: string;
    centroPressao?: string | number;
    volumeDeslocado?: string | number;
    alturaSubmersa?: string | number;
    segurancaOuStatus?: string;
    detalhesExtras?: Record<string, string | number>;
  };
}
