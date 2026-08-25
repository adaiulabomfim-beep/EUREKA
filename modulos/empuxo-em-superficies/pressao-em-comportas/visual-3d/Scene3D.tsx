import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Edges, Html } from '@react-three/drei';
import { FormaComporta } from '../dominio/tipos';

// ═══════════════════════════════════════════════════════════════════
// Import SHARED components from barragens (same lighting, materials,
// water shader, canvas wrapper — zero duplication).
// ═══════════════════════════════════════════════════════════════════
import { BarragemCanvas } from '../../barragens/visual-3d/components/BarragemCanvas';
import { HatchMaterial } from '../../barragens/visual-3d/core/materials';
import { AnimatedWaterMaterial } from '../../barragens/visual-3d/components/AnimatedWater';
import { Vista3DUI } from '../../barragens/visual-3d/components/Vista3DUI';
import { PressureDistribution3D } from '../../barragens/visual-3d/components/PressureDistribution3D';
import { EmpuxoVector3D } from '../../barragens/visual-3d/components/EmpuxoVector3D';

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
  gateInclination: number
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

  geometry.translate(0, 0, -wallThickness / 2);
  
  if (gateInclination !== 90) {
    const angleRad = (gateInclination * Math.PI) / 180;
    const yz = 1 / Math.tan(angleRad);
    const shearMatrix = new THREE.Matrix4().makeShear(0, 0, 0, yz, 0, 0);
    geometry.applyMatrix4(shearMatrix);
  }

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
  gateInclination: number,
  wallThickness: number,
  margin: number = 0.5, // extra size on each side
): THREE.BufferGeometry {
  const halfGW = gateWidth / 2 + margin;
  const gateTopY = gateBottomY + gateHeight + margin;
  const adjBottomY = Math.max(0, gateBottomY - margin);
  const plateThickness = wallThickness * 0.4; // Thinner than the wall

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

  geometry.translate(0, 0, -plateThickness / 2);

  if (gateInclination !== 90) {
    const angleRad = (gateInclination * Math.PI) / 180;
    const yz = 1 / Math.tan(angleRad);
    const shearMatrix = new THREE.Matrix4().makeShear(0, 0, 0, yz, 0, 0);
    geometry.applyMatrix4(shearMatrix);
  }

  geometry.rotateY(Math.PI / 2);

  return geometry;
}

