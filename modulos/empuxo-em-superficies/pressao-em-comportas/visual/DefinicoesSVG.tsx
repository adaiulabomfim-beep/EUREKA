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

    {/* Terra / Enrocamento */}
    <pattern
      id="earthPattern"
      width="24"
      height="24"
      patternUnits="userSpaceOnUse"
      patternTransform={`rotate(12) ${trans}`}
    >
      <rect width="24" height="24" fill="none" />
      {/* Padrão Técnico de Terra (Grupos de linhas a 45 graus) */}
      <g stroke="#000000" strokeWidth="0.8" opacity="0.15">
        <line x1="0" y1="24" x2="24" y2="0" stroke="inherit" />
        <line x1="4" y1="24" x2="24" y2="4" stroke="inherit" />
        <line x1="0" y1="20" x2="20" y2="0" stroke="inherit" />
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
