import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Edges, Html, Line } from '@react-three/drei';
import { FormaComporta } from '../../dominio/tipos';
import { CORES_MATERIAIS } from '../../../visual-compartilhado/identidadeVisual';

interface FrontalProjection3DProps {
  gateShape: FormaComporta;
  W: number;
  H: number;
  openFraction: number;
  isGateClosed: boolean;
  isAnalyzed: boolean;
  P_top: { x: number; y: number };
  P_bot: { x: number; y: number };
  P_mid: { x: number; y: number };
  P_CG: { x: number; y: number };
  P_CP: { x: number; y: number };
  P_crest: { x: number; y: number };
  wallHorizThick: number;
  downSurfaceY: number;
  canalBedSurfaceY: number;
  downstreamLevel: number;
}

function buildGate2DShape(
  gateShape: FormaComporta,
  W: number,
  H: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const halfH = H / 2;

  if (gateShape === FormaComporta.CIRCULAR) {
    const r = halfH;
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const x = r * Math.cos(a);
      const y = r * Math.sin(a);
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }

  if (gateShape === FormaComporta.SEMI_CIRCULAR) {
    const r = H;
    const steps = 36;
    shape.moveTo(-r, -halfH);
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI;
      const x = r * Math.cos(a);
      const y = -halfH + H * Math.sin(a);
      shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }

  const halfW = W / 2;
  shape.moveTo(-halfW, -halfH);
  shape.lineTo(halfW, -halfH);
  shape.lineTo(halfW, halfH);
  shape.lineTo(-halfW, halfH);
  shape.closePath();
  return shape;
}

