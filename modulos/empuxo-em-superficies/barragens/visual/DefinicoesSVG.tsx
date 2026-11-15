import React from 'react';
import { DefinicoesSVGComum } from '../../visual-compartilhado/DefinicoesSVGComum';
import { CORES_MATERIAIS } from '../../visual-compartilhado/identidadeVisual';

export const DefinicoesSVG: React.FC<{ pan?: { x: number; y: number } }> = ({ pan = { x: 0, y: 0 } }) => {
  const trans = `translate(${pan.x}, ${pan.y})`;
  return (
  <defs>
    <DefinicoesSVGComum pan={pan} />

    {/* Setas coloridas para vetores específicos */}
    <marker id="arrow-blue" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
      <path d="M0,0 L6,2 L0,4 Z" fill="#2563eb" />
    </marker>
    <marker id="arrow-teal" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
      <path d="M0,0 L6,2 L0,4 Z" fill="#0d9488" />
    </marker>
    <marker id="arrow-orange" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
      <path d="M0,0 L6,2 L0,4 Z" fill="#ea580c" />
    </marker>
    <marker id="arrow-amber" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
      <path d="M0,0 L6,2 L0,4 Z" fill="#b45309" />
    </marker>

    {/* Água */}
    <linearGradient id="fluidDepthA" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={CORES_MATERIAIS.aguaPrimaria} stopOpacity="0.45" />
      <stop offset="100%" stopColor={CORES_MATERIAIS.aguaSecundaria} stopOpacity="0.85" />
    </linearGradient>

    <linearGradient id="fluidDepthB" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={CORES_MATERIAIS.aguaSecundaria} stopOpacity="0.55" />
      <stop offset="100%" stopColor={CORES_MATERIAIS.aguaProfunda} stopOpacity="0.95" />
    </linearGradient>

    <linearGradient id="surfaceGradientA" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={CORES_MATERIAIS.aguaSuperficie} stopOpacity="0.55" />
      <stop offset="100%" stopColor={CORES_MATERIAIS.aguaPrimaria} stopOpacity="0.8" />
    </linearGradient>

    <linearGradient id="surfaceGradientB" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={CORES_MATERIAIS.aguaPrimaria} stopOpacity="0.5" />
      <stop offset="100%" stopColor={CORES_MATERIAIS.aguaSecundaria} stopOpacity="0.8" />
    </linearGradient>
    {/* Camada de Lama / Sedimentos no Fundo */}
    <pattern id="mudPattern" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform={trans}>
      <rect width="24" height="24" fill="#92400e" fillOpacity="0.88" />
      <circle cx="4" cy="6" r="0.9" fill="#451a03" opacity="0.55" />
      <circle cx="15" cy="4" r="0.7" fill="#fef3c7" opacity="0.2" />
      <circle cx="11" cy="14" r="1.1" fill="#451a03" opacity="0.5" />
      <circle cx="20" cy="17" r="0.8" fill="#451a03" opacity="0.45" />
      <circle cx="6" cy="20" r="0.7" fill="#fef3c7" opacity="0.18" />
      <path d="M0,12 Q6,10 12,12 T24,12" stroke="#78350f" strokeWidth="0.8" fill="none" opacity="0.4" />
    </pattern>
  </defs>
  );
};