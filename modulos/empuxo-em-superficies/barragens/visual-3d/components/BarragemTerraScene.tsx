import React, { useMemo } from 'react';
import { Edges } from '@react-three/drei';
import { buildBarragemTerra } from '../builders/buildBarragemTerra';
import { buildAguaTerra } from '../builders/buildAguaTerra';
import { HatchMaterial } from '../core/materials';
import { AnimatedWaterMaterial } from './AnimatedWater';
import { GroundPlane } from './GroundPlane';
import { construirGeometria } from '../../tipos/terra-enrocamento/geometria';
import { obterAnguloJusanteDoPerfil } from '../../calculos/hidrostaticaSuperficieInclinada';
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
  hasMudLayer = false,
  mudHeight = 0,
  mudDensity = 1500,
  unitSystem = 'SI',
  gravity = 9.81,
  force,
  forceH,
  forceV,
  s_cp,
  y_cp,
  up,
  down,
  isAnalyzed,
  showVectors
}) => {
  const { profile, actualBaseWidth } = useMemo(() => construirGeometria(
    damHeight, damBaseWidth, damCrestWidth, inclinationAngle
  ), [damHeight, damBaseWidth, damCrestWidth, inclinationAngle]);

  const downstreamFaceAngle = useMemo(() => obterAnguloJusanteDoPerfil(profile), [profile]);
  const effMudHeight = hasMudLayer && mudHeight > 0 ? Math.min(mudHeight, upstreamLevel) : 0;
  const mudRatio = Math.max(0.1, mudDensity / 1000);
  const maxUpEffLevel = effMudHeight > 0 ? (upstreamLevel - effMudHeight) + mudRatio * effMudHeight : upstreamLevel;
  const maxPressureLevel = Math.max(maxUpEffLevel, downstreamLevel);

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
          <AnimatedWaterMaterial minY={0} maxY={upstreamLevel} />
        </mesh>
      )}

      {/* Downstream Water */}
      {downstreamGeometry && (
        <mesh geometry={downstreamGeometry} receiveShadow>
          <AnimatedWaterMaterial minY={0} maxY={downstreamLevel} />
        </mesh>
      )}

      {/* Analysis Overlays */}
      {isAnalyzed && showVectors && (
        <>
          {up && up.FR > 0 && (
            <PressureDistribution3D
              level={upstreamLevel}
              maxPressureLevel={maxPressureLevel}
              inclinationAngle={inclinationAngle}
              actualBaseWidth={actualBaseWidth}
              offsetX={actualBaseWidth / 2}
              isUpstream={true}
              color="#2563eb"
              channelWidth={channelWidth}
              mudHeight={effMudHeight}
              mudDensityRatio={mudRatio}
            />
          )}
          {down && down.FR > 0 && (
            <PressureDistribution3D
              level={downstreamLevel}
              maxPressureLevel={maxPressureLevel}
              inclinationAngle={inclinationAngle}
              downstreamFaceAngle={downstreamFaceAngle}
              actualBaseWidth={actualBaseWidth}
              offsetX={actualBaseWidth / 2}
              isUpstream={false}
              color="#3b82f6"
              channelWidth={channelWidth}
              damHeight={damHeight}
              damCrestWidth={damCrestWidth}
            />
          )}
          {force !== 0 && (
            <EmpuxoVector3D
              force={force}
              forceH={forceH}
              forceV={forceV}
              y_cp={y_cp}
              s_cp={s_cp}
              inclinationAngle={inclinationAngle}
              downstreamAngle={downstreamFaceAngle}
              damHeight={damHeight}
              actualBaseWidth={actualBaseWidth}
              offsetX={actualBaseWidth / 2}
              isUpstream={(forceH ?? force) >= 0}
              label={(forceH ?? force) >= 0 ? "Resultante (Net)" : "Resultante (Jusante)"}
              color={(forceH ?? force) >= 0 ? "#ef4444" : "#f59e0b"}
              unitSystem={unitSystem}
              gravity={gravity}
            />
          )}
        </>
      )}
    </group>
  );
};
