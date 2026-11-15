import React, { useMemo } from 'react';
import { Edges } from '@react-three/drei';
import { buildBarragemArcoGeometry } from '../builders/buildBarragemArco';
import { buildAguaArcoGeometry } from '../builders/buildAguaArco';
import { HatchMaterial } from '../core/materials';
import { AnimatedWaterMaterial } from './AnimatedWater';
import { GroundPlane } from './GroundPlane';
import { construirGeometria } from '../../tipos/arco/geometria';
import { obterAnguloJusanteDoPerfil } from '../../calculos/hidrostaticaSuperficieInclinada';
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
    return buildBarragemArcoGeometry(
      damHeight,
      damBaseWidth,
      damCrestWidth,
      inclinationAngle,
      archRadius,
      channelWidth,
      64
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, archRadius, channelWidth]);

  const mudGeometry = useMemo(() => {
    if (effMudHeight <= 1e-6) return null;
    return buildAguaArcoGeometry(
      damHeight, damBaseWidth, damCrestWidth, inclinationAngle, archRadius, channelWidth, effMudHeight, 'UPSTREAM', 64, 0
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, archRadius, channelWidth, effMudHeight]);

  const upstreamGeometry = useMemo(() => {
    return buildAguaArcoGeometry(
      damHeight, damBaseWidth, damCrestWidth, inclinationAngle, archRadius, channelWidth, upstreamLevel, 'UPSTREAM', 64, effMudHeight
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, archRadius, channelWidth, upstreamLevel, effMudHeight]);

  const downstreamGeometry = useMemo(() => {
    return buildAguaArcoGeometry(
      damHeight, damBaseWidth, damCrestWidth, inclinationAngle, archRadius, channelWidth, downstreamLevel, 'DOWNSTREAM'
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, archRadius, channelWidth, downstreamLevel]);

  return (
    <group>
      <GroundPlane damHeight={damHeight} damBaseWidth={damBaseWidth} channelWidth={channelWidth} actualBaseWidth={actualBaseWidth} />

      {/* Arch Dam Solid */}
      <mesh geometry={damGeometry} castShadow receiveShadow>
         <HatchMaterial type="concrete" />
         <Edges color="#545e69" threshold={15} opacity={0.45} transparent />
      </mesh>

      {/* Bottom Dense Liquid / Mud Layer */}
      {mudGeometry && (
        <mesh geometry={mudGeometry} receiveShadow>
          <meshStandardMaterial color="#78350f" roughness={0.85} transparent opacity={0.92} />
        </mesh>
      )}

      {/* Upstream Water */}
      {upstreamGeometry && (
        <mesh geometry={upstreamGeometry} receiveShadow>
          <AnimatedWaterMaterial minY={effMudHeight} maxY={upstreamLevel} />
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
              color="#1e3a8a"
              channelWidth={channelWidth}
              archRadius={archRadius}
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
              color="#0f172a"
              channelWidth={channelWidth}
              archRadius={archRadius}
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
