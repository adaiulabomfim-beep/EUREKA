import React from 'react';

interface SvgDefsProps {
  colorA?: string;
  colorB?: string;
}

/**
 * Darkens a hex color by a given amount (0-1).
 */
const darkenHex = (hex: string, amount: number): string => {
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

export const SvgDefs = ({ colorA = '#3b82f6', colorB = '#2563eb' }: SvgDefsProps) => {
  const colorADark = darkenHex(colorA, 0.25);
  const colorBDark = darkenHex(colorB, 0.25);

  return (
  <defs>
    <linearGradient id="fluidDepthA" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={colorA} stopOpacity="0.45" />
      <stop offset="100%" stopColor={colorADark} stopOpacity="0.85" />
    </linearGradient>

    <linearGradient id="fluidDepthB" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={colorB} stopOpacity="0.55" />
      <stop offset="100%" stopColor={colorBDark} stopOpacity="0.95" />
    </linearGradient>

    <linearGradient id="goldGradient2D" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="white" stopOpacity="0.6" />
      <stop offset="50%" stopColor="white" stopOpacity="0.1" />
      <stop offset="100%" stopColor="black" stopOpacity="0.4" />
    </linearGradient>

    <linearGradient id="metalLinear2D" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="white" stopOpacity="0.5" />
      <stop offset="50%" stopColor="white" stopOpacity="0.1" />
      <stop offset="100%" stopColor="black" stopOpacity="0.3" />
    </linearGradient>

    <pattern
      id="woodPattern2D"
      width="20"
      height="20"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(10)"
    >
      <path
        d="M0,5 Q10,2 20,5 M0,15 Q10,18 20,15"
        stroke="black"
        strokeWidth="1"
        fill="none"
        opacity="0.15"
      />
      <path
        d="M5,0 Q2,10 5,20"
        stroke="black"
        strokeWidth="0.5"
        fill="none"
        opacity="0.1"
      />
    </pattern>

    <pattern id="styrofoamPattern" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="5" cy="5" r="1.5" fill="black" opacity="0.05" />
      <circle cx="15" cy="12" r="2" fill="black" opacity="0.03" />
      <circle cx="8" cy="18" r="1" fill="black" opacity="0.06" />
      <circle cx="18" cy="4" r="1.5" fill="black" opacity="0.04" />
      <circle cx="2" cy="15" r="1" fill="white" opacity="0.5" />
      <circle cx="12" cy="6" r="1.5" fill="white" opacity="0.4" />
    </pattern>

    <filter id="concreteNoise2D">
      <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" stitchTiles="stitch" />
    </filter>

    <pattern id="concretePattern2D" width="64" height="64" patternUnits="userSpaceOnUse">
      <rect width="64" height="64" fill="#a3a3a3" />
      <rect width="64" height="64" filter="url(#concreteNoise2D)" opacity="0.25" />
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

    <pattern id="ripplePattern" width="120" height="40" patternUnits="userSpaceOnUse">
      <animateTransform
        attributeName="patternTransform"
        type="translate"
        values="0 0;120 0"
        dur="12s"
        calcMode="linear"
        repeatCount="indefinite"
      />
      <path
        d="M0,20 C20,12 40,12 60,20 C80,28 100,28 120,20"
        fill="none"
        stroke="white"
        strokeWidth="1"
        opacity="0.35"
      />
      <path
        d="M0,8 C20,2 40,2 60,8 C80,14 100,14 120,8"
        fill="none"
        stroke="white"
        strokeWidth="0.5"
        opacity="0.2"
      />
      <path
        d="M0,32 C20,27 40,27 60,32 C80,37 100,37 120,32"
        fill="none"
        stroke="white"
        strokeWidth="0.5"
        opacity="0.15"
      />
    </pattern>

    <linearGradient id="glassGradient" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stopColor="white" stopOpacity="0.3" />
      <stop offset="50%" stopColor="white" stopOpacity="0.1" />
      <stop offset="100%" stopColor="white" stopOpacity="0.3" />
    </linearGradient>
    <radialGradient id="sphereLight" cx="30%" cy="30%" r="50%">
      <stop offset="0%" stopColor="white" stopOpacity="0.4" />
      <stop offset="100%" stopColor="white" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="surfaceGradientA" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={colorA} stopOpacity="0.55" />
      <stop offset="100%" stopColor={colorADark} stopOpacity="0.8" />
    </linearGradient>
  </defs>
  );
};
