import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Edges, Html } from '@react-three/drei';
import {
  FormaComporta,
  PosicaoDobradica,
  SistemaUnidades,
  ModoPosicionamentoComporta,
  FLUIDOS_PREDEFINIDOS,
} from '../dominio/tipos';

// Shared 3D components and materials
import { BarragemCanvas } from '../../barragens/visual-3d/components/BarragemCanvas';
import { HatchMaterial } from '../../barragens/visual-3d/core/materials';
import { AnimatedWaterMaterial } from '../../barragens/visual-3d/components/AnimatedWater';
import { Vista3DUI } from '../../barragens/visual-3d/components/Vista3DUI';

interface Scene3DProps {
  upstreamLevel: number;
  downstreamLevel: number;
  upstreamFluidKey?: string;
  downstreamFluidKey?: string;
  hasGate: boolean;
  gateShape: FormaComporta;
  gateWidth: number;
  gateHeight: number;
  gateDepthFromCrest: number;
  gateInclination: number;
  force: number;
  s_cp: number;
  hingePosition?: PosicaoDobradica;
  hasTieRod?: boolean;
  tieRodPosRel?: number;
  tieRodAngle?: number;
  isAnalyzed: boolean;
  is3D: boolean;
  setIs3D: (v: boolean) => void;
  showVectors: boolean;
  setShowVectors: (v: boolean) => void;
  onCalculate: () => void;
  onReset: () => void;
  wallDims: { height: number; thickness: number; width: number };
  sistemaUnidades?: SistemaUnidades;
  modoPosicionamento?: ModoPosicionamentoComporta;
  y_cg_direto?: number;
  [key: string]: any;
}

