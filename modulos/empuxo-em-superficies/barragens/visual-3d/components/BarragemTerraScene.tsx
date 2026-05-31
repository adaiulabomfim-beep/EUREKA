import React, { useMemo } from 'react';
import { Edges } from '@react-three/drei';
import { buildBarragemTerra } from '../builders/buildBarragemTerra';
import { buildAguaTerra } from '../builders/buildAguaTerra';
import { HatchMaterial } from '../core/materials';
import { AnimatedWaterMaterial } from './AnimatedWater';
import { GroundPlane } from './GroundPlane';
import { construirGeometria } from '../../tipos/terra-enrocamento/geometria';
import { EmpuxoVector3D } from './EmpuxoVector3D';
import { PressureDistribution3D } from './PressureDistribution3D';

export const BarragemTerraScene: React.FC<any> = ({
  damHeight,
  damBaseWidth,
  damCrestWidth,
  inclinationAngle,
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
    return buildBarragemTerra(
      damHeight,
      damBaseWidth,
      damCrestWidth,
      inclinationAngle,
      channelWidth
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth]);

  const upstreamGeometry = useMemo(() => {
    return buildAguaTerra(
      damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth, upstreamLevel, 'UPSTREAM'
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth, upstreamLevel]);

  const downstreamGeometry = useMemo(() => {
    return buildAguaTerra(
      damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth, downstreamLevel, 'DOWNSTREAM'
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth, downstreamLevel]);

  return (
    <group>
      <GroundPlane damHeight={damHeight} damBaseWidth={damBaseWidth} channelWidth={channelWidth} actualBaseWidth={actualBaseWidth} />

      {/* Earth Dam Solid */}
      <mesh geometry={damGeometry} castShadow receiveShadow>
         <HatchMaterial type="earthDam" />
         <Edges color="#6F4F28" threshold={15} opacity={0.5} transparent />
      </mesh>

      {/* Upstream Water */}
      {upstreamGeometry && (
        <mesh geometry={upstreamGeometry} receiveShadow>
          <AnimatedWaterMaterial />
        </mesh>
      )}

      {/* Downstream Water */}
      {downstreamGeometry && (
        <mesh geometry={downstreamGeometry} receiveShadow>
          <AnimatedWaterMaterial />
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
                color="#2563eb" // Bright royal blue (same configuration as 2D)
                channelWidth={channelWidth}
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
                color="#3b82f6" // Bright sky blue (same configuration as 2D)
                channelWidth={channelWidth}
                damHeight={damHeight}
                damCrestWidth={damCrestWidth}
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
            />
          )}
        </>
      )}
    </group>
  );
};
