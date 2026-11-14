import React from 'react';
import { CORES_MATERIAIS } from './identidadeVisual';

export type Ponto2D = { x: number; y: number };

interface DesenhoCota2DProps {
  /** Ponto inicial na geometria */
  p1Orig: Ponto2D;
  /** Ponto final na geometria */
  p2Orig: Ponto2D;
  /** Ponto inicial deslocado para a linha de cota */
  p1Off: Ponto2D;
  /** Ponto final deslocado para a linha de cota */
  p2Off: Ponto2D;
  /** Rótulo exibido sobre a cota */
  label: React.ReactNode;
  /** Comprimento aproximado em caracteres (usado no cálculo da largura da caixa branca de fundo) */
  labelCharCount: number;
  /** Posição relativa ao longo da linha de cota (0..1, padrão 0.5) */
  labelRatio?: number;
  /** Deslocamento extra em pixels do texto */
  textOffsetPx?: Ponto2D;
}

/**
 * Cota dimensional técnica padronizada no estilo oficial do módulo Barragens:
 * linhas auxiliares tracejadas (#64748b, dash 3 3, opacity 0.45), linha contínua com setas (#64748b, 1.6)
 * e etiqueta com fundo branco arredondado (rx=3) e tipografia #475569 (12px bold).
 */
export const DesenhoCota2D: React.FC<DesenhoCota2DProps> = ({
  p1Orig,
  p2Orig,
  p1Off,
  p2Off,
  label,
  labelCharCount,
  labelRatio = 0.5,
  textOffsetPx = { x: 0, y: 0 },
}) => {
  const cx = p1Off.x + (p2Off.x - p1Off.x) * labelRatio + textOffsetPx.x;
  const cy = p1Off.y + (p2Off.y - p1Off.y) * labelRatio + textOffsetPx.y;

  const textW = Math.max(26, labelCharCount * 6.8 + 10);
  const textH = 18;

  return (
    <g stroke={CORES_MATERIAIS.cotaLinha} strokeWidth="1.6" fill="none" opacity="0.9">
      <line
        x1={p1Orig.x}
        y1={p1Orig.y}
        x2={p1Off.x}
        y2={p1Off.y}
        strokeDasharray="3 3"
        opacity="0.45"
      />
      <line
        x1={p2Orig.x}
        y1={p2Orig.y}
        x2={p2Off.x}
        y2={p2Off.y}
        strokeDasharray="3 3"
        opacity="0.45"
      />
      <line
        x1={p1Off.x}
        y1={p1Off.y}
        x2={p2Off.x}
        y2={p2Off.y}
        markerStart="url(#arrow)"
        markerEnd="url(#arrow)"
      />
      <rect
        x={cx - textW / 2}
        y={cy - textH / 2}
        width={textW}
        height={textH}
        fill="white"
        rx="3"
        stroke="none"
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={CORES_MATERIAIS.cotaTexto}
        fontSize="12"
        fontWeight="700"
        stroke="none"
      >
        {label}
      </text>
    </g>
  );
};

interface SimboloNivelAgua2DProps {
  x: number;
  y: number;
  text: string;
  flipX?: boolean;
}

/**
 * Símbolo técnico de nível d'água (NA) idêntico ao padrão de Barragens.
 */
export const SimboloNivelAgua2D: React.FC<SimboloNivelAgua2DProps> = ({
  x,
  y,
  text,
  flipX = false,
}) => {
  const dir = flipX ? -1 : 1;
  return (
    <g stroke={CORES_MATERIAIS.cotaNivelStroke} strokeWidth="1.2" opacity="0.9">
      <polygon points={`${x},${y} ${x - 7},${y - 14} ${x},${y - 14}`} fill="none" />
      <polygon
        points={`${x},${y} ${x},${y - 14} ${x + 7},${y - 14}`}
        fill={CORES_MATERIAIS.cotaNivelStroke}
      />
      <polyline points={`${x},${y - 14} ${x},${y - 30} ${x + dir * 56},${y - 30}`} fill="none" />
      <text
        x={x + dir * 28}
        y={y - 34}
        textAnchor="middle"
        dominantBaseline="alphabetic"
        fill={CORES_MATERIAIS.cotaNivelTexto}
        fontSize="11"
        fontWeight="bold"
        stroke="none"
      >
        {text}
      </text>
    </g>
  );
};

interface MarcadorCG2DProps {
  x: number;
  y: number;
  labelOffset?: Ponto2D;
  radius?: number;
}

/**
 * Marcador de Centro de Gravidade (⊕) idêntico ao padrão de Barragens.
 */
export const MarcadorCG2D: React.FC<MarcadorCG2DProps> = ({
  x,
  y,
  labelOffset = { x: 9, y: -8 },
  radius = 6,
}) => {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill="white"
        stroke={CORES_MATERIAIS.pontoCGStroke}
        strokeWidth="1.5"
      />
      <path
        d={`M ${x - radius} ${y} H ${x + radius} M ${x} ${y - radius} V ${y + radius}`}
        stroke={CORES_MATERIAIS.pontoCGStroke}
        strokeWidth="1.2"
      />
      <text
        x={x + labelOffset.x}
        y={y + labelOffset.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="10"
        fontWeight="800"
        fill={CORES_MATERIAIS.pontoCGStroke}
        stroke="white"
        strokeWidth="2.5"
        paintOrder="stroke"
      >
        CG
      </text>
    </g>
  );
};

interface FaixaOndulacaoAgua2DProps {
  xLeft: number;
  xRightTop: number;
  xRightBottom?: number;
  xLeftBottom?: number;
  yTop: number;
  heightPx: number;
}

/**
 * Faixa de ondulação animada na superfície livre da água (padrão Barragens).
 */
export const FaixaOndulacaoAgua2D: React.FC<FaixaOndulacaoAgua2DProps> = ({
  xLeft,
  xRightTop,
  xRightBottom = xRightTop,
  xLeftBottom = xLeft,
  yTop,
  heightPx,
}) => {
  if (heightPx <= 1) return null;
  return (
    <g pointerEvents="none">
      <polygon
        points={`${xLeft},${yTop} ${xRightTop},${yTop} ${xRightBottom},${yTop + heightPx} ${xLeftBottom},${yTop + heightPx}`}
        fill="url(#ripplePattern)"
        pointerEvents="none"
      />
      <line
        x1={xLeft}
        y1={yTop}
        x2={xRightTop}
        y2={yTop}
        stroke={CORES_MATERIAIS.aguaLinhaSuperficie}
        strokeWidth={1}
        pointerEvents="none"
      />
    </g>
  );
};
