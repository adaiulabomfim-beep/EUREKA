import React, { useMemo } from 'react';
import { Edges } from '@react-three/drei';
import { buildBarragemArcoGeometry } from '../builders/buildBarragemArco';
import { buildAguaArcoGeometry } from '../builders/buildAguaArco';
import { HatchMaterial } from '../core/materials';
import { AnimatedWaterMaterial } from './AnimatedWater';
import { GroundPlane } from './GroundPlane';
import { construirGeometria } from '../../tipos/arco/geometria';
import { EmpuxoVector3D } from './EmpuxoVector3D';
import { PressureDistribution3D } from './PressureDistribution3D';

export const BarragemArcoScene: React.FC<any> = ({
  damHeight,
  damBaseWidth,
  damCrestWidth,
  inclinationAngle,
  archRadius,
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
  const { actualBaseWidth } = useMemo(() => construirGeometria(
    damHeight, damBaseWidth, damCrestWidth, inclinationAngle
  ), [damHeight, damBaseWidth, damCrestWidth, inclinationAngle]);

  const damGeometry = useMemo(() => {
    return buildBarragemArcoGeometry(
      damHeight,
      damBaseWidth,
      damCrestWidth,
      inclinationAngle,
      archRadius,
      channelWidth,
      64 // Higher segment count for smooth curve
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, archRadius, channelWidth]);

  const upstreamGeometry = useMemo(() => {
    return buildAguaArcoGeometry(
      damHeight, damBaseWidth, damCrestWidth, inclinationAngle, archRadius, channelWidth, upstreamLevel, 'UPSTREAM'
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, archRadius, channelWidth, upstreamLevel]);

  const downstreamGeometry = useMemo(() => {
    return buildAguaArcoGeometry(
      damHeight, damBaseWidth, damCrestWidth, inclinationAngle, archRadius, channelWidth, downstreamLevel, 'DOWNSTREAM'
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, archRadius, channelWidth, downstreamLevel]);

  return (
    <group>
      <GroundPlane damHeight={damHeight} damBaseWidth={damBaseWidth} channelWidth={channelWidth} />

      {/* Arch Dam Solid */}
      <mesh geometry={damGeometry} castShadow receiveShadow>
         <HatchMaterial type="concrete" />
         <Edges color="#545e69" threshold={15} opacity={0.45} transparent />
      </mesh>

      {/* Upstream Water */}
      {upstreamGeometry && (
        <mesh geometry={upstreamGeometry} receiveShadow>
          <AnimatedWaterMaterial />
          <Edges color="#2652a3" threshold={15} opacity={0.4} transparent />
        </mesh>
      )}

      {/* Downstream Water */}
      {downstreamGeometry && (
        <mesh geometry={downstreamGeometry} receiveShadow>
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
                offsetX={damBaseWidth / 2}
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
                offsetX={damBaseWidth / 2}
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
                offsetX={damBaseWidth / 2}
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
                offsetX={damBaseWidth / 2}
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
              offsetX={damBaseWidth / 2}
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
