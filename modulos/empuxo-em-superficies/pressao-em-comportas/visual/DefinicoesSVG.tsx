import React from 'react';
import { FLUIDOS_PREDEFINIDOS } from '../dominio/tipos';

interface DefinicoesSVGProps {
  pan?: { x: number; y: number };
  chaveMontante?: string;
  chaveJusante?: string;
}

export const DefinicoesSVG: React.FC<DefinicoesSVGProps> = ({ 
  pan = { x: 0, y: 0 },
  chaveMontante = 'agua',
  chaveJusante = 'agua',
}) => {
  const trans = `translate(${pan.x}, ${pan.y})`;
  const fm = FLUIDOS_PREDEFINIDOS[chaveMontante] || FLUIDOS_PREDEFINIDOS.agua;
  const fj = FLUIDOS_PREDEFINIDOS[chaveJusante] || FLUIDOS_PREDEFINIDOS.agua;

  return (
  <defs>
    {/* Sombra */}
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow
        dx="0"
        dy="4"
        stdDeviation="4"
        floodColor="#000"
        floodOpacity="0.2"
      />
    </filter>

    {/* Setas */}
    <marker
      id="arrow-red"
      markerWidth="6"
      markerHeight="4"
      refX="6"
      refY="2"
      orient="auto"
    >
      <path d="M0,0 L6,2 L0,4 Z" fill="#1e40af" />
    </marker>

    <marker
      id="arrow-green"
      markerWidth="6"
      markerHeight="4"
      refX="6"
      refY="2"
      orient="auto"
    >
      <path d="M0,0 L6,2 L0,4 Z" fill="#16a34a" />
    </marker>

    <marker
      id="arrow"
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
    </marker>

    {/* Vidro */}
    <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="white" stopOpacity="0.4" />
      <stop offset="50%" stopColor="white" stopOpacity="0.1" />
      <stop offset="100%" stopColor="white" stopOpacity="0.3" />
    </linearGradient>

    {/* Prisma / Diagrama Trapezoidal de Pressão Hidrostática */}
    <linearGradient id="pressurePrismGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
      <stop offset="50%" stopColor="#2563eb" stopOpacity="0.45" />
      <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.75" />
    </linearGradient>

    {/* ===== GRADIENTES DE FLUIDO DINÂMICOS ===== */}

    {/* Montante (fluid A) */}
    <linearGradient id="fluidDepthA" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={fm.corPrimaria} stopOpacity="0.45" />
      <stop offset="100%" stopColor={fm.corSecundaria} stopOpacity="0.85" />
    </linearGradient>

    {/* Jusante (fluid B) */}
    <linearGradient id="fluidDepthB" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={fj.corPrimaria} stopOpacity="0.55" />
      <stop offset="100%" stopColor={fj.corSecundaria} stopOpacity="0.95" />
    </linearGradient>

    <linearGradient id="surfaceGradientA" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={fm.corSuperficie} stopOpacity="0.55" />
      <stop offset="100%" stopColor={fm.corPrimaria} stopOpacity="0.8" />
    </linearGradient>

    <linearGradient id="surfaceGradientB" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={fj.corSuperficie} stopOpacity="0.5" />
      <stop offset="100%" stopColor={fj.corPrimaria} stopOpacity="0.8" />
    </linearGradient>

    {/* Ondas animadas */}
    <pattern id="ripplePattern" width="120" height="40" patternUnits="userSpaceOnUse">
      <animateTransform
        attributeName="patternTransform"
        type="translate"
        from="0 0"
        to="120 20"
        dur="8s"
        repeatCount="indefinite"
      />
      <path
        d="M0,20 Q30,10 60,20 T120,20"
        fill="none"
        stroke="white"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M-60,0 Q-30,-10 0,0 T60,0"
        fill="none"
        stroke="white"
        strokeWidth="0.5"
        opacity="0.2"
      />
    </pattern>

    {/* Ondas de superfície fluidas dinâmicas */}
    <pattern id="waveSurfacePattern" width="80" height="20" patternUnits="userSpaceOnUse">
      <animateTransform
        attributeName="patternTransform"
        type="translate"
        from="0 0"
        to="80 0"
        dur="3.2s"
        repeatCount="indefinite"
      />
      <path
        d="M 0 10 Q 20 4, 40 10 T 80 10"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        opacity="0.85"
      />
      <path
        d="M 0 14 Q 20 8, 40 14 T 80 14"
        fill="none"
        stroke="#93c5fd"
        strokeWidth="1.2"
        opacity="0.5"
      />
    </pattern>

    <filter id="glowResultant" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.5" />
    </filter>

    {/* Concreto mais escuro */}
    <filter id="concreteNoise">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="1.5"
        numOctaves="3"
        stitchTiles="stitch"
      />
    </filter>

    <pattern id="concretePattern" width="32" height="32" patternUnits="userSpaceOnUse" patternTransform={trans}>
      <rect width="32" height="32" fill="#a3a3a3" />
      {/* Triângulos de Agregado */}
      <path d="M4,8 l2,-2 l2,2 z M18,22 l2,-2 l2,2 z M25,10 l1.5,-1.5 l1.5,1.5 z" fill="#525252" opacity="0.4" />
      <circle cx="10" cy="15" r="0.5" fill="#525252" opacity="0.3" />
      <circle cx="22" cy="7" r="0.5" fill="#525252" opacity="0.3" />
      <circle cx="5" cy="28" r="0.5" fill="#525252" opacity="0.3" />
      <circle cx="28" cy="25" r="0.5" fill="#525252" opacity="0.3" />
    </pattern>

    {/* Terra / Enrocamento - Architectural Earth Hatch */}
    <pattern
      id="earthPattern"
      width="16"
      height="16"
      patternUnits="userSpaceOnUse"
      patternTransform={trans}
    >
      <rect width="16" height="16" fill="none" />
      <g stroke="#000000" strokeWidth="0.3" opacity="0.45">
        {/* Continuous Grid Lines */}
        <line x1="0" y1="0" x2="16" y2="0" />
        <line x1="0" y1="8" x2="16" y2="8" />
        <line x1="0" y1="0" x2="0" y2="16" />
        <line x1="8" y1="0" x2="8" y2="16" />

        {/* Top-Left: Vertical Inner Lines */}
        <line x1="2" y1="0" x2="2" y2="8" />
        <line x1="4" y1="0" x2="4" y2="8" />
        <line x1="6" y1="0" x2="6" y2="8" />

        {/* Top-Right: Horizontal Inner Lines */}
        <line x1="8" y1="2" x2="16" y2="2" />
        <line x1="8" y1="4" x2="16" y2="4" />
        <line x1="8" y1="6" x2="16" y2="6" />

        {/* Bottom-Left: Horizontal Inner Lines */}
        <line x1="0" y1="10" x2="8" y2="10" />
        <line x1="0" y1="12" x2="8" y2="12" />
        <line x1="0" y1="14" x2="8" y2="14" />

        {/* Bottom-Right: Vertical Inner Lines */}
        <line x1="10" y1="8" x2="10" y2="16" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="14" y1="8" x2="14" y2="16" />
      </g>
    </pattern>

    {/* Madeira e metal */}
    <pattern
      id="woodPattern"
      width="20"
      height="20"
      patternUnits="userSpaceOnUse"
      patternTransform={`rotate(10) ${trans}`}
    >
      <rect width="20" height="20" fill="#d97706" />
      <path
        d="M0,5 Q10,2 20,5 M0,15 Q10,18 20,15"
        stroke="#92400e"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M5,0 Q2,10 5,20"
        stroke="#b45309"
        strokeWidth="0.5"
        fill="none"
        opacity="0.3"
      />
    </pattern>

    {/* Padrão de Alvenaria / Parede Inclinada (estilo livro didático) */}
    <pattern id="brickPattern" width="20" height="10" patternUnits="userSpaceOnUse">
      <rect width="20" height="10" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.6" />
      <line x1="0" y1="5" x2="20" y2="5" stroke="#94a3b8" strokeWidth="0.6" />
      <line x1="10" y1="0" x2="10" y2="5" stroke="#94a3b8" strokeWidth="0.6" />
      <line x1="0" y1="5" x2="0" y2="10" stroke="#94a3b8" strokeWidth="0.6" />
      <line x1="20" y1="5" x2="20" y2="10" stroke="#94a3b8" strokeWidth="0.6" />
    </pattern>

    {/* Hachura da Comporta na Vista Frontal Rebatida (linhas finas a 45°) */}
    <pattern id="gateHatchPattern" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="8" stroke="#64748b" strokeWidth="0.9" opacity="0.55" />
    </pattern>

    {/* Seta grossa para vetor Empuxo E */}
    <marker
      id="arrow-thrust"
      viewBox="0 0 12 12"
      refX="10"
      refY="6"
      markerWidth="8"
      markerHeight="8"
      orient="auto"
    >
      <path d="M 0 2 L 10 6 L 0 10 z" fill="#0f172a" />
    </marker>

    {/* Seta técnica para cotas dimensionais */}
    <marker
      id="arrow-dim-start"
      viewBox="0 0 10 10"
      refX="2"
      refY="5"
      markerWidth="5"
      markerHeight="5"
      orient="auto"
    >
      <path d="M 10 2 L 0 5 L 10 8 z" fill="#334155" />
    </marker>
    <marker
      id="arrow-dim-end"
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="5"
      markerHeight="5"
      orient="auto"
    >
      <path d="M 0 2 L 10 5 L 0 8 z" fill="#334155" />
    </marker>

    <linearGradient id="metalLinear" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#e2e8f0" />
      <stop offset="50%" stopColor="#94a3b8" />
      <stop offset="100%" stopColor="#475569" />
    </linearGradient>

    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fef3c7" />
      <stop offset="50%" stopColor="#f59e0b" />
      <stop offset="100%" stopColor="#b45309" />
    </linearGradient>
  </defs>
  );
};
