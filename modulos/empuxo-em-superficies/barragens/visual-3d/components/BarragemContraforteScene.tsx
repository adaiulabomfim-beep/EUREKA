import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import { getContraforteShapes } from '../builders/buildBarragemContraforte';
import { construirGeometria } from '../../tipos/contraforte/geometria';
import { getDamXAtYGeneric } from '../../visual/auxiliaresGeometriaCena';
import { HatchMaterial } from '../core/materials';
import { AnimatedWaterMaterial } from './AnimatedWater';
import { GroundPlane } from './GroundPlane';
import { EmpuxoVector3D } from './EmpuxoVector3D';
import { PressureDistribution3D } from './PressureDistribution3D';

export const BarragemContraforteScene: React.FC<any> = ({
  damHeight,
  damBaseWidth,
  damCrestWidth,
  inclinationAngle,
  buttressAngle = 45,
  channelWidth = 40,
  upstreamLevel = 0,
  downstreamLevel = 0,
  force,
  s_cp,
  y_cp,
  up,
  down,
  isAnalyzed,
  showVectors
}) => {
  const { wallShape, buttressShape, waterShapes, actualBaseWidth } = useMemo(() => {
    const shapes = getContraforteShapes(
      damHeight,
      damBaseWidth,
      damCrestWidth,
      inclinationAngle,
      buttressAngle
    );

    const { wallProfile, actualBaseWidth } = construirGeometria(
      damHeight, damBaseWidth, damCrestWidth, inclinationAngle, buttressAngle
    );
    const toWorldX = (x: number) => x - actualBaseWidth / 2;
    const getDamXAtY = (y: number, side: 'UPSTREAM' | 'DOWNSTREAM') => getDamXAtYGeneric(wallProfile, y, side);

    let upWaterShape = null;
    let downWaterShape = null;
    
    if (upstreamLevel > 0) {
      const farLeft = toWorldX(getDamXAtY(0, 'UPSTREAM') - damHeight * 1.5);
      const faceBase = toWorldX(getDamXAtY(0, 'UPSTREAM'));
      const faceTop = toWorldX(getDamXAtY(upstreamLevel, 'UPSTREAM'));
      
      const s = new THREE.Shape();
      s.moveTo(farLeft, 0);
      s.lineTo(faceBase, 0);
      s.lineTo(faceTop, upstreamLevel);
      s.lineTo(farLeft, upstreamLevel);
      s.lineTo(farLeft, 0);
      upWaterShape = s;
    }

    if (downstreamLevel > 0) {
      const buttressEnd = toWorldX(actualBaseWidth);
      const farRight = buttressEnd + damHeight * 1.5;
      
      const s = new THREE.Shape();
      s.moveTo(farRight, 0);
      s.lineTo(farRight, downstreamLevel);
      const faceTop = toWorldX(getDamXAtY(downstreamLevel, 'DOWNSTREAM'));
      const faceBase = toWorldX(getDamXAtY(0, 'DOWNSTREAM'));
      
      s.lineTo(faceTop, downstreamLevel);
      s.lineTo(faceBase, 0);
      s.lineTo(farRight, 0);
      
      downWaterShape = s;
    }

    return { 
      wallShape: shapes.wallShape, 
      buttressShape: shapes.buttressShape,
      waterShapes: { up: upWaterShape, down: downWaterShape },
      actualBaseWidth 
    };
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, buttressAngle, upstreamLevel, downstreamLevel]);

  const buttressWidth = channelWidth * 0.04;
  const buttressOffsets = [-0.4, -0.2, 0, 0.2, 0.4].map(f => f * channelWidth);

  const wallExtrudeSettings = { depth: channelWidth, bevelEnabled: false };
  const buttressExtrudeSettings = { depth: buttressWidth, bevelEnabled: false };
  const waterExtrudeSettings = { depth: channelWidth, bevelEnabled: false };

  return (
    <group>
      <GroundPlane damHeight={damHeight} damBaseWidth={damBaseWidth} channelWidth={channelWidth} />

      {/* Main Wall Face */}
      <mesh position={[0, 0, -channelWidth / 2]} castShadow receiveShadow>
         <extrudeGeometry args={[wallShape, wallExtrudeSettings]} />
         <HatchMaterial type="concrete" />
         <Edges color="#545e69" threshold={15} opacity={0.45} transparent />
      </mesh>

      {/* Buttresses */}
      {buttressOffsets.map((offset, i) => (
        <mesh key={i} position={[0, 0, offset - buttressWidth / 2]} castShadow receiveShadow>
          <extrudeGeometry args={[buttressShape, buttressExtrudeSettings]} />
          <HatchMaterial type="concrete" />
          <Edges color="#545e69" threshold={15} opacity={0.45} transparent />
        </mesh>
      ))}

      {/* Upstream Water */}
      {waterShapes.up && (
        <mesh position={[0, 0, -channelWidth / 2]} receiveShadow>
          <extrudeGeometry args={[waterShapes.up, waterExtrudeSettings]} />
          <AnimatedWaterMaterial />
          <Edges color="#2652a3" threshold={15} opacity={0.4} transparent />
        </mesh>
      )}

      {/* Downstream Water */}
      {waterShapes.down && (
        <mesh position={[0, 0, -channelWidth / 2]} receiveShadow>
          <extrudeGeometry args={[waterShapes.down, waterExtrudeSettings]} />
          <AnimatedWaterMaterial />
          <Edges color="#2652a3" threshold={15} opacity={0.4} transparent />
        </mesh>
      )}

      {/* Analysis Overlays */}
      {isAnalyzed && showVectors && (
        <>
          {up && up.FR > 0 && (
            <>
              <PressureDistribution3D
                level={upstreamLevel}
                inclinationAngle={inclinationAngle}
                actualBaseWidth={actualBaseWidth}
                offsetX={actualBaseWidth / 2}
                isUpstream={true}
                color="#1e3a8a"
                channelWidth={channelWidth}
              />
              <EmpuxoVector3D
                force={up.FR}
                y_cp={up.y_cp}
                s_cp={up.s_cp}
                inclinationAngle={inclinationAngle}
                damHeight={damHeight}
                actualBaseWidth={actualBaseWidth}
                offsetX={actualBaseWidth / 2}
                isUpstream={true}
                label="Montante"
                color="#3b82f6" // blue
              />
            </>
          )}
          {down && down.FR > 0 && (
            <>
              <PressureDistribution3D
                level={downstreamLevel}
                inclinationAngle={inclinationAngle}
                actualBaseWidth={actualBaseWidth}
                offsetX={actualBaseWidth / 2}
                isUpstream={false}
                color="#0c4a6e"
                channelWidth={channelWidth}
              />
              <EmpuxoVector3D
                force={down.FR}
                y_cp={down.y_cp}
                s_cp={down.s_cp}
                inclinationAngle={inclinationAngle}
                damHeight={damHeight}
                actualBaseWidth={actualBaseWidth}
                offsetX={actualBaseWidth / 2}
                isUpstream={false}
                label="Jusante"
                color="#0ea5e9" // sky-500
              />
            </>
          )}
          {force !== 0 && (
            <EmpuxoVector3D
              force={force}
              y_cp={y_cp}
              s_cp={s_cp}
              inclinationAngle={inclinationAngle}
              damHeight={damHeight}
              actualBaseWidth={actualBaseWidth}
              offsetX={actualBaseWidth / 2}
              isUpstream={force > 0}
              label={force > 0 ? "Resultante (Net)" : "Resultante (Jusante)"}
              color={force > 0 ? "#ef4444" : "#f59e0b"}
              zOffset={4}
            />
          )}
        </>
      )}
    </group>
  );
};
