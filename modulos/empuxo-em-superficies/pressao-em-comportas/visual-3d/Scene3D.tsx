import React, { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Edges, Html, Line } from '@react-three/drei';
import { Play, RotateCcw, Box, ArrowLeftRight, Ruler, MousePointer2, Maximize } from 'lucide-react';
import {
  FormaComporta,
  PosicaoDobradica,
  SistemaUnidades,
  ModoPosicionamentoComporta,
  FLUIDOS_PREDEFINIDOS,
} from '../dominio/tipos';
import { ResultadoSimulacaoComporta } from '../dominio/resultado';

// Shared 3D components and materials
import { BarragemCanvas } from '../../barragens/visual-3d/components/BarragemCanvas';
import { HatchMaterial } from '../../barragens/visual-3d/core/materials';
import { AnimatedWaterMaterial } from '../../barragens/visual-3d/components/AnimatedWater';

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

/** Textura procedural de alvenaria proporcional ao #brickPattern do 2D */
let brickTexCache: THREE.Texture | null = null;
function getBrickTexture(): THREE.Texture {
  if (brickTexCache) return brickTexCache;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.2;

    const rows = 8;
    const cols = 4;
    const rowH = 256 / rows;
    const colW = 256 / cols;

    for (let r = 0; r <= rows; r++) {
      const y = r * rowH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (colW / 2);
      for (let c = 0; c <= cols; c++) {
        const x = c * colW + offset;
        if (x <= 256) {
          ctx.beginPath();
          ctx.moveTo(x, r * rowH);
          ctx.lineTo(x, (r + 1) * rowH);
          ctx.stroke();
        }
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.35, 1.35);
  tex.needsUpdate = true;
  brickTexCache = tex;
  return tex;
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

    const distH = (effW * 0.62) / tanHalfH;
    const distV = (effH * 0.64) / tanHalfV;
    const dist = Math.max(distH, distV, 6.0) + channelWidth * 0.5;

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
      controls.update();
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
  const [cameraResetKey, setCameraResetKey] = useState<number>(0);

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

  const leftBoundaryX = Math.min(P_bed_left.x - stepLeft2 - Math.max(2.2, sceneSpan * 0.85), -sceneSpan * 1.35);
  const rightBoundaryX = P_crest.x + n_out.x * wallThick + Math.max(1.8, sceneSpan * 0.65);
  const groundThick = Math.max(0.75, sceneSpan * 0.25);

  // Largura 3D do canal compatível com a comporta
  const channelWidth = Math.max(W * 1.8, sceneSpan * 0.9, 1.8);
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

  // 3. PARAMENTO CONTÍNUO DE ALVENARIA (wall-full-masonry idêntico ao 2D, estendendo-se sob toda a água de montante e acima do solo)
  const masonryWallGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(P_crest.x, P_crest.y);
    shape.lineTo(P_crest.x + n_out.x * wallThick, P_crest.y + n_out.y * wallThick);
    shape.lineTo(P_bed_inc.x + n_out.x * wallThick, P_bed_inc.y + n_out.y * wallThick);
    shape.lineTo(P_bed_inc.x + n_out.x * wallThick, P_bed_inc.y - baseSlabThick);
    shape.lineTo(leftBoundaryX, P_bed_inc.y - baseSlabThick);
    shape.lineTo(leftBoundaryX, P_bed_inc.y);
    shape.lineTo(P_bed_inc.x, P_bed_inc.y);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: channelWidth,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -channelWidth / 2);
    geo.computeVertexNormals();

    // UVs alinhados ao mundo para manter as fiadas de tijolos horizontais e proporcionais em todas as faces
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
          // Faces frontal e traseira (plano XY)
          uv.setXY(i, x, y);
        } else if (ny > 0.85) {
          // Laje horizontal (plano XZ)
          uv.setXY(i, z, x);
        } else {
          // Rampa inclinada: fiadas horizontais ao longo de Z, empilhadas ao longo da rampa
          uv.setXY(i, z, y / Math.max(0.25, sinTheta));
        }
      }
      uv.needsUpdate = true;
    }
    return geo;
  }, [P_crest.x, P_crest.y, P_bed_inc.x, P_bed_inc.y, leftBoundaryX, n_out.x, n_out.y, wallThick, baseSlabThick, channelWidth, sinTheta]);

  const brickTex = useMemo(() => getBrickTexture(), []);

  // 4. SOLO DE FUNDAÇÃO (canal-bed-base idêntico ao 2D)
  const foundationRightX = downstreamLevel > 0 ? rightBoundaryX : P_bed_inc.x + n_out.x * wallThick + Math.max(0.6, sceneSpan * 0.2);
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

  // 6. CORPO DE ÁGUA DE JUSANTE (water-downstream-body idêntico ao 2D)
  const canalBedSurfaceY = -baseSlabThick;
  const downRatio = upstreamLevel > 0 ? Math.min(1.15, Math.max(0, downstreamLevel / upstreamLevel)) : 0;
  const downSurfaceY = canalBedSurfaceY + downRatio * (waterSurfaceY - canalBedSurfaceY);

  const downstreamWaterGeometry = useMemo(() => {
    if (downstreamLevel <= 0) return null;
    const startX = P_bot.x + n_out.x * wallThick;
    const startY = Math.max(canalBedSurfaceY, Math.min(downSurfaceY, P_crest.y + n_out.y * wallThick));
    const endWallX = P_bed_inc.x + n_out.x * wallThick;

    const shape = new THREE.Shape();
    shape.moveTo(startX, startY);
    shape.lineTo(rightBoundaryX, downSurfaceY);
    shape.lineTo(rightBoundaryX, canalBedSurfaceY);
    shape.lineTo(endWallX, canalBedSurfaceY);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: channelWidth - 0.02,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -(channelWidth - 0.02) / 2);
    return geo;
  }, [downstreamLevel, P_bot.x, P_bed_inc.x, P_crest.y, n_out.x, n_out.y, wallThick, canalBedSurfaceY, downSurfaceY, rightBoundaryX, channelWidth]);

  // 7. GEOMETRIA DA COMPORTA METÁLICA (centrada em P_mid para alinhar P_top e P_bot em todas as formas)
  const gatePlateThick = Math.max(0.08, sceneSpan * 0.025);
  const plateGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const wClamped = Math.min(W, channelWidth * 0.92);

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
      // Topo reto em y = +H/2 (P_top) e arco semicircular até y = -H/2 (P_bot)
      const halfH = H / 2;
      const halfW = wClamped / 2;
      const steps = 36;
      shape.moveTo(-halfW, halfH);
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI;
        const x = halfW * Math.cos(a);
        const y = halfH - H * Math.sin(a);
        shape.lineTo(x, y);
      }
      shape.closePath();
    } else {
      const halfW = wClamped / 2;
      const halfH = H / 2;
      shape.moveTo(-halfW, -halfH);
      shape.lineTo(halfW, -halfH);
      shape.lineTo(halfW, halfH);
      shape.lineTo(-halfW, halfH);
      shape.closePath();
    }

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: gatePlateThick,
      bevelEnabled: false,
    });
    // Em coordenadas locais da comporta, Z positivo aponta p/ a água (-n_out) e Z negativo entra na parede (+n_out)
    geo.translate(0, 0, -gatePlateThick * 0.7);
    return geo;
  }, [gateShape, H, W, channelWidth, gatePlateThick]);

  // Posição da comporta (fechada em P_mid, ou levantada 0.9*H ao longo da rampa como no 2D)
  const liftDist = hasGate ? 0 : H * 0.9;
  const gatePos = {
    x: P_mid.x - u_down.x * liftDist,
    y: P_mid.y - u_down.y * liftDist,
  };

  // 8. PRISMA DE PRESSÃO HIDROSTÁTICA TRAPEZOIDAL 3D (IGUAL AO 2D)
  const maxDiagWidth = Math.max(0.45, Math.min(1.4, H * 0.6));
  const maxP = Math.max(1, p_bot_Pa);
  const w_top = (p_top_Pa / maxP) * maxDiagWidth;
  const w_bot = maxDiagWidth;

  const pressurePrismGeometry = useMemo(() => {
    if (!hasGate || !isAnalyzed || !showVectors) return null;
    const halfH = H / 2;
    const wClamped = Math.min(W, channelWidth * 0.92);
    const halfW = wClamped / 2;

    // Contorno real da comporta no plano local (X = largura, Y = subindo a rampa)
    const outline: THREE.Vector2[] = [];
    if (gateShape === FormaComporta.CIRCULAR) {
      const r = H / 2;
      const steps = 64;
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        outline.push(new THREE.Vector2(r * Math.cos(a), r * Math.sin(a)));
      }
    } else if (gateShape === FormaComporta.SEMI_CIRCULAR) {
      // Mesmo contorno da placa: corda reta no topo (y = +H/2) e arco até a base (y = -H/2)
      const steps = 48;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI;
        outline.push(new THREE.Vector2(halfW * Math.cos(a), halfH - H * Math.sin(a)));
      }
    } else {
      outline.push(
        new THREE.Vector2(-halfW, -halfH),
        new THREE.Vector2(halfW, -halfH),
        new THREE.Vector2(halfW, halfH),
        new THREE.Vector2(-halfW, halfH)
      );
    }
    if (THREE.ShapeUtils.isClockWise(outline)) outline.reverse();

    // Base do prisma apoiada na face molhada da placa (lado da água, +Z local) — nunca atravessa a parede
    const zBase = gatePlateThick * 0.3 + 0.005;
    const wAt = (y: number) => {
      const t = Math.min(1, Math.max(0, (halfH - y) / H)); // 0 no topo, 1 na base
      return Math.max(0, w_top + t * (w_bot - w_top));
    };

    const n = outline.length;
    const positions: number[] = [];
    outline.forEach((p) => positions.push(p.x, p.y, zBase)); // base: 0..n-1
    outline.forEach((p) => positions.push(p.x, p.y, zBase + wAt(p.y))); // topo: n..2n-1

    const indices: number[] = [];
    const tris = THREE.ShapeUtils.triangulateShape(outline, []);
    tris.forEach(([a, b, c]) => {
      indices.push(a, c, b); // face apoiada na placa
      indices.push(n + a, n + b, n + c); // superfície da carga de pressão
    });
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      indices.push(i, j, n + j, i, n + j, n + i); // paredes laterais seguindo o contorno da comporta
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [hasGate, isAnalyzed, showVectors, gateShape, H, W, channelWidth, gatePlateThick, w_top, w_bot]);

  // Ponto de início e fim do vetor Força Resultante E (apontando para P_CP na direção +n_out)
  const arrowLen = maxDiagWidth + Math.max(0.45, H * 0.42);
  const eStart = {
    x: P_CP.x - n_out.x * arrowLen,
    y: P_CP.y - n_out.y * arrowLen,
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
  const resetTrigger = `${cameraResetKey}-${H.toFixed(2)}-${W.toFixed(2)}-${thetaDeg}-${Y_top.toFixed(2)}-${upstreamLevel}-${downstreamLevel}`;

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
          onClick={() => setShowVectors(!showVectors)}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
            showVectors
              ? 'bg-blue-100/80 text-blue-700 shadow-inner'
              : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'
          }`}
          title={showVectors ? 'Ocultar vetores' : 'Mostrar vetores'}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          VETORES
        </button>

        <button
          type="button"
          onClick={() => setShowExerciseDims(!showExerciseDims)}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
            showExerciseDims
              ? 'bg-blue-100/80 text-blue-700 shadow-inner'
              : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'
          }`}
          title={showExerciseDims ? 'Ocultar cotas didáticas' : 'Exibir cotas do exercício (hCP, hCG, yCG, yCP)'}
        >
          <Ruler className="h-3.5 w-3.5" />
          COTAS
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
            onClick={onCalculate}
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

      {/* Dica de Navegação e Resetar Câmera */}
      <div className="animate-in fade-in pointer-events-none absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 select-none items-center gap-4 rounded-full bg-white/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 backdrop-blur transition-opacity">
        <span className="flex items-center gap-1">
          <MousePointer2 className="h-3 w-3" />
          Girar
        </span>
        <span className="h-3 w-px bg-slate-300" />
        <span className="flex items-center gap-1">
          <Maximize className="h-3 w-3" />
          Pan (direito)
        </span>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setCameraResetKey((k) => k + 1);
        }}
        className="group absolute bottom-6 right-6 z-30 rounded-full border border-blue-100/70 bg-white/90 p-2.5 text-slate-500 shadow-lg transition-all hover:scale-110 hover:text-blue-600"
        title="Resetar câmera"
      >
        <RotateCcw className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180" />
      </button>

      {/* Canvas Three.js */}
      <div key={cameraResetKey} className="w-full h-full" style={{ minHeight: 600 }}>
        <BarragemCanvas
          targetY={centerSceneY}
          cameraPosition={[
            centerSceneX - camDist * 0.3,
            centerSceneY + camDist * 0.24,
            camDist * 0.92,
          ]}
          fov={32}
          target={[centerSceneX, centerSceneY, 0]}
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
            <HatchMaterial type="ground" color="#d97706" texScale={1.35} />
            <Edges color="#713f12" threshold={15} opacity={0.75} transparent />
          </mesh>

          {/* ── 2. Paramento Contínuo de Alvenaria (wall-full-masonry) ── */}
          <mesh geometry={masonryWallGeometry} castShadow receiveShadow>
            <meshStandardMaterial
              map={brickTex}
              color="#f8fafc"
              roughness={0.75}
              metalness={0.05}
            />
            <Edges color="#475569" threshold={15} opacity={0.85} transparent />
          </mesh>

          {/* ── 3. Corpo de Água de Montante (water-upstream-body) ── */}
          {upstreamWaterGeometry && (
            <group>
              <mesh geometry={upstreamWaterGeometry} receiveShadow>
                <AnimatedWaterMaterial
                  opacity={0.72}
                  colorPrimaria={fm.corPrimaria}
                  colorSecundaria={fm.corSecundaria}
                  colorSuperficie={fm.corSuperficie}
                />
              </mesh>
              {/* Linha técnica nítida na superfície livre de montante (cota NA) */}
              <Line
                points={[
                  [leftBoundaryX, waterSurfaceY, frontZ + 0.01],
                  [P_surf.x, waterSurfaceY, frontZ + 0.01],
                ]}
                color="#0284c7"
                lineWidth={2.5}
              />
            </group>
          )}

          {/* ── 4. Corpo de Água de Jusante (water-downstream-body) ── */}
          {downstreamWaterGeometry && (
            <group>
              <mesh geometry={downstreamWaterGeometry} receiveShadow>
                <AnimatedWaterMaterial
                  opacity={0.72}
                  colorPrimaria={fj.corPrimaria}
                  colorSecundaria={fj.corSecundaria}
                  colorSuperficie={fj.corSuperficie}
                />
              </mesh>
              <Line
                points={[
                  [P_bot.x + n_out.x * wallThick, downSurfaceY, frontZ + 0.01],
                  [rightBoundaryX, downSurfaceY, frontZ + 0.01],
                ]}
                color="#0284c7"
                lineWidth={2.5}
              />
            </group>
          )}

          {/* ── 5. Placa da Comporta Metálica no Plano Inclinado (fechada ou levantada) ── */}
          <group position={[gatePos.x, gatePos.y, 0]} quaternion={gateQuaternion}>
            <mesh geometry={plateGeometry} castShadow receiveShadow>
              <meshStandardMaterial
                color="#94a3b8"
                roughness={0.28}
                metalness={0.82}
              />
              <Edges color="#0f172a" threshold={15} opacity={0.9} transparent />
            </mesh>
          </group>

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

          {/* ── 8. COTAS DIDÁTICAS E PONTOS NOTÁVEIS (COMPATÍVEIS COM O 2D) ── */}
          {showExerciseDims && (
            <group position={[0, 0, frontZ + 0.02]}>
              {/* Cota vertical h_topo */}
              {(() => {
                const xDim = P_top.x - Math.max(0.28, sceneSpan * 0.09);
                return (
                  <group>
                    <Line
                      points={[
                        [P_top.x, waterSurfaceY, 0],
                        [xDim, waterSurfaceY, 0],
                      ]}
                      color="#64748b"
                      lineWidth={1.2}
                      dashed
                      dashSize={0.05}
                      gapSize={0.04}
                    />
                    <Line
                      points={[
                        [P_top.x, P_top.y, 0],
                        [xDim, P_top.y, 0],
                      ]}
                      color="#64748b"
                      lineWidth={1.2}
                      dashed
                      dashSize={0.05}
                      gapSize={0.04}
                    />
                    <Line
                      points={[
                        [xDim, waterSurfaceY, 0],
                        [xDim, P_top.y, 0],
                      ]}
                      color="#64748b"
                      lineWidth={1.6}
                    />
                    <Html
                      position={[xDim, (waterSurfaceY + P_top.y) / 2, 0]}
                      center
                      className="pointer-events-none select-none"
                    >
                      <div className="bg-white/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                        h<sub>topo</sub> = {h_top.toFixed(2)} m
                      </div>
                    </Html>
                  </group>
                );
              })()}

              {/* Cota vertical h_CG */}
              {(() => {
                const xDim = P_CG.x - Math.max(0.72, sceneSpan * 0.24);
                return (
                  <group>
                    <Line
                      points={[
                        [P_CG.x, P_CG.y, 0],
                        [xDim, P_CG.y, 0],
                      ]}
                      color="#64748b"
                      lineWidth={1.2}
                      dashed
                      dashSize={0.05}
                      gapSize={0.04}
                    />
                    <Line
                      points={[
                        [xDim, waterSurfaceY, 0],
                        [xDim, P_CG.y, 0],
                      ]}
                      color="#64748b"
                      lineWidth={1.6}
                    />
                    <Html
                      position={[xDim, waterSurfaceY - (waterSurfaceY - P_CG.y) * 0.35, 0]}
                      center
                      className="pointer-events-none select-none"
                    >
                      <div className="bg-white/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                        h<sub>CG</sub> = {h_CG.toFixed(2)} m
                      </div>
                    </Html>
                  </group>
                );
              })()}

              {/* Cota vertical h_CP (após análise) */}
              {isAnalyzed && (() => {
                const xDim = P_CP.x - Math.max(1.20, sceneSpan * 0.40);
                return (
                  <group>
                    <Line
                      points={[
                        [P_CP.x, P_CP.y, 0],
                        [xDim, P_CP.y, 0],
                      ]}
                      color="#64748b"
                      lineWidth={1.2}
                      dashed
                      dashSize={0.05}
                      gapSize={0.04}
                    />
                    <Line
                      points={[
                        [xDim, waterSurfaceY, 0],
                        [xDim, P_CP.y, 0],
                      ]}
                      color="#64748b"
                      lineWidth={1.6}
                    />
                    <Html
                      position={[xDim, waterSurfaceY - (waterSurfaceY - P_CP.y) * 0.62, 0]}
                      center
                      className="pointer-events-none select-none"
                    >
                      <div className="bg-white/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                        h<sub>CP</sub> = {h_CP.toFixed(2)} m
                      </div>
                    </Html>
                  </group>
                );
              })()}

              {/* Cota inclinada y_CG */}
              {(() => {
                const off = wallThick + Math.max(0.28, sceneSpan * 0.09);
                const p1 = { x: P_surf.x + n_out.x * off, y: P_surf.y + n_out.y * off };
                const p2 = { x: P_CG.x + n_out.x * off, y: P_CG.y + n_out.y * off };
                return (
                  <group>
                    <Line
                      points={[
                        [P_surf.x, P_surf.y, 0],
                        [p1.x, p1.y, 0],
                      ]}
                      color="#64748b"
                      lineWidth={1.2}
                      dashed
                      dashSize={0.05}
                      gapSize={0.04}
                    />
                    <Line
                      points={[
                        [P_CG.x, P_CG.y, 0],
                        [p2.x, p2.y, 0],
                      ]}
                      color="#64748b"
                      lineWidth={1.2}
                      dashed
                      dashSize={0.05}
                      gapSize={0.04}
                    />
                    <Line
                      points={[
                        [p1.x, p1.y, 0],
                        [p2.x, p2.y, 0],
                      ]}
                      color="#64748b"
                      lineWidth={1.6}
                    />
                    <Html
                      position={[(p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 0]}
                      center
                      className="pointer-events-none select-none"
                    >
                      <div className="bg-white/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                        y<sub>CG</sub> = {Y_CG.toFixed(2)} m
                      </div>
                    </Html>
                  </group>
                );
              })()}

              {/* Cota inclinada y_CP (após análise) */}
              {isAnalyzed && (() => {
                const off = wallThick + Math.max(0.66, sceneSpan * 0.21);
                const p1 = { x: P_surf.x + n_out.x * off, y: P_surf.y + n_out.y * off };
                const p2 = { x: P_CP.x + n_out.x * off, y: P_CP.y + n_out.y * off };
                return (
                  <group>
                    <Line
                      points={[
                        [P_surf.x, P_surf.y, 0],
                        [p1.x, p1.y, 0],
                      ]}
                      color="#64748b"
                      lineWidth={1.2}
                      dashed
                      dashSize={0.05}
                      gapSize={0.04}
                    />
                    <Line
                      points={[
                        [P_CP.x, P_CP.y, 0],
                        [p2.x, p2.y, 0],
                      ]}
                      color="#64748b"
                      lineWidth={1.2}
                      dashed
                      dashSize={0.05}
                      gapSize={0.04}
                    />
                    <Line
                      points={[
                        [p1.x, p1.y, 0],
                        [p2.x, p2.y, 0],
                      ]}
                      color="#64748b"
                      lineWidth={1.6}
                    />
                    <Html
                      position={[(p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 0]}
                      center
                      className="pointer-events-none select-none"
                    >
                      <div className="bg-white/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                        y<sub>CP</sub> = {Y_CP.toFixed(2)} m
                      </div>
                    </Html>
                  </group>
                );
              })()}
            </group>
          )}

          {/* Ponto CG na comporta (sempre visível quando a comporta está ativa, igual ao 2D) */}
          {hasGate && (
            <group position={[P_CG.x, P_CG.y, 0]}>
              <mesh>
                <sphereGeometry args={[Math.max(0.045, H * 0.04), 24, 24]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
                <Edges color="#0f172a" />
              </mesh>
              <Html
                position={[n_out.x * 0.16, n_out.y * 0.16, frontZ * 0.5]}
                center
                className="pointer-events-none select-none"
              >
                <div className="text-[10px] font-black text-slate-900 bg-white/90 px-1 rounded shadow-sm">
                  CG
                </div>
              </Html>
            </group>
          )}

          {/* ── 9. ELEMENTOS DE ANÁLISE HIDROSTÁTICA (PRISMA, CP E VETORES) ── */}
          {isAnalyzed && showVectors && hasGate && (
            <>
              {/* Ponto E / CP */}
              <group position={[P_CP.x, P_CP.y, 0]}>
                <mesh>
                  <sphereGeometry args={[Math.max(0.05, H * 0.045), 24, 24]} />
                  <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.85} />
                </mesh>
                <Html
                  position={[n_out.x * 0.18, n_out.y * 0.18, frontZ * 0.5]}
                  center
                  className="pointer-events-none select-none"
                >
                  <div className="text-[10px] font-black text-red-700 bg-white/90 px-1 rounded shadow-sm border border-red-300">
                    E
                  </div>
                </Html>
              </group>

              {/* Prisma Trapezoidal de Pressão 3D + Hachuras Internas + Labels p_topo / p_base */}
              {pressurePrismGeometry && (
                <group position={[P_mid.x, P_mid.y, 0]} quaternion={gateQuaternion}>
                  <mesh geometry={pressurePrismGeometry}>
                    <meshStandardMaterial
                      color="#2563eb"
                      transparent
                      opacity={0.42}
                      roughness={0.2}
                      side={THREE.DoubleSide}
                      depthWrite={false}
                    />
                    <Edges color="#2563eb" threshold={15} opacity={0.9} transparent />
                  </mesh>

                  {/* Linhas tracejadas internas de variação de pressão (igual ao 2D) */}
                  {[0.25, 0.5, 0.75].map((t, idx) => {
                    const yLocal = H / 2 - t * H;
                    const w_t = w_top + t * (w_bot - w_top);
                    return (
                      <Line
                        key={`prism-ray-3d-${idx}`}
                        points={[
                          [0, yLocal, gatePlateThick * 0.3 + 0.01],
                          [0, yLocal, gatePlateThick * 0.3 + 0.005 + w_t],
                        ]}
                        color="#60a5fa"
                        lineWidth={1.4}
                        dashed
                        dashSize={0.05}
                        gapSize={0.03}
                      />
                    );
                  })}

                  {/* Label p_topo */}
                  <Html
                    position={[0, H / 2, 0.08 + w_top]}
                    center
                    className="pointer-events-none select-none"
                  >
                    <div className="bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                      p<sub>topo</sub> = {p_top_disp} {p_unit}
                    </div>
                  </Html>

                  {/* Label p_base */}
                  <Html
                    position={[0, -H / 2, 0.08 + w_bot]}
                    center
                    className="pointer-events-none select-none"
                  >
                    <div className="bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                      p<sub>base</sub> = {p_bot_disp} {p_unit}
                    </div>
                  </Html>
                </group>
              )}

              {/* Vetor da Força Resultante E apontando para P_CP */}
              <group>
                {(() => {
                  const headLen = Math.max(0.14, H * 0.14);
                  const headRadius = Math.max(0.055, H * 0.052);
                  const shaftRadius = Math.max(0.022, H * 0.02);
                  const shaftLen = Math.max(0.05, arrowLen - headLen);
                  const dirVec = new THREE.Vector3(n_out.x, n_out.y, 0).normalize();
                  const quat = new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    dirVec
                  );
                  const shaftCenter = new THREE.Vector3(
                    eStart.x + n_out.x * (shaftLen / 2),
                    eStart.y + n_out.y * (shaftLen / 2),
                    0
                  );
                  const headCenter = new THREE.Vector3(
                    P_CP.x - n_out.x * (headLen / 2),
                    P_CP.y - n_out.y * (headLen / 2),
                    0
                  );

                  return (
                    <>
                      <mesh position={shaftCenter} quaternion={quat}>
                        <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLen, 20]} />
                        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
                      </mesh>
                      <mesh position={headCenter} quaternion={quat}>
                        <coneGeometry args={[headRadius, headLen, 20]} />
                        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
                      </mesh>
                    </>
                  );
                })()}

                {/* Badge E = ... */}
                <Html
                  position={[
                    eStart.x - n_out.x * Math.max(0.18, H * 0.15),
                    eStart.y - n_out.y * Math.max(0.18, H * 0.15),
                    0,
                  ]}
                  center
                  className="pointer-events-none select-none"
                >
                  <div className="bg-slate-900 text-white font-sans text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xl border border-white whitespace-nowrap text-center">
                    <div>E = {force_disp}</div>
                    <div className="text-[8.5px] text-slate-400 font-bold">
                      ({force_sec_disp})
                    </div>
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
