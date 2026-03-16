import { Material, Fluid } from './tipos';

export const MATERIALS: Material[] = [
  { name: 'Isopor', density: 30, color: '#f8fafc' },
  { name: 'Madeira (Pinho)', density: 500, color: '#d97706' },
  { name: 'Madeira (Carvalho)', density: 750, color: '#a16207' },
  { name: 'Gelo', density: 917, color: '#bfdbfe' },
  { name: 'Plástico (PVC)', density: 1380, color: '#0ea5e9' },
  { name: 'Concreto', density: 2400, color: '#57534e' },
  { name: 'Alumínio', density: 2700, color: '#94a3b8' },
  { name: 'Ferro', density: 7870, color: '#3f3f46' },
  { name: 'Cobre', density: 8960, color: '#b45309' },
  { name: 'Chumbo', density: 11340, color: '#475569' },
  { name: 'Ouro', density: 19300, color: '#fbbf24' },
];

export const FLUIDS: Fluid[] = [
  { name: 'Ar', density: 1.225, color: '#f1f5f9' },
  { name: 'Gasolina', density: 719, color: '#fef08a' },
  { name: 'Álcool (Etanol)', density: 789, color: '#fed7aa' },
  { name: 'Óleo de Soja', density: 920, color: '#fcd34d' },
  { name: 'Água Doce', density: 1000, color: '#3b82f6' },
  { name: 'Água do Mar', density: 1025, color: '#2563eb' },
  { name: 'Glicerina', density: 1260, color: '#e2e8f0' },
  { name: 'Mel', density: 1420, color: '#fbbf24' },
  { name: 'Mercúrio', density: 13534, color: '#94a3b8' },
];
