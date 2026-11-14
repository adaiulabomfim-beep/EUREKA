import React, { useMemo } from 'react';
import { Edges, Html, Cylinder, Cone, Sphere } from '@react-three/drei';
import { buildBarragemGravidade } from '../builders/buildBarragemGravidade';
import { buildAguaGravidade } from '../builders/buildAguaGravidade';
import { HatchMaterial } from '../core/materials';
import { AnimatedWaterMaterial } from './AnimatedWater';
import { GroundPlane } from './GroundPlane';
import { construirGeometria } from '../../tipos/gravidade/geometria';
import { obterAnguloJusanteDoPerfil } from '../../calculos/hidrostaticaSuperficieInclinada';
import { EmpuxoVector3D } from './EmpuxoVector3D';
import { PressureDistribution3D } from './PressureDistribution3D';

export const BarragemScene: React.FC<any> = ({
  damHeight,
  damBaseWidth,
  damCrestWidth,
  damWidth = 1,
  inclinationAngle,
  channelWidth = 40,
  upstreamLevel = 0,
  downstreamLevel = 0,
  hasMudLayer = false,
  mudHeight = 0,
  mudDensity = 1500,
  hasPercolation = false,
  showTriangularMode = false,
  stability,
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
    return buildBarragemGravidade(
      damHeight,
      damBaseWidth,
      damCrestWidth,
      inclinationAngle,
      channelWidth
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth]);

  const mudGeometry = useMemo(() => {
    if (effMudHeight <= 1e-6) return null;
    return buildAguaGravidade(
      damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth, effMudHeight, 'UPSTREAM', 0
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth, effMudHeight]);

  const upstreamGeometry = useMemo(() => {
    return buildAguaGravidade(
      damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth, upstreamLevel, 'UPSTREAM', effMudHeight
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth, upstreamLevel, effMudHeight]);

  const downstreamGeometry = useMemo(() => {
    return buildAguaGravidade(
      damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth, downstreamLevel, 'DOWNSTREAM'
    );
  }, [damHeight, damBaseWidth, damCrestWidth, inclinationAngle, channelWidth, downstreamLevel]);

  const isTriangularABC = Boolean(
    showTriangularMode || (damCrestWidth <= 0.01 && damWidth > 1.001)
  );
  const offsetX = actualBaseWidth / 2;
  const bLong = stability?.damWidth ?? damWidth ?? 1;

  return (
    <group>
      <GroundPlane damHeight={damHeight} damBaseWidth={damBaseWidth} channelWidth={channelWidth} actualBaseWidth={actualBaseWidth} />

      {/* Gravity Dam Solid */}
      <mesh geometry={damGeometry} castShadow receiveShadow>
         <HatchMaterial type="concrete" />
         <Edges color="#545e69" threshold={15} opacity={0.45} transparent />
      </mesh>

      {/* Mud Layer */}
      {mudGeometry && (
        <mesh geometry={mudGeometry} receiveShadow>
          <meshStandardMaterial color="#78350f" roughness={0.9} transparent opacity={0.92} />
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

      {/* 3D Vertex Labels A, B, C for Triangular Dam Mode */}
      {isTriangularABC && (
        <group>
          <Html position={[actualBaseWidth - offsetX, damHeight + 2.5, channelWidth / 2]} center style={{ pointerEvents: 'none' }}>
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center border-2 border-white shadow">
              A
            </div>
          </Html>
          <Html position={[-offsetX - 1.5, 2.0, channelWidth / 2]} center style={{ pointerEvents: 'none' }}>
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center border-2 border-white shadow">
              B
            </div>
          </Html>
          <Html position={[actualBaseWidth - offsetX + 2.0, 2.0, channelWidth / 2]} center style={{ pointerEvents: 'none' }}>
            <div className="w-6 h-6 rounded-full bg-orange-600 text-white text-[11px] font-black flex items-center justify-center border-2 border-white shadow">
              C
            </div>
          </Html>
        </group>
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
              offsetX={offsetX}
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
              offsetX={offsetX}
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
              offsetX={offsetX}
              isUpstream={(forceH ?? force) >= 0}
              label={(forceH ?? force) >= 0 ? "Resultante (Net)" : "Resultante (Jusante)"}
              color={(forceH ?? force) >= 0 ? "#ef4444" : "#f59e0b"}
              unitSystem={unitSystem}
              gravity={gravity}
              damWidth={bLong}
              showTriangularMode={isTriangularABC}
            />
          )}

          {/* Peso Próprio W em 3D no CG */}
          {stability && stability.weight > 0 && (
            (() => {
              const xCg3D = stability.x_cg - offsetX;
              const yCg3D = stability.y_cg;
              const wLen = Math.max(8, Math.min(18, damHeight * 0.22));
              const wTotalText = isTriangularABC
                ? unitSystem === 'TECNICO_KGF'
                  ? `W = ${((stability.weight * bLong) / gravity).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kgf`
                  : `W = ${((stability.weight * bLong) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kN`
                : `W = ${(stability.weight / 1000).toFixed(1)} kN/m`;
              return (
                <group position={[xCg3D, yCg3D, 0]}>
                  <Sphere args={[0.45, 16, 16]}>
                    <meshStandardMaterial color="#b91c1c" emissive="#ffffff" emissiveIntensity={0.4} />
                  </Sphere>
                  <Cylinder args={[0.18, 0.18, wLen - 1.5, 12]} position={[0, -(wLen - 1.5) / 2, 0]}>
                    <meshStandardMaterial color="#b91c1c" emissive="#b91c1c" emissiveIntensity={0.9} />
                  </Cylinder>
                  <Cone args={[0.45, 1.5, 12]} position={[0, -wLen + 0.75, 0]} rotation={[Math.PI, 0, 0]}>
                    <meshStandardMaterial color="#b91c1c" emissive="#b91c1c" emissiveIntensity={0.9} />
                  </Cone>
                  <Html position={[0, 1.8, 0]} center style={{ pointerEvents: 'none' }}>
                    <div className="bg-white/95 backdrop-blur-sm text-[10.5px] font-extrabold px-2 py-0.5 rounded-full shadow border border-red-300 text-red-800 whitespace-nowrap">
                      CG • {wTotalText}
                    </div>
                  </Html>
                </group>
              );
            })()
          )}

          {/* Subpressão U sob a base BC em 3D quando Percolação está ativa */}
          {hasPercolation && stability?.analisePontoC?.subpressao?.ativa && (
            (() => {
              const sub = stability.analisePontoC.subpressao;
              const xU3D = sub.x_U - offsetX;
              const uLen = Math.max(8, Math.min(16, damHeight * 0.2));
              const uTotalText = isTriangularABC
                ? unitSystem === 'TECNICO_KGF'
                  ? `U = ${(sub.U_total / gravity).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kgf`
                  : `U = ${(sub.U_total / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kN`
                : `U = ${(sub.U_por_metro / 1000).toFixed(1)} kN/m`;
              return (
                <group position={[xU3D, 0, 0]}>
                  <Cylinder args={[0.18, 0.18, uLen - 1.5, 12]} position={[0, -(uLen + 1.5) / 2, 0]}>
                    <meshStandardMaterial color="#7e22ce" emissive="#7e22ce" emissiveIntensity={0.9} />
                  </Cylinder>
                  <Cone args={[0.45, 1.5, 12]} position={[0, -0.75, 0]}>
                    <meshStandardMaterial color="#7e22ce" emissive="#7e22ce" emissiveIntensity={0.9} />
                  </Cone>
                  <Html position={[0, -uLen - 1.2, 0]} center style={{ pointerEvents: 'none' }}>
                    <div className="bg-white/95 backdrop-blur-sm text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full shadow border border-purple-300 text-purple-800 whitespace-nowrap">
                      {uTotalText}
                    </div>
                  </Html>
                </group>
              );
            })()
          )}
        </>
      )}
    </group>
  );
};
