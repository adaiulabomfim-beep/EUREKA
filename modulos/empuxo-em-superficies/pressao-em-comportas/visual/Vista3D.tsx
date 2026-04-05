import React, { useMemo, useCallback } from 'react';
import { ContainerComportas } from './ContainerComportas';
import { useSceneEngine } from './motor3DComportas';
import { criarPrisma, caixaAgua3D } from './geometria3DComportas';
import { FormaComporta, PosicaoDobradica } from '../dominio/tipos';

interface Vista3DProps {
  upstreamLevel: number;
  downstreamLevel: number;
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
    
    // 1. FUNDAÇÃO (Chão de Terra)
    const floorProfile = [
      { x: -reservoirLength, y: floorY },
      { x: getBackX(floorY) + reservoirLength, y: floorY },
      { x: getBackX(floorY) + reservoirLength, y: floorY - maxH * 0.2 },
      { x: -reservoirLength, y: floorY - maxH * 0.2 }
    ];
    geometry.push(...criarPrisma(
      floorProfile, reservoirWidth * 1.1, '#78350f', 1, '#451a03', 1, 'DAM', undefined, 0, 'url(#earthPattern)', toWorldX, 0, 1, 1
    ));

    // Perfil mestre das paredes laterais acompanhando a inclinação
    const pillarProfile = [
      { x: getFaceX(wallHeight), y: wallHeight },
      { x: getBackX(wallHeight), y: wallHeight },
      { x: getBackX(floorY), y: floorY },
      { x: getFaceX(floorY), y: floorY }
    ];

    // 2. PILARES LATERAIS MACIÇOS (Mantêm o contorno para definir as bordas da estrutura)
    geometry.push(...criarPrisma(
      pillarProfile, sideWallWidth, '#9ca3af', 1, '#6b7280', 1, 'DAM', undefined, leftWallZOffset, 'url(#concretePattern)', toWorldX, 0, 1, 1
    ));
    geometry.push(...criarPrisma(
      pillarProfile, sideWallWidth, '#9ca3af', 1, '#6b7280', 1, 'DAM', undefined, rightWallZOffset, 'url(#concretePattern)', toWorldX, 0, 1, 1
    ));

    // --- CONSTRUÇÃO DO VÃO CENTRAL (O Fatiamento Invisível) ---
    const gateShapeStr = String(props.gateShape).toUpperCase();
    const isRectangular = gateShapeStr.includes('RET');
    
    const numSlices = isRectangular ? 1 : 16;
    const sliceW = props.gateWidth / numSlices;
    
    // 🔥 TRUQUE VISUAL: Uma leve sobreposição para o SVG não deixar falhas microscópicas entre as fatias
    const renderSliceW = sliceW + 0.05; 
    
    const H = props.gateHeight;
    const W = props.gateWidth;

    for (let i = 0; i < numSlices; i++) {
      const z_mid = -W/2 + (i + 0.5) * sliceW;
      const u = Math.min(1, Math.max(-1, 2 * z_mid / W)); 

      let L_top = 0; 
      let L_bot = H; 

      // Ajusta a profundidade do corte conforme a geometria (Circular/Semicircular)
      if (gateShapeStr.includes('CIRCULAR') && !gateShapeStr.includes('SEMI')) {
        const h_slant = H * Math.sqrt(1 - u * u);
        L_top = H/2 - h_slant/2;
        L_bot = H/2 + h_slant/2;
      } else if (gateShapeStr.includes('SEMI')) {
        const h_slant = H * Math.sqrt(1 - u * u);
        L_top = 0;
        L_bot = h_slant;
      }

      const sliceTopY = gateTopY - L_top * Math.sin(thetaRad);
      const sliceBotY = gateTopY - L_bot * Math.sin(thetaRad);

      // A. SOLEIRA (Abaixo do vão)
      // 🔥 Passamos 'none' e 0 para remover as linhas de contorno (strokes) das fatias
      if (sliceBotY > floorY) {
        const sillProf = [
          { x: getFaceX(sliceBotY), y: sliceBotY },
          { x: getBackX(sliceBotY), y: sliceBotY },
          { x: getBackX(floorY), y: floorY },
          { x: getFaceX(floorY), y: floorY }
        ];
        geometry.push(...criarPrisma(sillProf, renderSliceW, '#9ca3af', 1, 'none', 0, 'DAM', undefined, z_mid, 'url(#concretePattern)', toWorldX, 0, 1, 1));
      }

      // B. PAREDE SUPERIOR (Acima do vão)
      if (sliceTopY < wallHeight) {
        const topProf = [
          { x: getFaceX(wallHeight), y: wallHeight },
          { x: getBackX(wallHeight), y: wallHeight },
          { x: getBackX(sliceTopY), y: sliceTopY },
          { x: getFaceX(sliceTopY), y: sliceTopY }
        ];
        geometry.push(...criarPrisma(topProf, renderSliceW, '#9ca3af', 1, 'none', 0, 'DAM', undefined, z_mid, 'url(#concretePattern)', toWorldX, 0, 1, 1));
      }

      // C. COMPORTA
      if (props.hasGate) {
        const gateThick = Math.max(0.2, H * 0.04);
        const offset = 0.02; // Leve recuo para evitar conflito com a água
        const gxTop = getFaceX(sliceTopY) + offset;
        const gxBot = getFaceX(sliceBotY) + offset;

        const gateProf = [
          { x: gxTop, y: sliceTopY },
          { x: gxTop + gateThick * Math.sin(thetaRad), y: sliceTopY + gateThick * Math.cos(thetaRad) },
          { x: gxBot + gateThick * Math.sin(thetaRad), y: sliceBotY + gateThick * Math.cos(thetaRad) },
          { x: gxBot, y: sliceBotY }
        ];
        geometry.push(...criarPrisma(gateProf, renderSliceW, '#94a3b8', 1, 'none', 0, 'GATE', undefined, z_mid, undefined, toWorldX, 0, 1, 1));
      }
    }

    // 7. ÁGUA MONTANTE E JUSANTE
    if (props.upstreamLevel > 0) {
      geometry.push(...caixaAgua3D(
        props.upstreamLevel,
        reservoirWidth - 0.2, 
        -reservoirLength,
        "UPSTREAM",
        (y) => getFaceX(y) - 0.01, // A água acompanha perfeitamente a inclinação
        toWorldX,
        undefined,
        "A",
        1 
      ));
    }

    if (props.downstreamLevel > 0) {
      geometry.push(...caixaAgua3D(
        props.downstreamLevel,
        reservoirWidth - 0.2,
        wallThickness + reservoirLength,
        "DOWNSTREAM",
        (y) => getBackX(y) + 0.01, // A água acompanha as costas da parede
        toWorldX,
        undefined,
        "B",
        1
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

  const { renderedFaces, handlers, resetView, project } = useSceneEngine(
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
    />
  );
};