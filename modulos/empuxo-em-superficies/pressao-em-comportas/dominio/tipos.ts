export enum FormaComporta {
  RETANGULAR = 'RETANGULAR',
  CIRCULAR = 'CIRCULAR',
  SEMI_CIRCULAR = 'SEMI_CIRCULAR',
}

export enum PosicaoDobradica {
  NONE = 'NONE',
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
}

// --- Biblioteca de Fluidos ---

export interface FluidoInfo {
  nome: string;
  densidade: number;       // kg/m³
  corPrimaria: string;     // cor SVG hex (topo do gradiente)
  corSecundaria: string;   // cor SVG hex (base do gradiente)
  corSuperficie: string;   // cor da superfície/ondas
}

export const FLUIDOS_PREDEFINIDOS: Record<string, FluidoInfo> = {
  agua: {
    nome: 'Água',
    densidade: 1000,
    corPrimaria: '#3b82f6',
    corSecundaria: '#2563eb',
    corSuperficie: '#60a5fa',
  },
  glicerina: {
    nome: 'Glicerina',
    densidade: 1260,
    corPrimaria: '#a78bfa',
    corSecundaria: '#7c3aed',
    corSuperficie: '#c4b5fd',
  },
  oleoSAE30: {
    nome: 'Óleo SAE 30',
    densidade: 891,
    corPrimaria: '#f59e0b',
    corSecundaria: '#d97706',
    corSuperficie: '#fbbf24',
  },
  mercurio: {
    nome: 'Mercúrio',
    densidade: 13600,
    corPrimaria: '#94a3b8',
    corSecundaria: '#475569',
    corSuperficie: '#cbd5e1',
  },
  gasolina: {
    nome: 'Gasolina',
    densidade: 680,
    corPrimaria: '#fb923c',
    corSecundaria: '#ea580c',
    corSuperficie: '#fdba74',
  },
  personalizado: {
    nome: 'Personalizado',
    densidade: 1000,
    corPrimaria: '#6b7280',
    corSecundaria: '#374151',
    corSuperficie: '#9ca3af',
  },
};
