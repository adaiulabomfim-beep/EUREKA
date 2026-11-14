/**
 * Identidade visual oficial compartilhada entre os módulos de superfícies (Barragens e Comportas).
 * Baseada integralmente no módulo de referência: Barragens.
 */

export const DIMENSOES_CENA_2D = {
  SVG_W: 900,
  SVG_H: 520,
} as const;

export const CORES_MATERIAIS = {
  // Concreto (2D)
  concretoFill: '#9ca3af',
  concretoPatternBase: '#a3a3a3',
  concretoAggregate: '#525252',
  concretoStroke: '#6b7280',
  concretoStrokeWidth: 1.2,
  concreto3DEdge: '#545e69',
  concretoHatch: 'url(#concretePattern)',

  // Solo / Fundação (2D)
  terraFill: '#977347',
  terraStroke: '#4a2a0e',
  terraStrokeWidth: 1.2,
  terraHatch: 'url(#earthPattern)',

  // Água padrão (2D & 3D)
  aguaPrimaria: '#3b82f6',
  aguaSecundaria: '#2563eb',
  aguaProfunda: '#1d4ed8',
  aguaSuperficie: '#60a5fa',
  aguaLinhaSuperficie: 'rgba(255,255,255,0.5)',

  // Cotas, Linhas Auxiliares e Símbolos Técnicos
  cotaLinha: '#64748b',
  cotaTexto: '#475569',
  cotaNivelStroke: '#475569',
  cotaNivelTexto: '#334155',
  anguloArco: '#334155',
  anguloTexto: '#1e293b',

  // Vetores e Pontos Notáveis
  vetorDistribuicaoMontante: '#2563eb',
  vetorDistribuicaoJusante: '#3b82f6',
  vetorResultante: '#2563eb',
  vetorResultantePonta: '#1e40af',
  vetorPillTexto: '#dc2626',
  vetorPillBorda: '#fecaca',
  pontoCGStroke: '#0f172a',
  pontoCP: '#ef4444',
  pontoCPTexto: '#b91c1c',
} as const;

export const ESTILOS_VETOR_3D = {
  pressureColor: '#2563eb',
  pressureEmissive: '#2563eb',
  pressureEmissiveIntensity: 0.8,
  resultantColor: '#ef4444',
  resultantEmissive: '#ef4444',
  resultantEmissiveIntensity: 1.2,
  markerColor: '#ef4444',
  markerEmissive: '#ffffff',
  markerEmissiveIntensity: 0.8,
} as const;
