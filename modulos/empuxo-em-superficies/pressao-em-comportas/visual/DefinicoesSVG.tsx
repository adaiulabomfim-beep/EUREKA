import React from 'react';
import { FLUIDOS_PREDEFINIDOS } from '../dominio/tipos';
import { DefinicoesSVGComum } from '../../visual-compartilhado/DefinicoesSVGComum';
import { CORES_MATERIAIS } from '../../visual-compartilhado/identidadeVisual';

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
  const fm = FLUIDOS_PREDEFINIDOS[chaveMontante] || FLUIDOS_PREDEFINIDOS.agua;
  const fj = FLUIDOS_PREDEFINIDOS[chaveJusante] || FLUIDOS_PREDEFINIDOS.agua;
  const isUpWater = chaveMontante === 'agua' || chaveMontante === 'agua20C';
  const isDownWater = chaveJusante === 'agua' || chaveJusante === 'agua20C';

  return (
    <defs>
      <DefinicoesSVGComum pan={pan} />

      {/* Prisma / Diagrama Trapezoidal de Pressão Hidrostática */}
      <linearGradient id="pressurePrismGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={CORES_MATERIAIS.aguaPrimaria} stopOpacity="0.22" />
        <stop offset="55%" stopColor={CORES_MATERIAIS.aguaSecundaria} stopOpacity="0.42" />
        <stop offset="100%" stopColor={CORES_MATERIAIS.aguaProfunda} stopOpacity="0.72" />
      </linearGradient>

      {/* Prisma de Pressão para Glicerina / Fluido à esquerda */}
      <linearGradient id="pressurePrismGlyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.22" />
        <stop offset="55%" stopColor="#8b5cf6" stopOpacity="0.40" />
        <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.68" />
      </linearGradient>

      {/* Prisma de Pressão para Água a Jusante */}
      <linearGradient id="pressurePrismDownGrad" x1="100%" y1="0%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
        <stop offset="55%" stopColor="#0284c7" stopOpacity="0.42" />
        <stop offset="100%" stopColor="#0369a1" stopOpacity="0.72" />
      </linearGradient>

      {/* ===== GRADIENTES DE FLUIDO DINÂMICOS (idênticos a Barragens para água) ===== */}
      <linearGradient id="fluidDepthA" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop
          offset="0%"
          stopColor={isUpWater ? CORES_MATERIAIS.aguaPrimaria : fm.corPrimaria}
          stopOpacity="0.45"
        />
        <stop
          offset="100%"
          stopColor={isUpWater ? CORES_MATERIAIS.aguaSecundaria : fm.corSecundaria}
          stopOpacity="0.85"
        />
      </linearGradient>

      <linearGradient id="fluidDepthB" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop
          offset="0%"
          stopColor={isDownWater ? CORES_MATERIAIS.aguaSecundaria : fj.corPrimaria}
          stopOpacity="0.55"
        />
        <stop
          offset="100%"
          stopColor={isDownWater ? CORES_MATERIAIS.aguaProfunda : fj.corSecundaria}
          stopOpacity="0.95"
        />
      </linearGradient>

      <linearGradient id="surfaceGradientA" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop
          offset="0%"
          stopColor={isUpWater ? CORES_MATERIAIS.aguaSuperficie : fm.corSuperficie}
          stopOpacity="0.55"
        />
        <stop
          offset="100%"
          stopColor={isUpWater ? CORES_MATERIAIS.aguaPrimaria : fm.corPrimaria}
          stopOpacity="0.8"
        />
      </linearGradient>

      <linearGradient id="surfaceGradientB" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop
          offset="0%"
          stopColor={isDownWater ? CORES_MATERIAIS.aguaPrimaria : fj.corSuperficie}
          stopOpacity="0.5"
        />
        <stop
          offset="100%"
          stopColor={isDownWater ? CORES_MATERIAIS.aguaSecundaria : fj.corPrimaria}
          stopOpacity="0.8"
        />
      </linearGradient>

      {/* Hachura da Comporta na Vista Frontal Rebatida (linhas finas a 45°) */}
      <pattern
        id="gateHatchPattern"
        width="8"
        height="8"
        patternTransform="rotate(45 0 0)"
        patternUnits="userSpaceOnUse"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="8"
          stroke={CORES_MATERIAIS.cotaLinha}
          strokeWidth="0.9"
          opacity="0.55"
        />
      </pattern>

      {/* Seta da força resultante alinhada ao padrão Barragens */}
      <marker
        id="arrow-thrust"
        viewBox="0 0 12 12"
        refX="10"
        refY="6"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
      >
        <path d="M 0 1.5 L 10 6 L 0 10.5 z" fill={CORES_MATERIAIS.vetorResultantePonta} />
      </marker>

      {/* Seta da força da glicerina */}
      <marker
        id="arrow-glycerin"
        viewBox="0 0 12 12"
        refX="10"
        refY="6"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
      >
        <path d="M 0 1.5 L 10 6 L 0 10.5 z" fill="#6d28d9" />
      </marker>

      {/* Seta do peso próprio W */}
      <marker
        id="arrow-weight"
        viewBox="0 0 12 12"
        refX="10"
        refY="6"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
      >
        <path d="M 0 1.5 L 10 6 L 0 10.5 z" fill="#d97706" />
      </marker>

      {/* Seta das reações nos apoios (parede lisa A e articulação B) */}
      <marker
        id="arrow-reaction"
        viewBox="0 0 12 12"
        refX="10"
        refY="6"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
      >
        <path d="M 0 1.5 L 10 6 L 0 10.5 z" fill="#7c3aed" />
      </marker>
    </defs>
  );
};
