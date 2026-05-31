import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import { FormaComporta } from '../dominio/tipos';

// ═══════════════════════════════════════════════════════════════════
// Import SHARED components from barragens (same lighting, materials,
// water shader, canvas wrapper — zero duplication).
// ═══════════════════════════════════════════════════════════════════
import { BarragemCanvas } from '../../barragens/visual-3d/components/BarragemCanvas';
import { HatchMaterial } from '../../barragens/visual-3d/core/materials';
import { AnimatedWaterMaterial } from '../../barragens/visual-3d/components/AnimatedWater';
import { Vista3DUI } from '../../barragens/visual-3d/components/Vista3DUI';

// ═══════════════════════════════════════════════════════════════════
// WORLD COORDINATE SYSTEM:
//   X  → flow direction (upstream at -X, downstream at +X)
//   Y  → vertical (height)
//   Z  → channel width direction
//
// The wall spans across Z, is thin in X, and tall in Y.
// The gate hole is visible looking along the X axis.
// ═══════════════════════════════════════════════════════════════════

/** Build concrete wall with gate hole. Face points along X axis. */
function buildWall(
  wallHeight: number,
  wallThickness: number,
  channelWidth: number,
  gateShape: FormaComporta,
  gateWidth: number,
  gateHeight: number,
  gateBottomY: number,
): THREE.BufferGeometry {
  const hW = channelWidth / 2;

  // Profile in local x-y plane where:
  //   local x → world Z (channel width)
  //   local y → world Y (height)
  const outerShape = new THREE.Shape();
  outerShape.moveTo(-hW, 0);
  outerShape.lineTo(hW, 0);
  outerShape.lineTo(hW, wallHeight);
  outerShape.lineTo(-hW, wallHeight);
  outerShape.lineTo(-hW, 0);

  // Gate hole (centered at local x=0)
  const hole = new THREE.Path();
  const gateTopY = gateBottomY + gateHeight;
  const halfGW = gateWidth / 2;

  if (gateShape === FormaComporta.RETANGULAR) {
    hole.moveTo(-halfGW, gateBottomY);
    hole.lineTo(halfGW, gateBottomY);
    hole.lineTo(halfGW, gateTopY);
    hole.lineTo(-halfGW, gateTopY);
    hole.lineTo(-halfGW, gateBottomY);
  } else if (gateShape === FormaComporta.CIRCULAR) {
    const r = Math.min(gateHeight, gateWidth) / 2;
    const cy = gateBottomY + gateHeight / 2;
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const px = r * Math.cos(a);
      const py = cy + r * Math.sin(a);
      if (i === 0) hole.moveTo(px, py);
      else hole.lineTo(px, py);
    }
  } else if (gateShape === FormaComporta.SEMI_CIRCULAR) {
    const r = gateWidth / 2;
    hole.moveTo(-halfGW, gateBottomY);
    hole.lineTo(halfGW, gateBottomY);
    const steps = 32;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI;
      const px = halfGW * Math.cos(a);
      const py = gateBottomY + r * Math.sin(a);
      hole.lineTo(-px, py);
    }
  }

  outerShape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(outerShape, {
    steps: 1,
    depth: wallThickness,
    bevelEnabled: false,
  });

  // Center thickness along local Z, then rotate so local Z → world X
  geometry.translate(0, 0, -wallThickness / 2);
  geometry.rotateY(Math.PI / 2);

  return geometry;
}

/**
 * Build gate plate (thin metal slab) with a visual margin so it
 * extends slightly beyond the wall opening for easier visibility.
 */
function buildGatePlate(
  gateShape: FormaComporta,
  gateWidth: number,
  gateHeight: number,
  gateBottomY: number,
  margin: number = 0.5, // extra size on each side
): THREE.BufferGeometry {
  const halfGW = gateWidth / 2 + margin;
  const gateTopY = gateBottomY + gateHeight + margin;
  const adjBottomY = Math.max(0, gateBottomY - margin);
  const plateThickness = 0.4; // Thicker plate for better visibility

  const shape = new THREE.Shape();

  if (gateShape === FormaComporta.RETANGULAR) {
    shape.moveTo(-halfGW, adjBottomY);
    shape.lineTo(halfGW, adjBottomY);
    shape.lineTo(halfGW, gateTopY);
    shape.lineTo(-halfGW, gateTopY);
    shape.lineTo(-halfGW, adjBottomY);
  } else if (gateShape === FormaComporta.CIRCULAR) {
    const r = Math.min(gateHeight, gateWidth) / 2 + margin;
    const cy = gateBottomY + gateHeight / 2;
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const px = r * Math.cos(a);
      const py = cy + r * Math.sin(a);
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    }
  } else if (gateShape === FormaComporta.SEMI_CIRCULAR) {
    const r = gateWidth / 2 + margin;
    shape.moveTo(-halfGW, adjBottomY);
    shape.lineTo(halfGW, adjBottomY);
    const steps = 32;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI;
      const px = (gateWidth / 2 + margin) * Math.cos(a);
      const py = adjBottomY + r * Math.sin(a);
      shape.lineTo(-px, py);
    }
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: plateThickness,
    bevelEnabled: false,
  });

  // Same rotation as wall: center and rotate so face points along X
  geometry.translate(0, 0, -plateThickness / 2);
  geometry.rotateY(Math.PI / 2);

  return geometry;
}



