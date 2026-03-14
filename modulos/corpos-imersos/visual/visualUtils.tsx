import { FLUIDS, MATERIALS } from '../dominio/configuracao';
import { Point, TankPoints } from './Vista3D';

export const getFluidColor = (name: string) => FLUIDS.find((f) => f.name === name)?.color || '#000000';
export const getMaterialStyle = (matName: string, baseColor: string) => baseColor;

export const getMaterialPattern = (materialName: string, baseColor: string) => {
  const n = materialName.toLowerCase();

  if (
    n.includes('ouro') ||
    n.includes('latão') ||
    n.includes('bronze') ||
    n.includes('cobre')
  ) {
    return 'url(#goldGradient2D)';
  }

  if (n.includes('madeira') || n.includes('cortiça')) {
    return 'url(#woodPattern2D)';
  }

  if (
    n.includes('concreto') ||
    n.includes('asfalto') ||
    n.includes('granito') ||
    n.includes('pedra')
  ) {
    return 'url(#concretePattern2D)';
  }

  if (
    n.includes('aço') ||
    n.includes('alumínio') ||
    n.includes('ferro') ||
    n.includes('prata') ||
    n.includes('chumbo')
  ) {
    return 'url(#metalLinear2D)';
  }

  return baseColor;
};

export const drawPoly = (pts: { x: number; y: number }[], fill: string, opacity?: number, stroke?: string, strokeWidth?: number) => (
  <polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill={fill} fillOpacity={opacity} stroke={stroke} strokeWidth={strokeWidth} />
);

export const renderDimensionLine = (x: number, y1: number, y2: number, label: React.ReactNode, color: string = '#64748b') => (
  <g>
    <line x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth="1" />
    <text x={x + 5} y={(y1 + y2) / 2} fontSize="10" fill={color}>{label}</text>
  </g>
);

export const renderFill = (pts: { x: number; y: number }[], fill: string) => <polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill={fill} />;

export const getPoints = (x: number, y_from_bot: number, w: number, h: number, z: number, depth: number, tankOffsetX: number, tankBottomY: number): TankPoints => {
  const scale = 0.5;
  const p1 = { x: tankOffsetX + x, y: tankBottomY - y_from_bot };
  const p2 = { x: tankOffsetX + x + w, y: tankBottomY - y_from_bot };
  const p3 = { x: tankOffsetX + x + w, y: tankBottomY - y_from_bot - h };
  const p4 = { x: tankOffsetX + x, y: tankBottomY - y_from_bot - h };
  const p5 = { x: tankOffsetX + x + depth * scale, y: tankBottomY - y_from_bot - depth * scale };
  const p6 = { x: tankOffsetX + x + w + depth * scale, y: tankBottomY - y_from_bot - depth * scale };
  const p7 = { x: tankOffsetX + x + w + depth * scale, y: tankBottomY - y_from_bot - h - depth * scale };
  const p8 = { x: tankOffsetX + x + depth * scale, y: tankBottomY - y_from_bot - h - depth * scale };
  return { p1, p2, p3, p4, p5, p6, p7, p8 };
};

export const project = (x: number, y: number, z: number, tankOffsetX: number, tankBottomY: number): Point => ({ x: tankOffsetX + x, y: tankBottomY - y });
export const rotateVector = (v: Point): Point => v;
