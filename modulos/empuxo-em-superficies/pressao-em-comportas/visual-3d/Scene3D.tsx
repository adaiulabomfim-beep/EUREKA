import React, { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Edges, Html, Line } from '@react-three/drei';
import { Play, RotateCcw, Box, ArrowLeftRight, Ruler, MousePointer2 } from 'lucide-react';
import {
  FormaComporta,
  PosicaoDobradica,
  SistemaUnidades,
  ModoPosicionamentoComporta,
  FLUIDOS_PREDEFINIDOS,
} from '../dominio/tipos';
import { ResultadoSimulacaoComporta } from '../dominio/resultado';

// Shared 3D components and materials
import { BarragemCanvas, Camera3DHandle } from '../../barragens/visual-3d/components/BarragemCanvas';
import { HatchMaterial } from '../../barragens/visual-3d/core/materials';
import { AnimatedWaterMaterial } from '../../barragens/visual-3d/components/AnimatedWater';
import { ControlesNavegacaoCena } from '../../../../src/components/ui/ControlesNavegacaoCena';
import { CORES_MATERIAIS, ESTILOS_VETOR_3D } from '../../visual-compartilhado/identidadeVisual';

interface Scene3DProps {
  upstreamLevel: number;
  downstreamLevel: number;
  upstreamFluidKey?: string;
  downstreamFluidKey?: string;
  upstreamDensity?: number;
  downstreamDensity?: number;
  gravity?: number;
  liveResults?: ResultadoSimulacaoComporta;
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
  gateWeight?: number;
  gateWeightEnabled?: boolean;
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

/** Ajusta automaticamente a câmera 3D e o OrbitControls ao aspect ratio real da janela */
const CameraFitRig: React.FC<{
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  channelWidth: number;
  resetTrigger: string;
}> = ({ minX, maxX, minY, maxY, channelWidth, resetTrigger }) => {
  const { camera, size, controls } = useThree() as any;

  useEffect(() => {
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const spanX = Math.max(2.5, maxX - minX);
    const spanY = Math.max(2.0, maxY - minY);

    const aspect = Math.max(0.5, size.width / Math.max(1, size.height));
    const fovRad = ((camera.fov || 32) * Math.PI) / 180;
    const tanHalfV = Math.tan(fovRad / 2);
    const tanHalfH = tanHalfV * aspect;

    // Projeção com leve rotação isométrica/perspectiva (azimute -18°, elevação +14°)
    const azim = (-18 * Math.PI) / 180;
    const elev = (14 * Math.PI) / 180;

    const effW = spanX * Math.cos(azim) + channelWidth * Math.abs(Math.sin(azim));
    const effH = spanY * Math.cos(elev) + channelWidth * Math.sin(elev);

    const distH = (effW * 0.48) / tanHalfH;
    const distV = (effH * 0.50) / tanHalfV;
    const dist = Math.max(distH, distV, 4.2) + channelWidth * 0.25;

    const camX = centerX + dist * Math.sin(azim) * Math.cos(elev);
    const camY = centerY + dist * Math.sin(elev);
    const camZ = dist * Math.cos(azim) * Math.cos(elev);

    camera.position.set(camX, camY, camZ);
    camera.near = 0.05;
    camera.far = Math.max(500, dist * 10);
    camera.lookAt(centerX, centerY, 0);
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.set(centerX, centerY, 0);
      controls.minDistance = Math.max(0.8, dist * 0.16);
      controls.maxDistance = Math.max(25, dist * 4.5);
      controls.update();
      if (typeof controls.saveState === 'function') {
        controls.saveState();
      }
    }
  }, [camera, controls, size.width, size.height, minX, maxX, minY, maxY, channelWidth, resetTrigger]);

  return null;
};

