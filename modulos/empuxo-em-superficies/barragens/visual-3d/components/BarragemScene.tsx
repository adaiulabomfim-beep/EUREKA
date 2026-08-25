import React, { useMemo } from 'react';
import { Edges, Html } from '@react-three/drei';
import { buildBarragemGravidade } from '../builders/buildBarragemGravidade';
import { buildAguaGravidade } from '../builders/buildAguaGravidade';
import { HatchMaterial } from '../core/materials';
import { AnimatedWaterMaterial } from './AnimatedWater';
import { GroundPlane } from './GroundPlane';
import { construirGeometria } from '../../tipos/gravidade/geometria';
import { calcularHidrostatica, calcularEstabilidade } from '../../tipos/gravidade/calculos';
import { EmpuxoVector3D } from './EmpuxoVector3D';
import { PressureDistribution3D } from './PressureDistribution3D';

export const BarragemScene: React.FC<any> = ({
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
    return buildBarragemGravidade(
      damHeight,
      damBaseWidth,
      damCrestWidth,
      inclinationAngle,
      channelWidth
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth]);

  const upstreamGeometry = useMemo(() => {
    return buildAguaGravidade(
      damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth, upstreamLevel, 'UPSTREAM'
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth, upstreamLevel]);

  const downstreamGeometry = useMemo(() => {
    return buildAguaGravidade(
      damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth, downstreamLevel, 'DOWNSTREAM'
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth, downstreamLevel]);

  const hidrost = useMemo(() => {
    return calcularHidrostatica(damHeight, inclinationAngle, upstreamLevel, downstreamLevel, 1000 * 9.81);
  }, [damHeight, inclinationAngle, upstreamLevel, downstreamLevel]);

  const estab = useMemo(() => {
    return calcularEstabilidade(damHeight, damBaseWidth, damCrestWidth, upstreamLevel, downstreamLevel, force, y_cp);
  }, [damHeight, damBaseWidth, damCrestWidth, upstreamLevel, downstreamLevel, force, y_cp]);

  return (
    <group>
      <GroundPlane damHeight={damHeight} damBaseWidth={damBaseWidth} channelWidth={channelWidth} actualBaseWidth={actualBaseWidth} />

      {/* Gravity Dam Solid */}
      <mesh geometry={damGeometry} castShadow receiveShadow>
         <HatchMaterial type="concrete" />
         <Edges color="#545e69" threshold={15} opacity={0.45} transparent />
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
                color="#38bdf8" // Match 2D bright sky blue
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
                color="#38bdf8" // Match 2D bright sky blue
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
              label={force > 0 ? "FR" : "FR (Jusante)"}
              color={force > 0 ? "#ef4444" : "#f59e0b"}
            />
          )}

        </>
      )}
    </group>
  );
};
