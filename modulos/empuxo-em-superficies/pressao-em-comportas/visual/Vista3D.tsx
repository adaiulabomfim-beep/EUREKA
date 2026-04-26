import React, { useMemo, useCallback } from 'react';
import { ContainerComportas } from './ContainerComportas';
import { useSceneEngine } from './motor3DComportas';
import { criarPrisma, caixaAgua3D, criarFace, criarTubo } from './geometria3DComportas';
import { FormaComporta, PosicaoDobradica } from '../dominio/tipos';

interface Vista3DProps {
  upstreamLevel: number;
  downstreamLevel: number;
  upstreamFluidKey: string;
  downstreamFluidKey: string;
  hasGate: boolean;
  gateShape: FormaComporta;
  gateWidth: number;
  gateHeight: number;
  gateDepthFromCrest: number;
  gateInclination: number;
  force: number;
  s_cp: number;
  hingePosition: PosicaoDobradica;
  hasTieRod: boolean;
  tieRodPosRel: number;
  tieRodAngle: number;
  isAnalyzed: boolean;
  onCalculate: () => void;
  onReset: () => void;
  is3D: boolean;
  setIs3D: (v: boolean) => void;
  showVectors: boolean;
  setShowVectors: (v: boolean) => void;
}

export const Vista3D: React.FC<Vista3DProps> = (props) => {
  // ... rest of the component
  const SVG_W = 900;
  const SVG_H = 520;

  const maxH = Math.max(props.upstreamLevel, props.downstreamLevel, props.gateHeight) || 10;
  
  const ORIGIN_X = SVG_W / 2;
  const ORIGIN_Y = SVG_H * 0.75; 

  const toWorldX = useCallback((x: number) => x, []);

  const { worldGeometry, fitPoints } = useMemo(() => {
    const geometry: any[] = [];

    // --- LÓGICA DE INCLINAÇÃO ---
    const thetaRad = (props.gateInclination * Math.PI) / 180;
    
    const floorY = 0;
    const gateTopY = props.upstreamLevel - props.gateDepthFromCrest;
    const gateTopX = 0; 

    // Função paramétrica para calcular a inclinação perfeita em qualquer altura
    const getFaceX = (y: number) => {
      if (props.gateInclination === 90) return gateTopX;
      return gateTopX + (gateTopY - y) / Math.tan(thetaRad);
    };

    const reservoirWidth = Math.max(props.gateWidth * 6, maxH * 4);
    const wallHeight = maxH * 1.3; 
    const wallThickness = Math.max(maxH * 0.6, 4); 
    const reservoirLength = maxH * 2.5; 

    const getBackX = (y: number) => getFaceX(y) + wallThickness;
    
    const sideWallWidth = (reservoirWidth - props.gateWidth) / 2;
    const leftWallZOffset = (reservoirWidth + props.gateWidth) / 4;
    const rightWallZOffset = -leftWallZOffset;
    
    // 1. FUNDAÇÃO (Chão de Terra) — mesmo estilo visual do módulo Barragens
    const earthDepth = maxH * 0.2;
    const floorProfile = [
      { x: -reservoirLength, y: floorY },
      { x: getBackX(floorY) + reservoirLength, y: floorY },
      { x: getBackX(floorY) + reservoirLength, y: floorY - earthDepth },
      { x: -reservoirLength, y: floorY - earthDepth }
    ];
    geometry.push(...criarPrisma(
      floorProfile, reservoirWidth * 1.1, '#a16207', 1, '#713f12', 1.2, 'DAM', undefined, 0, 'url(#earthPattern)', toWorldX, 0, 1, 1
    ));

    // Perfil mestre das paredes laterais acompanhando a inclinação
    const pillarProfile = [
      { x: getFaceX(wallHeight), y: wallHeight },
      { x: getBackX(wallHeight), y: wallHeight },
      { x: getBackX(floorY), y: floorY },
      { x: getFaceX(floorY), y: floorY }
    ];

    // 2. PILARES LATERAIS MACIÇOS — mesmo estilo concreto do Barragens
    geometry.push(...criarPrisma(
      pillarProfile, sideWallWidth, '#a3a3a3', 1, '#6b7280', 1.2, 'DAM', undefined, leftWallZOffset, 'url(#concretePattern)', toWorldX, 2, 1, 1
    ));
    geometry.push(...criarPrisma(
      pillarProfile, sideWallWidth, '#a3a3a3', 1, '#6b7280', 1.2, 'DAM', undefined, rightWallZOffset, 'url(#concretePattern)', toWorldX, 2, 1, 1
    ));

    const H = props.gateHeight;
    const W = props.gateWidth;
    
    const gateBotY = gateTopY - H * Math.sin(thetaRad);

    const matColor = '#a3a3a3';
    const matStroke = '#6b7280';
    const matPattern = 'url(#concretePattern)';

    const genHoleSafe = (fn: any) => {
      const pts = [];
      const gateShapeStr = String(props.gateShape).toUpperCase();
      if (gateShapeStr.includes('RET') || gateShapeStr.includes('QUAD')) {
         const yTop = gateTopY;
         const yBot = gateBotY;
         pts.push({ x: fn(yTop), y: yTop, z: -W/2 });
         pts.push({ x: fn(yTop), y: yTop, z: W/2 });
         pts.push({ x: fn(yBot), y: yBot, z: W/2 });
         pts.push({ x: fn(yBot), y: yBot, z: -W/2 });
      } else if (gateShapeStr.includes('CIRCULAR') && !gateShapeStr.includes('SEMI')) {
         const steps = 32;
         const r = H / 2;
         const cy = gateTopY - r * Math.sin(thetaRad);
         for (let i = 0; i < steps; i++) {
           const angle = (i / steps) * Math.PI * 2;
           const lY = cy + r * Math.cos(angle) * Math.sin(thetaRad);
           const lZ = r * Math.sin(angle);
           pts.push({ x: fn(lY), y: lY, z: lZ });
         }
      } else if (gateShapeStr.includes('SEMI')) {
         const steps = 16;
         const r = H / 2;
         const yBot = gateBotY;
         pts.push({ x: fn(yBot), y: yBot, z: -r });
         pts.push({ x: fn(yBot), y: yBot, z: r });
         for (let i = 0; i <= steps; i++) {
           const angle = (i / steps) * Math.PI;
           const lY = gateBotY + r * Math.sin(angle) * Math.sin(thetaRad);
           const lZ = r * Math.cos(angle);
           pts.push({ x: fn(lY), y: lY, z: lZ });
         }
      }
      return pts;
    };

    let holeFront, holeBack;
    if (props.hasGate) {
      holeFront = genHoleSafe(getFaceX);
      holeBack = genHoleSafe(getBackX);
    }

    const zStart = -reservoirWidth / 2;
    const zEnd = reservoirWidth / 2;

    const pUp_bot = { x: getFaceX(floorY), y: floorY };
    const pUp_top = { x: getFaceX(wallHeight), y: wallHeight };
    const pDown_bot = { x: getBackX(floorY), y: floorY };
    const pDown_top = { x: getBackX(wallHeight), y: wallHeight };

    geometry.push(criarFace(
      [
        { x: pDown_top.x, y: pDown_top.y, z: zStart },
        { x: pDown_top.x, y: pDown_top.y, z: zEnd },
        { x: pUp_top.x, y: pUp_top.y, z: zEnd },
        { x: pUp_top.x, y: pUp_top.y, z: zStart }
      ],
      matColor, 1, matStroke, 1.2, { x: 0, y: 1, z: 0 }, 'DAM', matPattern, 2
    ));

    const upstreamFacePts = [
      { x: pUp_top.x, y: pUp_top.y, z: zStart },
      { x: pUp_top.x, y: pUp_top.y, z: zEnd },
      { x: pUp_bot.x, y: pUp_bot.y, z: zEnd },
      { x: pUp_bot.x, y: pUp_bot.y, z: zStart }
    ];
    geometry.push(criarFace(upstreamFacePts, matColor, 1, matStroke, 1.2, { x: -Math.sin(thetaRad), y: Math.cos(thetaRad), z: 0 }, 'DAM', matPattern, 2, holeFront ? [holeFront] : undefined));

    const downstreamFacePts = [
      { x: pDown_top.x, y: pDown_top.y, z: zEnd },
      { x: pDown_top.x, y: pDown_top.y, z: zStart },
      { x: pDown_bot.x, y: pDown_bot.y, z: zStart },
      { x: pDown_bot.x, y: pDown_bot.y, z: zEnd }
    ];
    geometry.push(criarFace(downstreamFacePts, matColor, 1, matStroke, 1.2, { x: 1, y: 0, z: 0 }, 'DAM', matPattern, 2, holeBack ? [holeBack] : undefined));

    const leftFacePts = [
      { x: pDown_top.x, y: pDown_top.y, z: zStart },
      { x: pUp_top.x, y: pUp_top.y, z: zStart },
      { x: pUp_bot.x, y: pUp_bot.y, z: zStart },
      { x: pDown_bot.x, y: pDown_bot.y, z: zStart }
    ];
    geometry.push(criarFace(leftFacePts, matColor, 1, matStroke, 1.2, { x: 0, y: 0, z: -1 }, 'DAM', matPattern, 2));

    const rightFacePts = [
      { x: pUp_top.x, y: pUp_top.y, z: zEnd },
      { x: pDown_top.x, y: pDown_top.y, z: zEnd },
      { x: pDown_bot.x, y: pDown_bot.y, z: zEnd },
      { x: pUp_bot.x, y: pUp_bot.y, z: zEnd }
    ];
    geometry.push(criarFace(rightFacePts, matColor, 1, matStroke, 1.2, { x: 0, y: 0, z: 1 }, 'DAM', matPattern, 2));

    if (props.hasGate && holeFront && holeBack) {
      geometry.push(...criarTubo(holeFront, holeBack, matColor, matStroke, matPattern, 2));

      const gatePtsFront = holeFront.map(p => ({ x: p.x - 0.03, y: p.y, z: p.z }));
      geometry.push(criarFace(gatePtsFront, 'url(#metalLinear)', 1, '#1e293b', 1.5, { x: -Math.sin(thetaRad), y: Math.cos(thetaRad), z: 0 }, 'GATE', undefined, 3));
      
      const gatePtsBack = holeFront.map(p => ({ x: p.x - 0.01, y: p.y, z: p.z })).reverse();
      geometry.push(criarFace(gatePtsBack, '#475569', 1, '#1e293b', 1.5, { x: 1, y: 0, z: 0 }, 'GATE', undefined, 3));
    }

    // 7. ÁGUA MONTANTE E JUSANTE
    if (props.upstreamLevel > 0) {
      geometry.push(...caixaAgua3D(
        props.upstreamLevel,
        reservoirWidth - 0.2, 
        -reservoirLength,
        "UPSTREAM",
        (y) => getFaceX(y) - 0.01,
        toWorldX,
        undefined,
        "A",
        1,
        floorY
      ));
    }

    if (props.downstreamLevel > 0) {
      geometry.push(...caixaAgua3D(
        props.downstreamLevel,
        reservoirWidth - 0.2,
        wallThickness + reservoirLength,
        "DOWNSTREAM",
        (y) => getBackX(y) + 0.01,
        toWorldX,
        undefined,
        "B",
        1,
        floorY
      ));
    }

    return {
      worldGeometry: geometry,
      fitPoints: [
        { x: -reservoirLength, y: floorY },
        { x: getBackX(wallHeight), y: wallHeight },
        { x: getFaceX(props.upstreamLevel), y: props.upstreamLevel }
      ]
    };
  }, [props, toWorldX, maxH]);

  const autoFitParams = useMemo(() => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    let minZ = -maxH * 2; 
    let maxZ = maxH * 2;

    fitPoints.forEach(p => {
      const x = toWorldX(p.x);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }, [fitPoints, toWorldX, maxH]);

  const { renderedFaces, handlers, resetView, project, pan } = useSceneEngine(
    true,
    worldGeometry,
    SVG_W,
    SVG_H,
    ORIGIN_X,
    ORIGIN_Y,
    autoFitParams
  );

  const originProj = project({ x: 0, y: 0, z: 0 });

  return (
    <ContainerComportas
      is3D={props.is3D}
      setIs3D={props.setIs3D}
      showVectors={props.showVectors}
      setShowVectors={props.setShowVectors}
      isAnalyzed={props.isAnalyzed}
      onCalculate={props.onCalculate}
      onReset={props.onReset}
      resetView={resetView}
      handlers={handlers}
      renderedFaces={renderedFaces}
      vectors={[]} 
      SVG_W={SVG_W}
      SVG_H={SVG_H}
      ORIGIN_X={originProj.x}
      ORIGIN_Y={originProj.y}
      pan={pan}
      upstreamFluidKey={props.upstreamFluidKey}
      downstreamFluidKey={props.downstreamFluidKey}
    />
  );
};