export const Scene3D: React.FC<Scene3DProps> = (props) => {
  const {
    upstreamLevel = 4.5,
    downstreamLevel = 0,
    upstreamFluidKey = 'agua',
    downstreamFluidKey = 'agua',
    hasGate = true,
    gateShape = FormaComporta.CIRCULAR,
    gateWidth = 1.0,
    gateHeight = 1.0,
    gateDepthFromCrest = 0.5,
    gateInclination = 60,
    hingePosition = PosicaoDobradica.NONE,
    hasTieRod = false,
    tieRodPosRel = 1,
    tieRodAngle = 0,
    isAnalyzed,
    is3D,
    setIs3D,
    showVectors,
    setShowVectors,
    onCalculate,
    onReset,
    sistemaUnidades = SistemaUnidades.TECNICO_KGF,
    modoPosicionamento,
    y_cg_direto,
  } = props;

  const [showExerciseDims, setShowExerciseDims] = useState<boolean>(true);
  const cameraControlRef = useRef<Camera3DHandle | null>(null);
  const [zoomPercent, setZoomPercent] = useState<number>(100);

  // Garante que ao analisar (isAnalyzed = true), os vetores 3D fiquem visíveis imediatamente
  useEffect(() => {
    if (isAnalyzed) {
      setShowVectors(true);
    }
  }, [isAnalyzed, setShowVectors]);

  // 1. DIMENSÕES E FÍSICA HIDROSTÁTICA (FONTE ÚNICA DA VERDADE IGUAL AO 2D)
  const H = Math.max(0.1, gateHeight);
  const W = Math.max(0.1, gateWidth);
  const thetaDeg = Math.max(15, Math.min(90, gateInclination || 60));
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const sinTheta = Math.sin(thetaRad);
  const cosTheta = Math.cos(thetaRad);

  const isKgf = sistemaUnidades === SistemaUnidades.TECNICO_KGF;
  const fm = FLUIDOS_PREDEFINIDOS[upstreamFluidKey] || FLUIDOS_PREDEFINIDOS.agua;
  const fj = FLUIDOS_PREDEFINIDOS[downstreamFluidKey] || FLUIDOS_PREDEFINIDOS.agua;
  const rho = props.upstreamDensity ?? props.liveResults?.densityUp ?? fm.densidade ?? 1000;
  const g = props.gravity ?? 9.81;
  const gamma_N = props.liveResults?.gammaUp ?? (rho * g);
  const gamma_kgf = rho;

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

  const upData = props.liveResults?.forceData?.up;
  let h_top = props.liveResults?.h_top_up !== undefined ? props.liveResults.h_top_up : gateDepthFromCrest;
  let Y_CG = 0;
  let Y_top = 0;

  if (
    modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO &&
    y_cg_direto !== undefined &&
    y_cg_direto > 0
  ) {
    Y_CG = upData?.Y_CG ?? y_cg_direto;
    const h_CG_nom = y_cg_direto * sinTheta;
    h_top = props.liveResults?.h_top_up ?? (h_CG_nom - y_cg_rel * sinTheta);
    Y_top = h_top / sinTheta;
  } else {
    Y_top = h_top / sinTheta;
    Y_CG = upData?.Y_CG ?? (Y_top + y_cg_rel);
  }

  if (upData && upData.area > 0) {
    Area = upData.area;
    Ixx = upData.Ixx ?? Ixx;
    y_cg_rel = upData.s_cg ?? y_cg_rel;
  }

  const h_CG = upData?.h_cg ?? (Y_CG * sinTheta);
  const delta_y = upData?.delta_y ?? (Area > 0 && Y_CG > 0 ? Ixx / (Area * Y_CG) : 0);
  const Y_CP = upData?.Y_CP ?? (Y_CG + delta_y);
  const h_CP = upData?.h_cp ?? (Y_CP * sinTheta);
  const h_bot = h_top + H * sinTheta;

  // Pressões e Força Resultante (Empuxo)
  const p_top_Pa = upData?.p_top ?? (gamma_N * Math.max(0, h_top));
  const p_bot_Pa = upData?.p_bot ?? (gamma_N * Math.max(0, h_bot));
  const p_cg_Pa = upData?.p_cg ?? (gamma_N * Math.max(0, h_CG));
  const netForceLive = props.liveResults ? Math.abs(props.liveResults.forceData.FR_net) : p_cg_Pa * Area;
  const F_resultant_N = isAnalyzed && Math.abs(props.force) > 0 ? Math.abs(props.force) : netForceLive;
  const F_resultant_kgf = F_resultant_N / g;
  const F_resultant_kN = F_resultant_N / 1000;

  const force_disp = isKgf
    ? `${Math.round(F_resultant_kgf).toLocaleString('pt-BR')} kgf`
    : `${F_resultant_kN.toFixed(1)} kN`;
  const force_sec_disp = isKgf
    ? `${F_resultant_kN.toFixed(1)} kN`
    : `${Math.round(F_resultant_kgf).toLocaleString('pt-BR')} kgf`;

  const p_top_disp = isKgf ? (p_top_Pa / g).toFixed(0) : (p_top_Pa / 1000).toFixed(1);
  const p_bot_disp = isKgf ? (p_bot_Pa / g).toFixed(0) : (p_bot_Pa / 1000).toFixed(1);
  const p_unit = isKgf ? 'kgf/m²' : 'kPa';

  // 2. SISTEMA DE COORDENADAS 3D (SEÇÃO TRANSVERSAL IDÊNTICA AO VISTA2D)
  // No plano (X, Y) com +X p/ direita e +Y p/ cima:
  // u_down (descendo a rampa p/ dentro da água à esquerda) = (-cosTheta, -sinTheta)
  // n_out (normal apontando da água p/ a parede, baixo-direita) = (+sinTheta, -cosTheta)
  const u_down = { x: -cosTheta, y: -sinTheta };
  const n_out = { x: sinTheta, y: -cosTheta };

  const marginVertical = Math.max(0.65, H * 0.35);
  const Y_bed_dist = Math.max(0, Y_top + H) + marginVertical / sinTheta;
  const waterSurfaceY = Y_bed_dist * sinTheta; // P_bed_inc fica em Y = 0
  const P_surf = { x: 0, y: waterSurfaceY };

  const getInclinePt = (Y_dist: number) => ({
    x: P_surf.x + u_down.x * Y_dist,
    y: P_surf.y + u_down.y * Y_dist,
  });

  const Y_crest_above = marginVertical / sinTheta;
  const P_crest = {
    x: P_surf.x - u_down.x * Y_crest_above,
    y: P_surf.y - u_down.y * Y_crest_above,
  };

  const P_top = getInclinePt(Y_top);
  const P_bot = getInclinePt(Y_top + H);
  const P_mid = getInclinePt(Y_top + H / 2);
  const P_CG = getInclinePt(Y_CG);
  const P_CP = getInclinePt(Y_CP);
  const P_bed_inc = getInclinePt(Y_bed_dist); // y = 0

  // Proporções estruturais idênticas ao Vista2D
  const sceneSpan = Math.max(2.2, waterSurfaceY + marginVertical);
  const wallThick = Math.max(0.26, sceneSpan * 0.085);
  const baseSlabThick = Math.max(0.24, sceneSpan * 0.075);
  const stepLeft1 = Math.max(0.65, sceneSpan * 0.22);
  const stepLeft2 = Math.max(0.30, sceneSpan * 0.10);
  const P_bed_left = { x: P_bed_inc.x - stepLeft1, y: P_bed_inc.y };

  const leftBoundaryX = Math.min(P_bed_left.x - stepLeft2 - Math.max(2.8, sceneSpan * 1.15), -sceneSpan * 1.65);
  const rightBoundaryX = P_crest.x + n_out.x * wallThick + Math.max(2.4, sceneSpan * 0.9);
  const groundThick = Math.max(0.75, sceneSpan * 0.25);

  // Largura 3D do canal e da estrutura ampliada para melhor presença visual
  const channelWidth = Math.max(W * 2.6, sceneSpan * 1.45, 3.2);
  const frontZ = channelWidth / 2;

  // Matriz de rotação para elementos no plano inclinado:
  // local X -> world Z (largura transversal)
  // local Y -> subindo a rampa (-u_down = (+cosTheta, +sinTheta, 0))
  // local Z -> apontando para a água (-n_out = (-sinTheta, +cosTheta, 0))
  const gateQuaternion = useMemo(() => {
    const m = new THREE.Matrix4().makeBasis(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(cosTheta, sinTheta, 0),
      new THREE.Vector3(-sinTheta, cosTheta, 0)
    );
    return new THREE.Quaternion().setFromRotationMatrix(m);
  }, [cosTheta, sinTheta]);

  // 3. PARAMENTO DE ALVENARIA COM ABERTURA (BURACO) DA COMPORTA
  const wallHorizThick = wallThick / sinTheta;
  const rightSlabX = downstreamLevel > 0 ? rightBoundaryX : P_bed_inc.x + wallHorizThick;

  // 3a. Laje horizontal de base (sob a água de montante e jusante)
  const baseSlabGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(leftBoundaryX, P_bed_inc.y);
    shape.lineTo(rightSlabX, P_bed_inc.y);
    shape.lineTo(rightSlabX, P_bed_inc.y - baseSlabThick);
    shape.lineTo(leftBoundaryX, P_bed_inc.y - baseSlabThick);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: channelWidth,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -channelWidth / 2);
    geo.computeVertexNormals();

    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    if (pos && norm && uv) {
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const ny = Math.abs(norm.getY(i));
        const nz = Math.abs(norm.getZ(i));
        if (nz > 0.5) {
          uv.setXY(i, x, y);
        } else if (ny > 0.85) {
          uv.setXY(i, z, x);
        } else {
          uv.setXY(i, z, y);
        }
      }
      uv.needsUpdate = true;
    }
    return geo;
  }, [P_bed_inc.y, leftBoundaryX, rightSlabX, baseSlabThick, channelWidth]);

  // 3b. Parede inclinada de alvenaria vazada pelo furo (buraco) no formato exato da comporta
  const inclinedWallGeometry = useMemo(() => {
    const halfCW = channelWidth / 2;
    const v_top = (Y_top + H / 2) + Y_crest_above;
    const v_bot = (Y_top + H / 2) - Y_bed_dist;

    const shape = new THREE.Shape();
    shape.moveTo(-halfCW, v_bot);
    shape.lineTo(halfCW, v_bot);
    shape.lineTo(halfCW, v_top);
    shape.lineTo(-halfCW, v_top);
    shape.closePath();

    // Furo (buraco) na parede centrado em (u=0, v=0) -> P_mid no plano da rampa
    const holePath = new THREE.Path();
    const wClamped = Math.min(W, channelWidth * 0.92);
    const halfW = wClamped / 2;
    const halfH = H / 2;
    const clampV = (vVal: number) => Math.max(v_bot + 0.04, Math.min(v_top - 0.04, vVal));

    if (gateShape === FormaComporta.CIRCULAR) {
      const r = Math.min(halfH, halfCW * 0.92);
      const steps = 48;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const u = r * Math.cos(a);
        const v = clampV(r * Math.sin(a));
        if (i === 0) holePath.moveTo(u, v);
        else holePath.lineTo(u, v);
      }
      holePath.closePath();
    } else if (gateShape === FormaComporta.SEMI_CIRCULAR) {
      // Base reta embaixo (v = -halfH) e arco semicircular em cima (até v = +halfH)
      const steps = 36;
      holePath.moveTo(-halfW, clampV(-halfH));
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI;
        const u = halfW * Math.cos(a);
        const v = clampV(-halfH + H * Math.sin(a));
        holePath.lineTo(u, v);
      }
      holePath.closePath();
    } else {
      const vMin = clampV(-halfH);
      const vMax = clampV(halfH);
      holePath.moveTo(-halfW, vMin);
      holePath.lineTo(halfW, vMin);
      holePath.lineTo(halfW, vMax);
      holePath.lineTo(-halfW, vMax);
      holePath.closePath();
    }

    shape.holes.push(holePath);

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: 1,
      bevelEnabled: false,
    });

    const pos = geo.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const t = pos.getZ(i); // 0 = face de montante, 1 = face de jusante
        const worldX = P_mid.x + cosTheta * v + t * wallHorizThick;
        const worldY = P_mid.y + sinTheta * v;
        const worldZ = -u;
        pos.setXYZ(i, worldX, worldY, worldZ);
      }
      pos.needsUpdate = true;
    }

    geo.computeVertexNormals();

    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    if (pos && norm && uv) {
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const ny = Math.abs(norm.getY(i));
        const nz = Math.abs(norm.getZ(i));

        if (nz > 0.5) {
          uv.setXY(i, x, y);
        } else if (ny > 0.85) {
          uv.setXY(i, z, x);
        } else {
          uv.setXY(i, z, y / Math.max(0.25, sinTheta));
        }
      }
      uv.needsUpdate = true;
    }
    return geo;
  }, [channelWidth, Y_top, H, W, Y_crest_above, Y_bed_dist, gateShape, P_mid.x, P_mid.y, cosTheta, sinTheta, wallHorizThick]);

  // 4. SOLO DE FUNDAÇÃO (canal-bed-base idêntico ao 2D)
  const foundationRightX = downstreamLevel > 0 ? rightBoundaryX : P_bed_inc.x + wallHorizThick + Math.max(0.6, sceneSpan * 0.2);
  const foundationLength = foundationRightX - leftBoundaryX;
  const foundationCenterX = (leftBoundaryX + foundationRightX) / 2;
  const foundationCenterY = -baseSlabThick - groundThick / 2;

  // 5. CORPO DE ÁGUA DE MONTANTE (water-upstream-body idêntico ao 2D, apoiado sobre a laje de alvenaria)
  const upstreamWaterGeometry = useMemo(() => {
    if (upstreamLevel <= 0) return null;
    const shape = new THREE.Shape();
    shape.moveTo(leftBoundaryX, waterSurfaceY);
    shape.lineTo(P_surf.x, P_surf.y);
    shape.lineTo(P_bed_inc.x, P_bed_inc.y);
    shape.lineTo(leftBoundaryX, P_bed_inc.y);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: channelWidth - 0.02,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -(channelWidth - 0.02) / 2);
    return geo;
  }, [upstreamLevel, leftBoundaryX, waterSurfaceY, P_surf.x, P_surf.y, P_bed_inc.x, P_bed_inc.y, channelWidth]);

  // 6. CORPO DE ÁGUA DE JUSANTE (water-downstream-body idêntico ao 2D, apoiado na laje de alvenaria e na face traseira da rampa)
  const canalBedSurfaceY = P_bed_inc.y; // 0
  const downRatio = upstreamLevel > 0 ? Math.min(1.12, Math.max(0, downstreamLevel / upstreamLevel)) : 0;
  const downRawY = canalBedSurfaceY + downRatio * (waterSurfaceY - canalBedSurfaceY);
  const downSurfaceY = Math.max(canalBedSurfaceY, Math.min(downRawY, P_crest.y - 0.05));
  const downStartX = P_surf.x + (u_down.x / u_down.y) * (downSurfaceY - waterSurfaceY) + wallHorizThick;
  const downEndWallX = P_bed_inc.x + wallHorizThick;

  const downstreamWaterGeometry = useMemo(() => {
    if (downstreamLevel <= 0) return null;

    const shape = new THREE.Shape();
    shape.moveTo(downStartX, downSurfaceY);
    shape.lineTo(rightBoundaryX, downSurfaceY);
    shape.lineTo(rightBoundaryX, canalBedSurfaceY);
    shape.lineTo(downEndWallX, canalBedSurfaceY);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: channelWidth - 0.02,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -(channelWidth - 0.02) / 2);
    return geo;
  }, [downstreamLevel, downStartX, downEndWallX, canalBedSurfaceY, downSurfaceY, rightBoundaryX, channelWidth]);

  // 7. REVESTIMENTO INTERNO DO BURACO NA PAREDE + PLACA DA COMPORTA METÁLICA
  // Revestimento metálico escuro do túnel do buraco (de t = -0.01 a t = 1.01) para dar profundidade 3D nítida ao buraco
  const holeLiningGeometry = useMemo(() => {
    const halfCW = channelWidth / 2;
    const v_top = (Y_top + H / 2) + Y_crest_above;
    const v_bot = (Y_top + H / 2) - Y_bed_dist;
    const wClamped = Math.min(W, channelWidth * 0.92);
    const halfW = wClamped / 2;
    const halfH = H / 2;
    const rim = Math.max(0.035, H * 0.035);
    const clampV = (vVal: number) => Math.max(v_bot + 0.03, Math.min(v_top - 0.03, vVal));

    const outer = new THREE.Shape();
    const inner = new THREE.Path();

    if (gateShape === FormaComporta.CIRCULAR) {
      const rIn = Math.min(halfH, halfCW * 0.92);
      const rOut = Math.min(rIn + rim, halfCW * 0.96);
      const steps = 48;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const uO = rOut * Math.cos(a);
        const vO = clampV(rOut * Math.sin(a));
        if (i === 0) outer.moveTo(uO, vO);
        else outer.lineTo(uO, vO);
      }
      outer.closePath();
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const uI = (rIn - 0.005) * Math.cos(a);
        const vI = clampV((rIn - 0.005) * Math.sin(a));
        if (i === 0) inner.moveTo(uI, vI);
        else inner.lineTo(uI, vI);
      }
      inner.closePath();
    } else if (gateShape === FormaComporta.SEMI_CIRCULAR) {
      const steps = 36;
      const hwOut = halfW + rim;
      const hhOut = halfH + rim;
      outer.moveTo(-hwOut, clampV(-hhOut));
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI;
        const uO = hwOut * Math.cos(a);
        const vO = clampV(-hhOut + (H + rim * 2) * Math.sin(a));
        outer.lineTo(uO, vO);
      }
      outer.closePath();

      const hwIn = Math.max(0.05, halfW - 0.005);
      inner.moveTo(-hwIn, clampV(-halfH + 0.005));
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI;
        const uI = hwIn * Math.cos(a);
        const vI = clampV((-halfH + 0.005) + (H - 0.01) * Math.sin(a));
        inner.lineTo(uI, vI);
      }
      inner.closePath();
    } else {
      const hwOut = halfW + rim;
      const vMinO = clampV(-halfH - rim);
      const vMaxO = clampV(halfH + rim);
      outer.moveTo(-hwOut, vMinO);
      outer.lineTo(hwOut, vMinO);
      outer.lineTo(hwOut, vMaxO);
      outer.lineTo(-hwOut, vMaxO);
      outer.closePath();

      const hwIn = Math.max(0.05, halfW - 0.005);
      const vMinI = clampV(-halfH + 0.005);
      const vMaxI = clampV(halfH - 0.005);
      inner.moveTo(-hwIn, vMinI);
      inner.lineTo(hwIn, vMinI);
      inner.lineTo(hwIn, vMaxI);
      inner.lineTo(-hwIn, vMaxI);
      inner.closePath();
    }

    outer.holes.push(inner);

    const geo = new THREE.ExtrudeGeometry(outer, {
      steps: 1,
      depth: 1.015,
      bevelEnabled: false,
    });

    const pos = geo.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const t = pos.getZ(i) - 0.0075;
        const worldX = P_mid.x + cosTheta * v + t * wallHorizThick;
        const worldY = P_mid.y + sinTheta * v;
        const worldZ = -u;
        pos.setXYZ(i, worldX, worldY, worldZ);
      }
      pos.needsUpdate = true;
    }
    geo.computeVertexNormals();
    return geo;
  }, [channelWidth, Y_top, H, W, Y_crest_above, Y_bed_dist, gateShape, P_mid.x, P_mid.y, cosTheta, sinTheta, wallHorizThick]);

  const gatePlateThick = Math.max(0.08, sceneSpan * 0.025);
  const plateGeometry = useMemo(() => {
    const halfCW = channelWidth / 2;
    const v_top = (Y_top + H / 2) + Y_crest_above;
    const v_bot = (Y_top + H / 2) - Y_bed_dist;
    const wClamped = Math.min(W, channelWidth * 0.92);
    const halfW = wClamped / 2;
    const halfH = H / 2;
    const clampV = (vVal: number) => Math.max(v_bot + 0.04, Math.min(v_top - 0.04, vVal));

    const shape = new THREE.Shape();

    if (gateShape === FormaComporta.CIRCULAR) {
      const r = Math.min(halfH, halfCW * 0.92);
      const steps = 48;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const u = r * Math.cos(a);
        const v = clampV(r * Math.sin(a));
        if (i === 0) shape.moveTo(u, v);
        else shape.lineTo(u, v);
      }
      shape.closePath();
    } else if (gateShape === FormaComporta.SEMI_CIRCULAR) {
      const steps = 36;
      shape.moveTo(-halfW, clampV(-halfH));
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI;
        const u = halfW * Math.cos(a);
        const v = clampV(-halfH + H * Math.sin(a));
        shape.lineTo(u, v);
      }
      shape.closePath();
    } else {
      const vMin = clampV(-halfH);
      const vMax = clampV(halfH);
      shape.moveTo(-halfW, vMin);
      shape.lineTo(halfW, vMin);
      shape.lineTo(halfW, vMax);
      shape.lineTo(-halfW, vMax);
      shape.closePath();
    }

    // Espessura da comporta ocupa apenas os primeiros 22% do furo (lado da água), deixando 78% da cavidade do buraco aberta na parede
    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: 0.24,
      bevelEnabled: false,
    });

    const pos = geo.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const t = pos.getZ(i) - 0.02; // de t = -0.02 até t = 0.22
        const worldX = P_mid.x + cosTheta * v + t * wallHorizThick;
        const worldY = P_mid.y + sinTheta * v;
        const worldZ = -u;
        pos.setXYZ(i, worldX, worldY, worldZ);
      }
      pos.needsUpdate = true;
    }
    geo.computeVertexNormals();
    return geo;
  }, [channelWidth, Y_top, H, W, Y_crest_above, Y_bed_dist, gateShape, P_mid.x, P_mid.y, cosTheta, sinTheta, wallHorizThick]);

  // Posição da comporta (fechada em P_mid, ou levantada 0.9*H ao longo da rampa como no 2D)
  const liftDist = hasGate ? 0 : H * 0.9;
  const gatePos = {
    x: P_mid.x - u_down.x * liftDist,
    y: P_mid.y - u_down.y * liftDist,
  };

  // 8. MALHA 3D DE SETAS DE PRESSÃO HIDROSTÁTICA (PADRÃO BARRAGENS: PressureDistribution3D + EmpuxoVector3D)
  const maxDiagWidth = Math.max(0.95, Math.min(2.4, sceneSpan * 0.36));

  const pressureArrowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: ESTILOS_VETOR_3D.pressureColor,
        emissive: ESTILOS_VETOR_3D.pressureEmissive,
        emissiveIntensity: ESTILOS_VETOR_3D.pressureEmissiveIntensity,
        depthTest: true,
        depthWrite: true,
        transparent: false,
      }),
    []
  );

  const resultantArrowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: ESTILOS_VETOR_3D.resultantColor,
        emissive: ESTILOS_VETOR_3D.resultantEmissive,
        emissiveIntensity: ESTILOS_VETOR_3D.resultantEmissiveIntensity,
        depthTest: true,
        depthWrite: true,
        transparent: false,
      }),
    []
  );

  const cpMarkerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: ESTILOS_VETOR_3D.markerColor,
        emissive: ESTILOS_VETOR_3D.markerEmissive,
        emissiveIntensity: ESTILOS_VETOR_3D.markerEmissiveIntensity,
        depthTest: true,
        depthWrite: true,
        transparent: false,
      }),
    []
  );

  const arrowQuatTuple = useMemo((): [number, number, number, number] => {
    const dirVec = new THREE.Vector3(n_out.x, n_out.y, 0).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirVec);
    return [q.x, q.y, q.z, q.w];
  }, [n_out.x, n_out.y]);

  const pressureArrows = useMemo(() => {
    if (!hasGate || !isAnalyzed || !showVectors || upstreamLevel <= 0) return [];
    const halfH = H / 2;
    const wClamped = Math.min(W, channelWidth * 0.92);
    const halfW = (gateShape === FormaComporta.CIRCULAR ? H : wClamped) / 2;

    const cols = 7;
    const rows = 8;
    const maxDepth = Math.max(0.05, h_bot);
    const items: Array<{
      key: string;
      shaftPos: [number, number, number];
      headPos: [number, number, number];
      shaftLen: number;
      headLen: number;
      shaftRad: number;
      headRad: number;
    }> = [];

    const faceOffset = 0.08;
    const shaftRad = Math.max(0.02, H * 0.02);
    const headRad = Math.max(0.05, H * 0.048);

    for (let rIdx = 0; rIdx < rows; rIdx++) {
      const ty = (rIdx + 0.5) / rows; // 0 perto do topo, 1 perto da base
      const vLocal = halfH - ty * H;

      // Calcula a largura máxima permitida na altura vLocal conforme a geometria da comporta
      let maxHalfU = halfW * 0.9;
      if (gateShape === FormaComporta.CIRCULAR) {
        const rad = halfH * 0.92;
        if (Math.abs(vLocal) >= rad) continue;
        maxHalfU = Math.sqrt(Math.max(0, rad * rad - vLocal * vLocal));
      } else if (gateShape === FormaComporta.SEMI_CIRCULAR) {
        const dy = vLocal + halfH; // 0 na base reta embaixo, H no topo do arco
        const frac = dy / (H * 0.94);
        if (frac < 0 || frac >= 1) continue;
        maxHalfU = halfW * 0.92 * Math.sqrt(Math.max(0, 1 - frac * frac));
      }

      const depthAtV = h_top + (halfH - vLocal) * sinTheta;
      if (depthAtV <= 0.01) continue;

      const lengthRatio = Math.min(1, Math.max(0.14, depthAtV / maxDepth));
      const arrowLen = maxDiagWidth * lengthRatio;
      const headLen = Math.max(0.08, Math.min(0.22, arrowLen * 0.28));
      const shaftLen = arrowLen - headLen;
      if (shaftLen <= 0.01) continue;

      const faceX = P_mid.x + cosTheta * vLocal;
      const faceY = P_mid.y + sinTheta * vLocal;
      const tipX = faceX - n_out.x * faceOffset;
      const tipY = faceY - n_out.y * faceOffset;

      const headX = tipX - n_out.x * (headLen / 2);
      const headY = tipY - n_out.y * (headLen / 2);
      const shaftX = tipX - n_out.x * (headLen + shaftLen / 2);
      const shaftY = tipY - n_out.y * (headLen + shaftLen / 2);

      for (let cIdx = 0; cIdx < cols; cIdx++) {
        const tx = cols > 1 ? -1 + (2 * cIdx) / (cols - 1) : 0; // -1..+1
        const uLocal = tx * (halfW * 0.88);
        if (Math.abs(uLocal) > maxHalfU + 1e-4) continue;
        const worldZ = -uLocal;

        items.push({
          key: `pa-${rIdx}-${cIdx}`,
          shaftPos: [shaftX, shaftY, worldZ],
          headPos: [headX, headY, worldZ],
          shaftLen,
          headLen,
          shaftRad,
          headRad,
        });
      }
    }
    return items;
  }, [hasGate, isAnalyzed, showVectors, upstreamLevel, gateShape, H, W, channelWidth, h_top, h_bot, sinTheta, cosTheta, P_mid.x, P_mid.y, n_out.x, n_out.y, maxDiagWidth]);

  // Ponto de início e fim do vetor Força Resultante E (apontando para P_CP na direção +n_out)
  const cpFaceOffset = 0.1;
  const cpTip = {
    x: P_CP.x - n_out.x * cpFaceOffset,
    y: P_CP.y - n_out.y * cpFaceOffset,
  };
  const arrowLen = maxDiagWidth + Math.max(0.95, H * 0.85);
  const eStart = {
    x: cpTip.x - n_out.x * arrowLen,
    y: cpTip.y - n_out.y * arrowLen,
  };

  // Limites da cena para enquadramento automático da câmera 3D
  const sceneMinX = leftBoundaryX - 0.2;
  const sceneMaxX = Math.max(
    foundationRightX,
    P_CP.x + n_out.x * (wallThick + Math.max(0.85, sceneSpan * 0.28))
  ) + 0.3;
  const sceneMinY = -baseSlabThick - groundThick - 0.1;
  const sceneMaxY = P_crest.y + 0.35;
  const centerSceneX = (sceneMinX + sceneMaxX) / 2;
  const centerSceneY = (sceneMinY + sceneMaxY) / 2;
  const camDist = Math.max(10, (sceneMaxX - sceneMinX) * 2.4);
  const resetTrigger = `${H.toFixed(2)}-${W.toFixed(2)}-${thetaDeg}-${Y_top.toFixed(2)}-${upstreamLevel}-${downstreamLevel}`;

  return (
    <div className="w-full h-full relative" style={{ minHeight: 600 }}>
      {/* Barra Superior de Controles (compatível com o 2D) */}
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 flex z-30 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-blue-100/50 p-1"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIs3D(!is3D)}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
            is3D
              ? 'bg-blue-100/80 text-blue-700 shadow-inner'
              : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'
          }`}
          title={is3D ? 'Mudar para 2D' : 'Mudar para 3D'}
        >
          <Box className="h-3.5 w-3.5" />
          {is3D ? '3D ON' : '3D OFF'}
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isAnalyzed) {
              setShowVectors(true);
              onCalculate();
            } else {
              setShowVectors(!showVectors);
            }
          }}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
            isAnalyzed && showVectors
              ? 'bg-blue-100/80 text-blue-700 shadow-inner'
              : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'
          }`}
          title={showVectors ? 'Ocultar vetores' : 'Mostrar vetores'}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          VETORES
        </button>
      </div>

      {/* Botão Analisar / Reiniciar */}
      <div
        className="absolute bottom-20 right-6 z-30"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {!isAnalyzed ? (
          <button
            type="button"
            onClick={() => {
              setShowVectors(true);
              onCalculate();
            }}
            className="flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 px-5 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-blue-500/20 transition-transform active:scale-95 hover:from-blue-700 hover:to-cyan-600"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Analisar
          </button>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wide text-slate-700 shadow-lg shadow-slate-200/50 transition-all active:scale-95 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reiniciar
          </button>
        )}
      </div>

      <ControlesNavegacaoCena
        mode="3d"
        onZoomIn={() => cameraControlRef.current?.zoomIn()}
        onZoomOut={() => cameraControlRef.current?.zoomOut()}
        onReset={() => cameraControlRef.current?.reset()}
        zoomPercent={zoomPercent}
        className="bottom-6 left-6"
      />

      {/* Dica de Navegação */}
      <div className="animate-in fade-in pointer-events-none absolute bottom-6 left-1/2 z-30 hidden sm:flex -translate-x-1/2 select-none items-center gap-3 rounded-full bg-white/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 backdrop-blur transition-opacity whitespace-nowrap">
        <span className="flex items-center gap-1">
          <MousePointer2 className="h-3 w-3" />
          Girar
        </span>
        <span className="h-3 w-px bg-slate-300" />
        <span>Pan (dir./meio)</span>
        <span className="h-3 w-px bg-slate-300" />
        <span>Zoom</span>
      </div>

      {/* Canvas Three.js */}
      <div className="w-full h-full" style={{ minHeight: 600 }}>
        <BarragemCanvas
          targetY={centerSceneY}
          cameraPosition={[
            centerSceneX - camDist * 0.3,
            centerSceneY + camDist * 0.24,
            camDist * 0.92,
          ]}
          fov={32}
          target={[centerSceneX, centerSceneY, 0]}
          controlRef={cameraControlRef}
          onZoomChange={setZoomPercent}
          minDistance={Math.max(0.8, camDist * 0.16)}
          maxDistance={Math.max(25, camDist * 4.5)}
        >
          <CameraFitRig
            minX={sceneMinX}
            maxX={sceneMaxX}
            minY={sceneMinY}
            maxY={sceneMaxY}
            channelWidth={channelWidth}
            resetTrigger={resetTrigger}
          />
          {/* ── 1. Solo de Fundação (canal-bed-base) ── */}
          <mesh position={[foundationCenterX, foundationCenterY, 0]} receiveShadow>
            <boxGeometry args={[foundationLength, groundThick, channelWidth + 0.08]} />
            <HatchMaterial type="ground" texScale={1.65 / Math.max(2.0, sceneSpan)} />
            <Edges color={CORES_MATERIAIS.terraStroke} threshold={15} opacity={0.45} transparent />
          </mesh>

          {/* ── 2. Paramento de Concreto: Laje de Base + Parede Inclinada Vazada pelo Buraco da Comporta ── */}
          <mesh geometry={baseSlabGeometry} castShadow receiveShadow>
            <HatchMaterial type="concrete" texScale={0.975 / Math.max(2.0, sceneSpan)} />
            <Edges color={CORES_MATERIAIS.concreto3DEdge} threshold={15} opacity={0.45} transparent />
          </mesh>
          <mesh geometry={inclinedWallGeometry} castShadow receiveShadow>
            <HatchMaterial type="concrete" texScale={0.975 / Math.max(2.0, sceneSpan)} />
            <Edges color={CORES_MATERIAIS.concreto3DEdge} threshold={15} opacity={0.45} transparent />
          </mesh>
          {/* Moldura e túnel interno escuro do buraco da comporta (visível de montante e de jusante) */}
          <mesh geometry={holeLiningGeometry} castShadow receiveShadow>
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.45}
              metalness={0.65}
            />
            <Edges color="#0f172a" threshold={15} opacity={0.95} transparent />
          </mesh>

          {/* ── 3. Corpo de Água de Montante (water-upstream-body) ── */}
          {upstreamWaterGeometry && (
            <mesh geometry={upstreamWaterGeometry} receiveShadow>
              <AnimatedWaterMaterial
                opacity={0.6}
                colorPrimaria={upstreamFluidKey === 'agua' ? CORES_MATERIAIS.aguaPrimaria : fm.corPrimaria}
                colorSecundaria={upstreamFluidKey === 'agua' ? CORES_MATERIAIS.aguaSecundaria : fm.corSecundaria}
                colorSuperficie={upstreamFluidKey === 'agua' ? CORES_MATERIAIS.aguaProfunda : fm.corSecundaria}
              />
            </mesh>
          )}

          {/* ── 4. Corpo de Água de Jusante (water-downstream-body) ── */}
          {downstreamWaterGeometry && (
            <mesh geometry={downstreamWaterGeometry} receiveShadow>
              <AnimatedWaterMaterial
                opacity={0.6}
                colorPrimaria={downstreamFluidKey === 'agua' ? CORES_MATERIAIS.aguaPrimaria : fj.corPrimaria}
                colorSecundaria={downstreamFluidKey === 'agua' ? CORES_MATERIAIS.aguaSecundaria : fj.corSecundaria}
                colorSuperficie={downstreamFluidKey === 'agua' ? CORES_MATERIAIS.aguaProfunda : fj.corSecundaria}
              />
            </mesh>
          )}

          {/* ── 5. Placa da Comporta Metálica Embutida no Buraco da Parede (quando ativa) ── */}
          {hasGate && (
            <mesh geometry={plateGeometry} castShadow receiveShadow>
              <meshStandardMaterial
                color="#94a3b8"
                roughness={0.35}
                metalness={0.65}
              />
              <Edges color="#0f172a" threshold={15} opacity={0.95} transparent />
            </mesh>
          )}

          {/* Linhas de fluxo quando a comporta está aberta (!hasGate) */}
          {!hasGate &&
            [0.2, 0.5, 0.8].map((t, idx) => {
              const ptStart = getInclinePt(Y_top + t * H);
              const ptMid = { x: ptStart.x + n_out.x * (wallThick * 0.5), y: ptStart.y + n_out.y * (wallThick * 0.5) };
              const ptEnd = {
                x: ptStart.x + n_out.x * (wallThick + H * 0.8),
                y: ptStart.y + n_out.y * (wallThick + H * 0.4) - H * 0.15,
              };
              return (
                <Line
                  key={`flow-3d-${idx}`}
                  points={[
                    [ptStart.x - 0.25, ptStart.y, 0],
                    [ptMid.x, ptMid.y, 0],
                    [ptEnd.x, ptEnd.y, 0],
                  ]}
                  color="#38bdf8"
                  lineWidth={2.5}
                  dashed
                  dashSize={0.12}
                  gapSize={0.08}
                />
              );
            })}

          {/* ── 6. Dobradiça (Hinge) se configurada ── */}
          {hasGate && hingePosition !== PosicaoDobradica.NONE && (() => {
            const hPt = hingePosition === PosicaoDobradica.TOP ? P_top : P_bot;
            const hingeR = Math.max(0.06, H * 0.045);
            return (
              <group position={[hPt.x, hPt.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh>
                  <cylinderGeometry args={[hingeR, hingeR, Math.min(W, channelWidth * 0.92) + 0.08, 24]} />
                  <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.7} />
                  <Edges color="#78350f" threshold={15} />
                </mesh>
              </group>
            );
          })()}

          {/* ── 7. Tirante / Escora (Tie Rod) se configurado ── */}
          {hasGate && hasTieRod && (() => {
            const tPt = getInclinePt(Y_top + tieRodPosRel * H);
            const rodAngRad = (tieRodAngle * Math.PI) / 180;
            const rodLen = Math.max(0.6, H * 0.65);
            const endPt = {
              x: tPt.x + Math.cos(rodAngRad) * rodLen,
              y: tPt.y + Math.sin(rodAngRad) * rodLen,
            };
            const boxSize = Math.max(0.09, H * 0.07);
            return (
              <group>
                <Line
                  points={[
                    [tPt.x, tPt.y, 0],
                    [endPt.x, endPt.y, 0],
                  ]}
                  color="#64748b"
                  lineWidth={3}
                  dashed
                  dashSize={0.08}
                  gapSize={0.05}
                />
                <mesh position={[endPt.x, endPt.y, 0]}>
                  <boxGeometry args={[boxSize, boxSize, boxSize]} />
                  <meshStandardMaterial color="#334155" />
                </mesh>
              </group>
            );
          })()}

          {/* ── 9. ELEMENTOS DE ANÁLISE HIDROSTÁTICA (SETAS DE PRESSÃO 3D IGUAIS A BARRAGENS + VETOR RESULTANTE) ── */}
          {isAnalyzed && showVectors && (
            <group>
              {/* Malha de Setas de Pressão Hidrostática sobre a Comporta (padrão Barragens) */}
              {pressureArrows.map((a) => (
                <group key={a.key}>
                  <mesh
                    position={a.shaftPos}
                    quaternion={arrowQuatTuple}
                    material={pressureArrowMat}
                    renderOrder={5}
                  >
                    <cylinderGeometry args={[a.shaftRad, a.shaftRad, a.shaftLen, 8]} />
                  </mesh>
                  <mesh
                    position={a.headPos}
                    quaternion={arrowQuatTuple}
                    material={pressureArrowMat}
                    renderOrder={5}
                  >
                    <coneGeometry args={[a.headRad, a.headLen, 8]} />
                  </mesh>
                </group>
              ))}

              {/* Ponto CP + Vetor da Força Resultante (padrão EmpuxoVector3D de Barragens) */}
              <group>
                {/* Esfera brilhante no Centro de Pressão (CP) */}
                <mesh
                  position={[cpTip.x, cpTip.y, 0]}
                  material={cpMarkerMat}
                  renderOrder={6}
                >
                  <sphereGeometry args={[Math.max(0.075, H * 0.065), 16, 16]} />
                </mesh>

                {(() => {
                  const headLen = Math.max(0.26, H * 0.24);
                  const headRadius = Math.max(0.095, H * 0.085);
                  const shaftRadius = Math.max(0.038, H * 0.035);
                  const shaftLen = Math.max(0.05, arrowLen - headLen);
                  const shaftPos: [number, number, number] = [
                    eStart.x + n_out.x * (shaftLen / 2),
                    eStart.y + n_out.y * (shaftLen / 2),
                    0,
                  ];
                  const headPos: [number, number, number] = [
                    cpTip.x - n_out.x * (headLen / 2),
                    cpTip.y - n_out.y * (headLen / 2),
                    0,
                  ];

                  return (
                    <>
                      <mesh
                        position={shaftPos}
                        quaternion={arrowQuatTuple}
                        material={resultantArrowMat}
                        renderOrder={6}
                      >
                        <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLen, 12]} />
                      </mesh>
                      <mesh
                        position={headPos}
                        quaternion={arrowQuatTuple}
                        material={resultantArrowMat}
                        renderOrder={6}
                      >
                        <coneGeometry args={[headRadius, headLen, 12]} />
                      </mesh>
                    </>
                  );
                })()}

                {/* Rótulo da Força Resultante padronizado com EmpuxoVector3D (Barragens) */}
                <Html
                  position={[
                    eStart.x - n_out.x * Math.max(0.18, H * 0.14),
                    eStart.y - n_out.y * Math.max(0.18, H * 0.14) + Math.max(0.16, H * 0.12),
                    0,
                  ]}
                  center
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm border whitespace-nowrap select-none"
                    style={{
                      color: ESTILOS_VETOR_3D.resultantColor,
                      borderColor: `${ESTILOS_VETOR_3D.resultantColor}55`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: ESTILOS_VETOR_3D.resultantColor }}
                    ></span>
                    <span>E = {force_disp}</span>
                  </div>
                </Html>
              </group>
            </group>
          )}
        </BarragemCanvas>
      </div>
    </div>
  );
};