// ═══════════════════════════════════════════════════════════════════
// Scene3D Component
// ═══════════════════════════════════════════════════════════════════

interface Scene3DProps {
  upstreamLevel: number;
  downstreamLevel: number;
  hasGate: boolean;
  gateShape: FormaComporta;
  gateWidth: number;
  gateHeight: number;
  gateDepthFromCrest: number;
  gateInclination: number;
  force: number;
  s_cp: number;
  isAnalyzed: boolean;
  is3D: boolean;
  setIs3D: (v: boolean) => void;
  showVectors: boolean;
  setShowVectors: (v: boolean) => void;
  onCalculate: () => void;
  onReset: () => void;
  wallDims: { height: number; thickness: number; width: number; };
  [key: string]: any;
}

export const Scene3D: React.FC<Scene3DProps> = (props) => {
  const {
    upstreamLevel,
    downstreamLevel,
    gateShape,
    gateWidth,
    gateHeight,
    gateDepthFromCrest,
    hasGate,
    isAnalyzed,
    is3D,
    setIs3D,
    showVectors,
    setShowVectors,
    onCalculate,
    onReset,
    wallDims,
  } = props;

  const maxH = Math.max(upstreamLevel, downstreamLevel, gateHeight) || 10;
  const wallHeight = wallDims.height;
  const channelWidth = wallDims.width;
  const wallThickness = wallDims.thickness;
  const reservoirLength = Math.max(maxH * 2, wallDims.height * 1.5);
  const groundThickness = Math.max(4, wallDims.height * 0.2);

  // Gate bottom Y: the gate sits so its top is at (upstreamLevel - gateDepthFromCrest)
  const gateTopY = upstreamLevel - gateDepthFromCrest;
  const gateBottomY = Math.max(0, gateTopY - gateHeight);

  // Geometries
  const wallGeometry = useMemo(() =>
    buildWall(wallHeight, wallThickness, channelWidth, gateShape, gateWidth, gateHeight, gateBottomY),
    [wallHeight, wallThickness, channelWidth, gateShape, gateWidth, gateHeight, gateBottomY]
  );

  const gateGeometry = useMemo(() =>
    buildGatePlate(gateShape, gateWidth, gateHeight, gateBottomY),
    [gateShape, gateWidth, gateHeight, gateBottomY]
  );

  const halfWT = wallThickness / 2;

  return (
    <div className="w-full h-full relative" style={{ minHeight: 600 }}>
      <Vista3DUI
        is3D={is3D}
        setIs3D={setIs3D}
        showVectors={showVectors}
        setShowVectors={setShowVectors}
        isAnalyzed={isAnalyzed}
        onCalculate={onCalculate}
        onReset={onReset}
      />


      <div className="w-full h-full" style={{ minHeight: 600 }}>
        <BarragemCanvas targetY={wallHeight / 3}>
          {/* ── Ground Foundation ── */}
          <mesh position={[0, -groundThickness / 2, 0]} receiveShadow>
            <boxGeometry args={[
              wallThickness + reservoirLength * 2 + 4,
              groundThickness,
              channelWidth + 2,
            ]} />
            <HatchMaterial type="ground" />
            <Edges color="#4a2a0e" threshold={15} opacity={0.45} transparent />
          </mesh>

          {/* ── Concrete Wall (face points along ±X toward water) ── */}
          <mesh geometry={wallGeometry} castShadow receiveShadow>
            <HatchMaterial type="concrete" />
            <Edges color="#6b7280" threshold={15} opacity={0.4} transparent />
          </mesh>

          {/* ── Gate Plate (sits on upstream face of wall, protruding 10cm into water) ── */}
          {hasGate && (
            <mesh
              geometry={gateGeometry}
              position={[-halfWT + 0.1, 0, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color="#94a3b8"
                roughness={0.3}
                metalness={0.8}
              />
              <Edges color="#1e293b" threshold={15} opacity={0.6} transparent />
            </mesh>
          )}

          {/* ── Upstream Water (−X side) ── */}
          {upstreamLevel > 0 && (
            <mesh
              position={[
                -(halfWT + reservoirLength / 2),
                upstreamLevel / 2,
                0,
              ]}
              receiveShadow
            >
              <boxGeometry args={[reservoirLength, upstreamLevel, channelWidth]} />
              <AnimatedWaterMaterial />
            </mesh>
          )}

          {/* ── Downstream Water (+X side) ── */}
          {downstreamLevel > 0 && (
            <mesh
              position={[
                halfWT + reservoirLength / 2,
                downstreamLevel / 2,
                0,
              ]}
              receiveShadow
            >
              <boxGeometry args={[reservoirLength, downstreamLevel, channelWidth]} />
              <AnimatedWaterMaterial />
            </mesh>
          )}
        </BarragemCanvas>
      </div>
    </div>
  );
};