export const Scene3D: React.FC<Scene3DProps> = (props) => {
  const {
    upstreamLevel = 4.5,
    downstreamLevel = 0,
    upstreamFluidKey = 'agua',
    hasGate = true,
    gateShape = FormaComporta.CIRCULAR,
    gateWidth = 1.0,
    gateHeight = 1.0,
    gateDepthFromCrest = 0.5,
    gateInclination = 60,
    isAnalyzed,
    is3D,
    setIs3D,
    showVectors,
    setShowVectors,
    onCalculate,
    onReset,
    wallDims,
    sistemaUnidades = SistemaUnidades.TECNICO_KGF,
    modoPosicionamento,
    y_cg_direto,
  } = props;

  // 1. DIMENSÕES BÁSICAS E FÍSICA HIDROSTÁTICA
  const H = Math.max(0.1, gateHeight);
  const W = Math.max(0.1, gateWidth);
  const thetaDeg = Math.max(15, Math.min(90, gateInclination || 60));
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const sinTheta = Math.sin(thetaRad);
  const cosTheta = Math.cos(thetaRad);
  const tanTheta = Math.tan(thetaRad);

  const isKgf = sistemaUnidades === SistemaUnidades.TECNICO_KGF;
  const fluidInfo = FLUIDOS_PREDEFINIDOS[upstreamFluidKey] || FLUIDOS_PREDEFINIDOS.agua;
  const rho = fluidInfo.densidade || 1000;
  const g = 9.81;
  const gamma_N = rho * g;

  // Propriedades geométricas da seção molhada
  let y_cg_rel = H / 2;
  let Area = W * H;
  let Ixx = (W * Math.pow(H, 3)) / 12;

  if (gateShape === FormaComporta.CIRCULAR) {
    const r = H / 2;
    Area = Math.PI * Math.pow(r, 2);
    y_cg_rel = r;
    Ixx = (Math.PI * Math.pow(r, 4)) / 4;
  } else if (gateShape === FormaComporta.SEMI_CIRCULAR) {
    const r = H;
    Area = (Math.PI * Math.pow(r, 2)) / 2;
    y_cg_rel = (4 * r) / (3 * Math.PI);
    Ixx = Math.pow(r, 4) * (Math.PI / 8 - 8 / (9 * Math.PI));
  }

  // Posicionamento: Y_CG Direto vs h_topo
  const isDirectYCG =
    modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO &&
    y_cg_direto !== undefined &&
    y_cg_direto > 0;

  let h_top = Math.max(0, gateDepthFromCrest);
  let Y_CG = 0;
  let Y_top = 0;

  if (isDirectYCG) {
    Y_CG = y_cg_direto!;
    const h_CG_nom = Y_CG * sinTheta;
    h_top = Math.max(0, h_CG_nom - y_cg_rel * sinTheta);
    Y_top = Y_CG - y_cg_rel;
  } else {
    Y_top = h_top / sinTheta;
    Y_CG = Y_top + y_cg_rel;
  }

  const h_CG = Y_CG * sinTheta;
  const delta_y = Ixx / (Area * Math.max(0.001, Y_CG));
  const Y_CP = Y_CG + delta_y;
  const h_CP = Y_CP * sinTheta;
  const h_bot = h_top + H * sinTheta;

  // Pressões e Força Resultante (Empuxo)
  const p_top_Pa = gamma_N * h_top;
  const p_bot_Pa = gamma_N * h_bot;
  const p_cg_Pa = gamma_N * h_CG;
  const F_resultant_N = p_cg_Pa * Area;
  const F_resultant_kgf = F_resultant_N / g;
  const F_resultant_kN = F_resultant_N / 1000;

  const force_disp = isKgf
    ? `${Math.round(F_resultant_kgf).toLocaleString('pt-BR')} kgf`
    : `${F_resultant_kN.toFixed(2)} kN`;
  const force_sec_disp = isKgf
    ? `${F_resultant_kN.toFixed(2)} kN`
    : `${Math.round(F_resultant_kgf).toLocaleString('pt-BR')} kgf`;

  const p_top_disp = isKgf ? (p_top_Pa / g).toFixed(0) : (p_top_Pa / 1000).toFixed(1);
  const p_bot_disp = isKgf ? (p_bot_Pa / g).toFixed(0) : (p_bot_Pa / 1000).toFixed(1);
  const p_unit = isKgf ? 'kgf/m²' : 'kPa';

  // 2. SISTEMA DE COORDENADAS 3D
  // Nível da água montante em Y = upstreamLevel.
  // A face inclinada da comporta e parede corta a linha d'água em X = 0.
  // Para qualquer altura Y: X_face(Y) = (Y - upstreamLevel) / tan(theta).
  // Direção subindo o plano inclinado: u_slope = (cosTheta, sinTheta, 0)
  // Vetor normal apontando para a água montante: n_out = (-sinTheta, cosTheta, 0)
  // Vetor do empuxo sobre a comporta: F_dir = -n_out = (sinTheta, -cosTheta, 0)

  const X_CG = -Y_CG * cosTheta;
  const Y_CG_pos = upstreamLevel - h_CG;

  const X_CP = -Y_CP * cosTheta;
  const Y_CP_pos = upstreamLevel - h_CP;

  const X_top = -Y_top * cosTheta;
  const Y_top_pos = upstreamLevel - h_top;

  const X_bot = -(Y_top + H) * cosTheta;
  const Y_bot_pos = upstreamLevel - h_bot;

  // Dimensões do canal e parede
  const channelWidth = Math.max(12, W * 3.5, wallDims.width || 14);
  const wallHeight = Math.max(upstreamLevel + 2.2, 7.5, wallDims.height || 12);
  const wallCrestThick = Math.max(2.4, wallDims.thickness || 3.2);
  const reservoirLength = Math.max(16, wallHeight * 1.5);
  const groundThick = 2.5;

  const X_crest_front = (wallHeight - upstreamLevel) / tanTheta;
  const X_crest_back = X_crest_front + wallCrestThick;
  const X_bed_front = -upstreamLevel / tanTheta;

  // Base de rotação para colocar elementos orientados perfeitamente no plano inclinado
  const gateRotationMatrix = useMemo(() => {
    return new THREE.Matrix4().makeBasis(
      new THREE.Vector3(0, 0, 1),              // local X -> world Z (largura)
      new THREE.Vector3(cosTheta, sinTheta, 0), // local Y -> rampa inclinada subindo
      new THREE.Vector3(-sinTheta, cosTheta, 0) // local Z -> normal externa (para a água)
    );
  }, [cosTheta, sinTheta]);

  const gateQuaternion = useMemo(() => {
    return new THREE.Quaternion().setFromRotationMatrix(gateRotationMatrix);
  }, [gateRotationMatrix]);

  // 3. GEOMETRIA DA COMPORTA METÁLICA (PLACA SLAB INCLINADA)
  const plateGeometry = useMemo(() => {
    const plateThick = 0.16;
    const shape = new THREE.Shape();

    if (gateShape === FormaComporta.CIRCULAR) {
      const r = H / 2;
      const steps = 48;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const x = r * Math.sin(a);
        const y = r * Math.cos(a);
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
    } else if (gateShape === FormaComporta.SEMI_CIRCULAR) {
      const r = H;
      const steps = 32;
      shape.moveTo(-W / 2, -r / 2);
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI;
        const x = (W / 2) * Math.cos(a);
        const y = -r / 2 + r * Math.sin(a);
        shape.lineTo(x, y);
      }
      shape.lineTo(W / 2, -r / 2);
      shape.lineTo(-W / 2, -r / 2);
    } else {
      // Retangular
      const halfW = W / 2;
      const halfH = H / 2;
      shape.moveTo(-halfW, -halfH);
      shape.lineTo(halfW, -halfH);
      shape.lineTo(halfW, halfH);
      shape.lineTo(-halfW, halfH);
      shape.lineTo(-halfW, -halfH);
    }

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: plateThick,
      bevelEnabled: false,
    });
    // O topo da extrusão fica no plano da face da parede (+0.04m para destaque visual)
    geo.translate(0, 0, 0.04);
    return geo;
  }, [gateShape, H, W]);

  // Aro metálico / Guia estrutural da comporta
  const frameGeometry = useMemo(() => {
    if (gateShape === FormaComporta.CIRCULAR) {
      return new THREE.RingGeometry(H / 2, H / 2 + 0.14, 48);
    }
    return null;
  }, [gateShape, H]);

  // 4. GEOMETRIAS DO PARAMENTO DE CONCRETO (PAREDE INCLINADA COM VÃO)
  const abutmentLeftGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(X_bed_front, 0);
    shape.lineTo(X_crest_front, wallHeight);
    shape.lineTo(X_crest_back, wallHeight);
    shape.lineTo(X_crest_back, 0);
    shape.lineTo(X_bed_front, 0);

    const wAbut = (channelWidth - W) / 2;
    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: wAbut,
      bevelEnabled: false,
    });
    // Posicionar no lado esquerdo do canal
    geo.translate(0, 0, -channelWidth / 2);
    return geo;
  }, [X_bed_front, X_crest_front, X_crest_back, wallHeight, channelWidth, W]);

  const abutmentRightGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(X_bed_front, 0);
    shape.lineTo(X_crest_front, wallHeight);
    shape.lineTo(X_crest_back, wallHeight);
    shape.lineTo(X_crest_back, 0);
    shape.lineTo(X_bed_front, 0);

    const wAbut = (channelWidth - W) / 2;
    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: wAbut,
      bevelEnabled: false,
    });
    // Posicionar no lado direito do canal
    geo.translate(0, 0, W / 2);
    return geo;
  }, [X_bed_front, X_crest_front, X_crest_back, wallHeight, channelWidth, W]);

  // Verga superior acima do topo da comporta
  const upperLintelGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(X_top, Y_top_pos);
    shape.lineTo(X_crest_front, wallHeight);
    shape.lineTo(X_crest_back, wallHeight);
    shape.lineTo(X_crest_back, Y_top_pos);
    shape.lineTo(X_top, Y_top_pos);

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: W,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -W / 2);
    return geo;
  }, [X_top, Y_top_pos, X_crest_front, X_crest_back, wallHeight, W]);

  // Soleira inferior abaixo da base da comporta
  const lowerSillGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(X_bed_front, 0);
    shape.lineTo(X_bot, Y_bot_pos);
    shape.lineTo(X_crest_back, Y_bot_pos);
    shape.lineTo(X_crest_back, 0);
    shape.lineTo(X_bed_front, 0);

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: W,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -W / 2);
    return geo;
  }, [X_bed_front, X_bot, Y_bot_pos, X_crest_back, W]);

  // 5. VOLUME DE ÁGUA DE MONTANTE (CUNHA PERFEITA CONTRA A RAMPA INCLINADA)
  const upstreamWaterGeometry = useMemo(() => {
    if (upstreamLevel <= 0) return null;

    const shape = new THREE.Shape();
    shape.moveTo(-reservoirLength, 0);
    shape.lineTo(X_bed_front, 0);
    shape.lineTo(0, upstreamLevel);
    shape.lineTo(-reservoirLength, upstreamLevel);
    shape.lineTo(-reservoirLength, 0);

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: channelWidth,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -channelWidth / 2);
    return geo;
  }, [upstreamLevel, reservoirLength, X_bed_front, channelWidth]);

  // 6. PRISMA DE PRESSÃO HIDROSTÁTICA TRAPEZOIDAL 3D (QUANDO ANALISADO)
  const pressurePrismGeometry = useMemo(() => {
    if (!hasGate || !isAnalyzed || !showVectors) return null;

    const maxDiagWidth = Math.min(2.5, H * 0.7);
    const maxP = Math.max(1, p_bot_Pa);
    const w_top = (p_top_Pa / maxP) * maxDiagWidth;
    const w_bot = maxDiagWidth;

    const shape = new THREE.Shape();
    const halfH = H / 2;
    // No referencial local da comporta:
    // Y vai de -H/2 (base) a +H/2 (topo)
    // Z vai de 0 (face da comporta) a w (afastamento no sentido da água montante)
    shape.moveTo(-halfH, 0.05);
    shape.lineTo(halfH, 0.05);
    shape.lineTo(halfH, 0.05 + w_top);
    shape.lineTo(-halfH, 0.05 + w_bot);
    shape.lineTo(-halfH, 0.05);

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: W,
      bevelEnabled: false,
    });
    // Centralizar ao longo da largura (local X / world Z)
    // Rotacionar em local para que Z vire a espessura de carga
    geo.rotateY(Math.PI / 2);
    geo.translate(0, 0, 0);
    return geo;
  }, [hasGate, isAnalyzed, showVectors, H, W, p_top_Pa, p_bot_Pa]);

  // Comprimento do vetor força 3D
  const arrowLen = Math.max(3.5, Math.min(8.0, 2.5 + H * 1.2));
  const arrowOrigin = useMemo(() => {
    return new THREE.Vector3(
      X_CP - sinTheta * arrowLen,
      Y_CP_pos + cosTheta * arrowLen,
      0
    );
  }, [X_CP, Y_CP_pos, sinTheta, cosTheta, arrowLen]);

  const arrowTarget = useMemo(() => {
    return new THREE.Vector3(X_CP, Y_CP_pos, 0);
  }, [X_CP, Y_CP_pos]);

  return (
    <div className="w-full h-full relative" style={{ minHeight: 600 }}>
      {/* UI Flutuante de Controle e Análise */}
      <Vista3DUI
        is3D={is3D}
        setIs3D={setIs3D}
        showVectors={showVectors}
        setShowVectors={setShowVectors}
        isAnalyzed={isAnalyzed}
        onCalculate={onCalculate}
        onReset={onReset}
      />

      {/* Canvas Three.js com Câmera Órbita e Luzes */}
      <div className="w-full h-full" style={{ minHeight: 600 }}>
        <BarragemCanvas
          targetY={Math.max(1.5, Y_CG_pos)}
          cameraPosition={[
            -reservoirLength * 0.95,
            wallHeight * 0.85,
            channelWidth * 1.75,
          ]}
          fov={34}
          target={[-reservoirLength * 0.3, wallHeight * 0.3, 0]}
        >
          {/* ── Solo de Fundação ── */}
          <mesh position={[0, -groundThick / 2, 0]} receiveShadow>
            <boxGeometry
              args={[
                reservoirLength * 2 + wallCrestThick + 4,
                groundThick,
                channelWidth + 2,
              ]}
            />
            <HatchMaterial type="ground" />
            <Edges color="#4a2a0e" threshold={15} opacity={0.45} transparent />
          </mesh>

          {/* ── Paramento de Concreto (Encontro lateral e pilares) ── */}
          <mesh geometry={abutmentLeftGeometry} castShadow receiveShadow>
            <HatchMaterial type="concrete" />
            <Edges color="#475569" threshold={15} opacity={0.4} transparent />
          </mesh>
          <mesh geometry={abutmentRightGeometry} castShadow receiveShadow>
            <HatchMaterial type="concrete" />
            <Edges color="#475569" threshold={15} opacity={0.4} transparent />
          </mesh>

          {/* ── Verga Superior de Concreto ── */}
          <mesh geometry={upperLintelGeometry} castShadow receiveShadow>
            <HatchMaterial type="concrete" />
            <Edges color="#475569" threshold={15} opacity={0.4} transparent />
          </mesh>

          {/* ── Soleira Inferior de Concreto ── */}
          <mesh geometry={lowerSillGeometry} castShadow receiveShadow>
            <HatchMaterial type="concrete" />
            <Edges color="#475569" threshold={15} opacity={0.4} transparent />
          </mesh>

          {/* ── Placa da Comporta Metálica no Plano Inclinado ── */}
          {hasGate && (
            <group position={[X_CG, Y_CG_pos, 0]} quaternion={gateQuaternion}>
              <mesh geometry={plateGeometry} castShadow receiveShadow>
                <meshStandardMaterial
                  color="#94a3b8"
                  roughness={0.25}
                  metalness={0.85}
                />
                <Edges color="#0f172a" threshold={15} opacity={0.7} transparent />
              </mesh>

              {/* Guia/Aro Periférico */}
              {frameGeometry && (
                <mesh geometry={frameGeometry} position={[0, 0, 0.2]}>
                  <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
                </mesh>
              )}
            </group>
          )}

          {/* ── Volume de Água de Montante Conforme à Rampa ── */}
          {upstreamWaterGeometry && (
            <mesh geometry={upstreamWaterGeometry} receiveShadow>
              <AnimatedWaterMaterial />
            </mesh>
          )}

          {/* ── Água de Jusante (se ativada) ── */}
          {downstreamLevel > 0 && (
            <mesh
              position={[
                X_crest_back + reservoirLength / 2,
                downstreamLevel / 2,
                0,
              ]}
              receiveShadow
            >
              <boxGeometry args={[reservoirLength, downstreamLevel, channelWidth]} />
              <AnimatedWaterMaterial />
            </mesh>
          )}

          {/* ── ELEMENTOS DE ANÁLISE HIDROSTÁTICA (APENAS APÓS CLIQUE EM ANALISAR) ── */}
          {isAnalyzed && showVectors && hasGate && (
            <>
              {/* 1. Centróide da Seção Molhada (Ponto CG) */}
              <group position={[X_CG, Y_CG_pos, 0]}>
                <mesh>
                  <sphereGeometry args={[0.22, 24, 24]} />
                  <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={0.6}
                    roughness={0.1}
                  />
                </mesh>
                <mesh>
                  <sphereGeometry args={[0.24, 16, 16]} />
                  <meshBasicMaterial color="#0f172a" wireframe />
                </mesh>
                <Html
                  position={[0, 0.45, 0]}
                  center
                  distanceFactor={18}
                  className="pointer-events-none select-none"
                >
                  <div className="bg-slate-900/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap">
                    CG (h = {h_CG.toFixed(2)}m)
                  </div>
                </Html>
              </group>

              {/* 2. Centro de Pressão / Aplicação da Força (Ponto E / CP) */}
              <group position={[X_CP, Y_CP_pos, 0]}>
                <mesh>
                  <sphereGeometry args={[0.24, 24, 24]} />
                  <meshStandardMaterial
                    color="#ef4444"
                    emissive="#ef4444"
                    emissiveIntensity={0.9}
                    roughness={0.2}
                  />
                </mesh>
                {/* Anel de Pulso */}
                <mesh rotation={[0, 0, thetaRad]}>
                  <ringGeometry args={[0.3, 0.38, 32]} />
                  <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
                </mesh>
                <Html
                  position={[0, -0.45, 0]}
                  center
                  distanceFactor={18}
                  className="pointer-events-none select-none"
                >
                  <div className="bg-red-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-lg border border-red-400 whitespace-nowrap">
                    E / CP (h = {h_CP.toFixed(2)}m)
                  </div>
                </Html>
              </group>

              {/* 3. Prisma de Pressão Hidrostática 3D */}
              {pressurePrismGeometry && (
                <group position={[X_CG, Y_CG_pos, 0]} quaternion={gateQuaternion}>
                  <mesh geometry={pressurePrismGeometry}>
                    <meshStandardMaterial
                      color="#38bdf8"
                      transparent
                      opacity={0.45}
                      roughness={0.2}
                      side={THREE.DoubleSide}
                      depthWrite={false}
                    />
                    <Edges color="#2563eb" threshold={20} opacity={0.8} transparent />
                  </mesh>

                  {/* Badges de Pressões Extremas no Prisma */}
                  <Html
                    position={[-H / 2, 0, 0.5]}
                    center
                    distanceFactor={20}
                    className="pointer-events-none select-none"
                  >
                    <div className="bg-blue-900/90 text-cyan-200 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-400/60 whitespace-nowrap">
                      p_base: {p_bot_disp} {p_unit}
                    </div>
                  </Html>
                  <Html
                    position={[H / 2, 0, 0.5]}
                    center
                    distanceFactor={20}
                    className="pointer-events-none select-none"
                  >
                    <div className="bg-blue-900/90 text-cyan-200 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-400/60 whitespace-nowrap">
                      p_topo: {p_top_disp} {p_unit}
                    </div>
                  </Html>
                </group>
              )}

              {/* 4. Vetor da Força Hidrostática Resultante (E / F_R) */}
              <group>
                {/* Haste do Vetor */}
                {(() => {
                  const shaftLen = Math.max(0.2, arrowLen - 0.9);
                  const shaftCenter = new THREE.Vector3().addVectors(
                    arrowOrigin,
                    arrowTarget
                  ).multiplyScalar(0.5).add(
                    new THREE.Vector3(sinTheta, -cosTheta, 0).multiplyScalar(-0.45)
                  );
                  const shaftQuat = new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(sinTheta, -cosTheta, 0)
                  );
                  return (
                    <mesh position={shaftCenter} quaternion={shaftQuat}>
                      <cylinderGeometry args={[0.14, 0.14, shaftLen, 24]} />
                      <meshStandardMaterial
                        color="#0f172a"
                        roughness={0.2}
                        metalness={0.8}
                      />
                    </mesh>
                  );
                })()}

                {/* Ponta da Seta (Cone) apontando para o CP */}
                {(() => {
                  const headQuat = new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(sinTheta, -cosTheta, 0)
                  );
                  const headPos = arrowTarget.clone().sub(
                    new THREE.Vector3(sinTheta, -cosTheta, 0).multiplyScalar(0.45)
                  );
                  return (
                    <mesh position={headPos} quaternion={headQuat}>
                      <coneGeometry args={[0.36, 0.9, 24]} />
                      <meshStandardMaterial
                        color="#0f172a"
                        emissive="#ef4444"
                        emissiveIntensity={0.2}
                        roughness={0.2}
                      />
                    </mesh>
                  );
                })()}

                {/* Badge da Força Resultante E no Início da Seta */}
                <Html
                  position={[arrowOrigin.x, arrowOrigin.y + 0.35, 0]}
                  center
                  distanceFactor={18}
                  className="pointer-events-none select-none"
                >
                  <div className="bg-slate-900 text-white font-sans text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xl border-2 border-red-500 whitespace-nowrap text-center">
                    <span className="text-red-400 mr-1 font-mono">E =</span>
                    <span>{force_disp}</span>
                    <span className="block text-[9px] text-slate-400 font-mono">
                      ({force_sec_disp})
                    </span>
                  </div>
                </Html>
              </group>
            </>
          )}
        </BarragemCanvas>
      </div>
    </div>
  );
};
