import React from 'react';

export const SVGDefs: React.FC = () => (
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

    {/* Água */}
    <linearGradient id="fluidDepthA" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.7" />
    </linearGradient>

    <linearGradient id="fluidDepthB" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.9" />
    </linearGradient>

    <linearGradient id="surfaceGradientA" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
    </linearGradient>

    <linearGradient id="surfaceGradientB" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.75" />
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

    <pattern id="concretePattern" width="64" height="64" patternUnits="userSpaceOnUse">
      <rect width="64" height="64" fill="#a3a3a3" />
      <rect width="64" height="64" filter="url(#concreteNoise)" opacity="0.25" />
      <path
        d="M10,20 Q15,15 20,20 T30,20"
        stroke="#525252"
        strokeWidth="0.5"
        fill="none"
        opacity="0.3"
      />
      <circle cx="45" cy="50" r="1.5" fill="#525252" opacity="0.4" />
      <circle cx="10" cy="50" r="1" fill="#e5e5e5" opacity="0.4" />
    </pattern>

    {/* Terra / Enrocamento */}
    <pattern
      id="earthHatch"
      width="20"
      height="20"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(12)"
    >
      <rect width="20" height="20" fill="#a16207" />
      <path
        d="M0,5 Q10,2 20,5 M0,15 Q10,18 20,15"
        stroke="#78350f"
        strokeWidth="0.8"
        fill="none"
        opacity="0.35"
      />
      <circle cx="5" cy="5" r="1" fill="#d97706" opacity="0.5" />
      <circle cx="15" cy="15" r="0.8" fill="#b45309" opacity="0.4" />
    </pattern>

    {/* Madeira e metal, caso queira reaproveitar */}
    <pattern
      id="woodPattern"
      width="20"
      height="20"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(10)"
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