function buildGateRibsGeometries(
  gateShape: FormaComporta,
  gateWidth: number,
  gateHeight: number,
  gateBottomY: number,
  gateInclination: number,
  wallThickness: number,
  margin: number = 0.5
): THREE.BufferGeometry[] {
  const halfGW = gateWidth / 2 + margin;
  const gateTopY = gateBottomY + gateHeight + margin;
  const adjBottomY = Math.max(0, gateBottomY - margin);
  const plateThickness = wallThickness * 0.4;
  const ribDepth = plateThickness * 1.3; // Sticks out a bit

  const geometries: THREE.BufferGeometry[] = [];

  const addRib = (w: number, h: number, x: number, y: number) => {
    const geom = new THREE.BoxGeometry(w, h, ribDepth);
    geom.translate(x, y, -plateThickness / 2); // Center Z slightly backwards like the plate
    geometries.push(geom);
  };

  // Border frame
  addRib(gateWidth + margin * 2, 0.2, 0, adjBottomY); // bottom
  addRib(gateWidth + margin * 2, 0.2, 0, gateTopY); // top
  addRib(0.2, gateHeight + margin * 2, -halfGW, (gateTopY + adjBottomY) / 2); // left
  addRib(0.2, gateHeight + margin * 2, halfGW, (gateTopY + adjBottomY) / 2); // right

  // Cross ribs
  addRib(gateWidth + margin * 2, 0.15, 0, gateBottomY + gateHeight * 0.33);
  addRib(gateWidth + margin * 2, 0.15, 0, gateBottomY + gateHeight * 0.66);
  addRib(0.15, gateHeight + margin * 2, 0, (gateTopY + adjBottomY) / 2); // center vertical

  const angleRad = (gateInclination * Math.PI) / 180;
  const shearMatrix = new THREE.Matrix4();
  if (gateInclination !== 90) {
    const yz = 1 / Math.tan(angleRad);
    shearMatrix.makeShear(0, 0, 0, yz, 0, 0);
  }
  const rotMatrix = new THREE.Matrix4().makeRotationY(Math.PI / 2);

  geometries.forEach(g => {
    if (gateInclination !== 90) g.applyMatrix4(shearMatrix);
    g.applyMatrix4(rotMatrix);
  });

  return geometries;
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
  gateAbertura?: number;
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
    gateInclination,
    hasGate,
    isAnalyzed,
    is3D,
    setIs3D,
    showVectors,
    setShowVectors,
    onCalculate,
    onReset,
    wallDims,
    force,
    s_cp,
    gateAbertura = 0,
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
    buildWall(wallHeight, wallThickness, channelWidth, gateShape, gateWidth, gateHeight, gateBottomY, gateInclination),
    [wallHeight, wallThickness, channelWidth, gateShape, gateWidth, gateHeight, gateBottomY, gateInclination]
  );

  const gateGeometry = useMemo(() =>
    buildGatePlate(gateShape, gateWidth, gateHeight, gateBottomY, gateInclination, wallThickness),
    [gateShape, gateWidth, gateHeight, gateBottomY, gateInclination, wallThickness]
  );

  const gateRibsGeometries = useMemo(() =>
    buildGateRibsGeometries(gateShape, gateWidth, gateHeight, gateBottomY, gateInclination, wallThickness),
    [gateShape, gateWidth, gateHeight, gateBottomY, gateInclination, wallThickness]
  );

  const halfWT = wallThickness / 2;

  const upstreamWaterGeom = useMemo(() => {
    if (upstreamLevel <= 0) return null;
    const geom = new THREE.BoxGeometry(reservoirLength, upstreamLevel, channelWidth);
    geom.translate(0, upstreamLevel / 2, 0);
    if (gateInclination !== 90) {
      const angleRad = (gateInclination * Math.PI) / 180;
      const yx = 1 / Math.tan(angleRad);
      const shearMatrix = new THREE.Matrix4().makeShear(0, 0, yx, 0, 0, 0);
      geom.applyMatrix4(shearMatrix);
    }
    geom.translate(-reservoirLength / 2 - halfWT, 0, 0);
    return geom;
  }, [upstreamLevel, reservoirLength, channelWidth, gateInclination, halfWT]);

  const downstreamWaterGeom = useMemo(() => {
    if (downstreamLevel <= 0) return null;
    const geom = new THREE.BoxGeometry(reservoirLength, downstreamLevel, channelWidth);
    geom.translate(0, downstreamLevel / 2, 0);
    if (gateInclination !== 90) {
      const angleRad = (gateInclination * Math.PI) / 180;
      const yx = 1 / Math.tan(angleRad);
      const shearMatrix = new THREE.Matrix4().makeShear(0, 0, yx, 0, 0, 0);
      geom.applyMatrix4(shearMatrix);
    }
    geom.translate(reservoirLength / 2 + halfWT, 0, 0);
    return geom;
  }, [downstreamLevel, reservoirLength, channelWidth, gateInclination, halfWT]);

  const angleRad = (gateInclination * Math.PI) / 180;
  const slideDist = (gateAbertura / 100) * gateHeight;
  const slideDy = slideDist * Math.sin(angleRad);
  const slideDx = gateInclination === 90 ? 0 : slideDy / Math.tan(angleRad);

  const flowGeometry = useMemo(() => {
    if (gateAbertura <= 0 || upstreamLevel <= 0) return null;
    const geom = new THREE.BoxGeometry(wallThickness, slideDy, gateWidth);
    geom.translate(0, gateBottomY + slideDy / 2, 0);
    if (gateInclination !== 90) {
      const yx = 1 / Math.tan(angleRad);
      geom.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, yx, 0, 0, 0));
    }
    return geom;
  }, [gateAbertura, upstreamLevel, wallThickness, gateWidth, gateBottomY, gateInclination, angleRad, slideDy]);

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

          {/* ── Gate Plate (sits inside the wall, thinner than the wall) ── */}
          {hasGate && (
            <group position={[slideDx, slideDy, 0]}>
              <mesh
                geometry={gateGeometry}
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
              
              {gateRibsGeometries.map((geom, idx) => (
                <mesh key={idx} geometry={geom} castShadow receiveShadow>
                  <meshStandardMaterial color="#64748b" roughness={0.5} metalness={0.9} />
                  <Edges color="#0f172a" threshold={15} opacity={0.8} transparent />
                </mesh>
              ))}
            </group>
          )}

          {/* ── Water Flow (through the gap) ── */}
          {flowGeometry && (
            <mesh geometry={flowGeometry} receiveShadow>
              <AnimatedWaterMaterial />
            </mesh>
          )}

          {/* ── Upstream Water (−X side) ── */}
          {upstreamWaterGeom && (
            <mesh geometry={upstreamWaterGeom} position={[0, 0, 0]} receiveShadow>
              <AnimatedWaterMaterial />
            </mesh>
          )}

          {/* ── Downstream Water (+X side) ── */}
          {downstreamWaterGeom && (
            <mesh geometry={downstreamWaterGeom} position={[0, 0, 0]} receiveShadow>
              <AnimatedWaterMaterial />
            </mesh>
          )}

          {/* ── Analysis Overlays ── */}
          {isAnalyzed && showVectors && hasGate && (
            <>
              {upstreamLevel > 0 && gateTopY > 0 && (
                <PressureDistribution3D
                  level={upstreamLevel}
                  inclinationAngle={gateInclination}
                  actualBaseWidth={wallThickness}
                  offsetX={halfWT}
                  isUpstream={true}
                  color="#38bdf8"
                  channelWidth={gateWidth}
                  damHeight={wallHeight}
                  startY={gateBottomY}
                  endY={gateTopY}
                />
              )}
              {downstreamLevel > 0 && gateBottomY < downstreamLevel && (
                <PressureDistribution3D
                  level={downstreamLevel}
                  inclinationAngle={gateInclination}
                  actualBaseWidth={wallThickness}
                  offsetX={halfWT}
                  isUpstream={false}
                  color="#38bdf8"
                  channelWidth={gateWidth}
                  damHeight={wallHeight}
                  damCrestWidth={wallThickness}
                />
              )}
              {force > 0 && (
                <EmpuxoVector3D
                  force={force}
                  y_cp={gateTopY - s_cp}
                  s_cp={s_cp}
                  inclinationAngle={gateInclination}
                  damHeight={wallHeight}
                  actualBaseWidth={wallThickness}
                  offsetX={halfWT}
                  isUpstream={true}
                  label="FR"
                  color="#ef4444"
                />
              )}
            </>
          )}
        </BarragemCanvas>
      </div>
    </div>
  );
};