export const FrontalProjection3D: React.FC<FrontalProjection3DProps> = ({
  gateShape,
  W,
  H,
  openFraction,
  isGateClosed,
  isAnalyzed,
  P_top,
  P_bot,
  P_mid,
  P_CG,
  P_CP,
  P_crest,
  wallHorizThick,
  downSurfaceY,
  canalBedSurfaceY,
  downstreamLevel,
}) => {
  const halfWidth =
    gateShape === FormaComporta.CIRCULAR
      ? H / 2
      : gateShape === FormaComporta.SEMI_CIRCULAR
      ? H
      : W / 2;
  const halfHeight = H / 2;

  // Posiciona a vista frontal ortográfica ao lado direito da estrutura,
  // acima do canal/nível de jusante, sem sobrepor água, parede ou escoamento.
  const minClearBaseY =
    downstreamLevel > 0 ? downSurfaceY + 0.45 : canalBedSurfaceY + 0.45;
  const projCenterX =
    Math.max(P_crest.x, P_top.x, P_bot.x) +
    wallHorizThick +
    halfWidth +
    Math.max(1.35, H * 0.9);
  const projCenterY = Math.max(P_mid.y, minClearBaseY + halfHeight);
  const projZ = 0;

  const liftDist = Math.max(0, Math.min(1, openFraction)) * H;

  const gateGeometry = useMemo(() => {
    const shape = buildGate2DShape(gateShape, W, H);
    return new THREE.ShapeGeometry(shape, 36);
  }, [gateShape, W, H]);

  const outlinePoints = useMemo((): Array<[number, number, number]> => {
    const shape = buildGate2DShape(gateShape, W, H);
    const pts = shape.getPoints(48);
    const res = pts.map(
      (pt): [number, number, number] => [
        projCenterX + pt.x,
        projCenterY + pt.y,
        projZ + 0.015,
      ]
    );
    if (res.length > 0) res.push(res[0]);
    return res;
  }, [gateShape, W, H, projCenterX, projCenterY, projZ]);

  const cgOffsetY = P_CG.y - P_mid.y;
  const cpOffsetY = P_CP.y - P_mid.y;
  const cgWorldY = projCenterY + (P_top.y !== P_bot.y ? ((P_CG.y - P_bot.y) / (P_top.y - P_bot.y) - 0.5) * H : cgOffsetY);
  const cpWorldY = projCenterY + (P_top.y !== P_bot.y ? ((P_CP.y - P_bot.y) / (P_top.y - P_bot.y) - 0.5) * H : cpOffsetY);

  const dimLabel =
    gateShape === FormaComporta.CIRCULAR
      ? `Ø = ${H.toFixed(2)} m`
      : gateShape === FormaComporta.SEMI_CIRCULAR
      ? `R = ${H.toFixed(2)} m`
      : `${W.toFixed(2)} × ${H.toFixed(2)} m`;

  return (
    <group>
      {/* Linhas auxiliares de chamada entre a comporta inclinada e a vista frontal */}
      <Line
        points={[
          [P_top.x + wallHorizThick * 0.5, P_top.y, projZ],
          [projCenterX - halfWidth - 0.2, projCenterY + halfHeight, projZ],
        ]}
        color={CORES_MATERIAIS.cotaLinha}
        lineWidth={1.2}
        dashed
        dashSize={0.14}
        gapSize={0.09}
      />
      <Line
        points={[
          [P_bot.x + wallHorizThick * 0.5, P_bot.y, projZ],
          [projCenterX - halfWidth - 0.2, projCenterY - halfHeight, projZ],
        ]}
        color={CORES_MATERIAIS.cotaLinha}
        lineWidth={1.2}
        dashed
        dashSize={0.14}
        gapSize={0.09}
      />

      {/* Abertura fixa (preenchida com azul translúcido quando a comporta está aberta) */}
      {!isGateClosed && (
        <mesh
          geometry={gateGeometry}
          position={[projCenterX, projCenterY, projZ]}
          renderOrder={3}
        >
          <meshStandardMaterial
            color={CORES_MATERIAIS.aguaPrimaria}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
          />
          <Edges color="#0284c7" threshold={15} />
        </mesh>
      )}

      {/* Folha metálica da comporta (fechada em y=0 ou elevada em +liftDist) */}
      <mesh
        geometry={gateGeometry}
        position={[projCenterX, projCenterY + liftDist, projZ + 0.01]}
        renderOrder={4}
      >
        <meshStandardMaterial
          color="#cbd5e1"
          roughness={0.4}
          metalness={0.45}
          transparent={openFraction >= 1}
          opacity={openFraction >= 1 ? 0.88 : 0.96}
          side={THREE.DoubleSide}
        />
        <Edges color="#0f172a" threshold={15} />
      </mesh>

      {/* Contorno da abertura original sempre legível */}
      {outlinePoints.length > 2 && (
        <Line
          points={outlinePoints}
          color="#0f172a"
          lineWidth={1.6}
          dashed={!isGateClosed}
          dashSize={0.1}
          gapSize={0.06}
        />
      )}

      {/* Eixos de simetria ortogonais */}
      <Line
        points={[
          [projCenterX - halfWidth - 0.18, projCenterY, projZ + 0.02],
          [projCenterX + halfWidth + 0.18, projCenterY, projZ + 0.02],
        ]}
        color={CORES_MATERIAIS.cotaLinha}
        lineWidth={1}
        dashed
        dashSize={0.12}
        gapSize={0.06}
      />
      <Line
        points={[
          [projCenterX, projCenterY - halfHeight - 0.18, projZ + 0.02],
          [projCenterX, projCenterY + halfHeight + 0.18, projZ + 0.02],
        ]}
        color={CORES_MATERIAIS.cotaLinha}
        lineWidth={1}
        dashed
        dashSize={0.12}
        gapSize={0.06}
      />

      {/* Marcador CG */}
      <mesh
        position={[projCenterX, cgWorldY, projZ + 0.025]}
        renderOrder={5}
      >
        <sphereGeometry args={[Math.max(0.045, H * 0.045), 14, 14]} />
        <meshStandardMaterial color={CORES_MATERIAIS.pontoCGStroke} />
      </mesh>

      {/* Marcador CP quando fechada e analisada */}
      {isGateClosed && isAnalyzed && (
        <mesh
          position={[projCenterX, cpWorldY, projZ + 0.025]}
          renderOrder={5}
        >
          <sphereGeometry args={[Math.max(0.045, H * 0.045), 14, 14]} />
          <meshStandardMaterial color={CORES_MATERIAIS.pontoCP} />
        </mesh>
      )}

      {/* Rótulo técnico discreto das dimensões da vista frontal */}
      <Html
        position={[projCenterX, projCenterY - halfHeight - Math.max(0.28, H * 0.25), projZ]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div className="bg-white/95 backdrop-blur-sm border border-slate-300/80 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap select-none">
          Vista Frontal · {dimLabel}
        </div>
      </Html>
    </group>
  );
};
