import React from 'react';

interface SvgDefsProps {
  colorA?: string;
  colorB?: string;
}

export const SvgDefs = ({ colorA = '#3b82f6', colorB = '#2563eb' }: SvgDefsProps) => (
  <defs>
    <linearGradient id="fluidDepthA" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={colorA} stopOpacity="0.2" />
      <stop offset="100%" stopColor={colorA} stopOpacity="0.7" />
    </linearGradient>

    <linearGradient id="fluidDepthB" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={colorB} stopOpacity="0.4" />
      <stop offset="100%" stopColor={colorB} stopOpacity="0.9" />
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
      <stop offset="0%" stopColor={colorA} stopOpacity="0.5" />
      <stop offset="100%" stopColor={colorA} stopOpacity="0.8" />
    </linearGradient>
  </defs>
);
