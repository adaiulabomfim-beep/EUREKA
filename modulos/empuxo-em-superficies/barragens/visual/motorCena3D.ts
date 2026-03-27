import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface WorldFace {
  pts3: Point3D[];
  fill: string;
  opacity: number;
  stroke?: string;
  strokeWidth?: number;
  normal?: Point3D;
  kind: 'DAM' | 'WATER';
  hatchPattern?: string;
  priority?: number;
}

export interface Face {
  pts: { x: number; y: number }[];
  fill: string;
  opacity: number;
  stroke?: string;
  strokeWidth?: number;
  zDepth: number;
  brightness?: number;
  kind: 'DAM' | 'WATER';
  hatchPattern?: string;
  id: number;
  priority: number;
  normal?: Point3D;
}

export const useSceneEngine = (
  is3D: boolean,
  worldGeometry: WorldFace[],
  SVG_W: number,
  SVG_H: number,
  ORIGIN_X: number,
  ORIGIN_Y: number,
  autoFitParams: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  }
) => {
  // Ângulo inicial mais próximo da versão antiga boa:
  // menos "deitado", mais frontal e mais legível para barragens.
  const [rotX, setRotX] = useState(10);
  const [rotY, setRotY] = useState(is3D ? 20 : 0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (is3D) {
      setRotY(20);
      setRotX(10);
    } else {
      setRotY(0);
      setRotX(0);
    }
  }, [is3D]);

  const [isPanning, setIsPanning] = useState(false);
  const [isOrbiting, setIsOrbiting] = useState(false);

  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAnimRef = useRef<number | null>(null);

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  const { autoScale, autoPan, center } = useMemo(() => {
    const { minX, maxX, minY, maxY, minZ, maxZ } = autoFitParams;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const d = Math.max(1, maxZ - minZ);

    // Em 3D, considerar a profundidade no "tamanho visual" evita
    // que a água estique a cena e empurre a barragem para fora do foco.
    const effectiveWidth = is3D ? w + d * 0.55 : w;
    const effectiveHeight = is3D ? h + d * 0.18 : h;

    const factor = is3D ? 0.68 : 0.6;
    const scaleX = (SVG_W * factor) / effectiveWidth;
    const scaleY = (SVG_H * factor) / effectiveHeight;

    const scale = Math.min(scaleX, scaleY, 150);

    // Pequeno deslocamento para reproduzir a composição antiga:
    // barragem mais centralizada e com a face principal respirando melhor.
    const panX = is3D ? 20 : 0;
    const panY = is3D ? 40 : 0;

    return {
      autoScale: scale,
      autoPan: { x: panX, y: panY },
      center: { x: centerX, y: centerY, z: centerZ },
    };
  }, [autoFitParams, SVG_W, SVG_H, is3D]);

  const SCALE = autoScale;
  const finalPan = { x: pan.x + autoPan.x, y: pan.y + autoPan.y };

  const rotate = useCallback(
    (v: Point3D) => {
      const radX = (rotX * Math.PI) / 180;
      const radY = (rotY * Math.PI) / 180;

      const x1 = v.x * Math.cos(radY) - v.z * Math.sin(radY);
      const z1 = v.x * Math.sin(radY) + v.z * Math.cos(radY);

      const y2 = v.y * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = v.y * Math.sin(radX) + z1 * Math.cos(radX);

      return { x: x1, y: y2, z: z2 };
    },
    [rotX, rotY]
  );

  const project = useCallback(
    (p: Point3D) => {
      if (!is3D) {
        return {
          x: ORIGIN_X + finalPan.x + p.x * SCALE,
          y: ORIGIN_Y + finalPan.y - p.y * SCALE,
          zDepth: 0,
        };
      }

      const local = {
        x: p.x - center.x,
        y: p.y - center.y,
        z: p.z - center.z,
      };

      const r = rotate(local);

      // Em 3D, usar o centro do SVG (SVG_W/2, SVG_H/2) centraliza melhor a cena
      const cx = is3D ? SVG_W / 2 : ORIGIN_X;
      const cy = is3D ? SVG_H / 2 : ORIGIN_Y;

      return {
        x: cx + finalPan.x + r.x * SCALE,
        y: cy + finalPan.y - r.y * SCALE,
        zDepth: r.z,
      };
    },
    [center, ORIGIN_X, ORIGIN_Y, finalPan.x, finalPan.y, is3D, rotate, SCALE]
  );

  const brightness = useCallback(
    (n: Point3D) => {
      if (!is3D) return 1;

      const rn = rotate(n);

      const lx = -0.5;
      const ly = 0.5;
      const lz = -0.8;

      const mag = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
      const dot = (rn.x * lx + rn.y * ly + rn.z * lz) / mag;

      return Math.max(0.1, 0.5 + dot * 0.5);
    },
    [is3D, rotate]
  );

  const animateCameraReset = useCallback(() => {
    if (cameraAnimRef.current) {
      cancelAnimationFrame(cameraAnimRef.current);
    }

    const startX = rotX;
    const startY = rotY;
    const startPanX = pan.x;
    const startPanY = pan.y;

    const targetX = is3D ? 18 : 0;
    const targetYBase = is3D ? 32 : 0;
    const nearestTargetY =
      startY + ((((targetYBase - startY) % 360) + 540) % 360) - 180;

    const startTime = performance.now();
    const duration = 800;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);

      setRotX(startX + (targetX - startX) * ease);
      setRotY(startY + (nearestTargetY - startY) * ease);
      setPan({
        x: startPanX + (0 - startPanX) * ease,
        y: startPanY + (0 - startPanY) * ease,
      });

      if (progress < 1) {
        cameraAnimRef.current = requestAnimationFrame(step);
      } else {
        setRotY(targetYBase);
        cameraAnimRef.current = null;
      }
    };

    cameraAnimRef.current = requestAnimationFrame(step);
  }, [rotX, rotY, pan.x, pan.y, is3D]);

  const resetView = useCallback(() => {
    animateCameraReset();
  }, [animateCameraReset]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    if (cameraAnimRef.current) {
      cancelAnimationFrame(cameraAnimRef.current);
    }

    if (e.button === 2 || e.shiftKey) {
      setIsPanning(true);
      setIsOrbiting(false);
    } else {
      setIsOrbiting(true);
      setIsPanning(false);
    }

    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - lastMouseRef.current.x;
      const deltaY = e.clientY - lastMouseRef.current.y;

      if (isPanning) {
        setPan((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));
      } else if (isOrbiting && is3D) {
        setRotY((prev) => prev + deltaX * 0.5);
        setRotX((prev) => clamp(prev - deltaY * 0.5, -90, 90));
      }

      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    },
    [isPanning, isOrbiting, is3D]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsPanning(false);
    setIsOrbiting(false);
  }, []);

  const renderedFaces = useMemo(() => {
    const projected: Face[] = [];

    worldGeometry.forEach((wf, index) => {
      if (wf.normal && wf.kind !== 'WATER') {
        const rotatedNormal = rotate(wf.normal);
        if (rotatedNormal.z < 0) return;
      }

      const proj = wf.pts3.map(project);

      // z médio tende a estabilizar melhor a pilha visual em cenas de barragens
      // do que usar apenas o ponto mais próximo.
      let zDepth =
        proj.reduce((acc, p) => acc + p.zDepth, 0) / Math.max(1, proj.length);

      // Bias para garantir que a água fique atrás do concreto quando estão no mesmo plano
      // ou muito próximos, ajudando o Painter's Algorithm.
      if (wf.kind === 'WATER') {
        zDepth -= 0.1;
      } else if (wf.kind === 'DAM') {
        zDepth += 0.1;
      }

      // Pequeno bias para linhas (arestas explícitas) para evitar z-fighting com as faces adjacentes
      // O bias deve ser pequeno o suficiente para não trazer linhas de trás para frente de objetos finos
      if (proj.length === 2) {
        zDepth += 0.5;
      }
      
      let b = 1;
      if (wf.normal) {
        b = brightness(wf.normal);
      }

      let hatchPattern = wf.hatchPattern;

      projected.push({
        id: index,
        pts: proj.map((p) => ({ x: p.x, y: p.y })),
        fill: wf.fill,
        opacity: wf.opacity,
        stroke: wf.stroke,
        strokeWidth: wf.strokeWidth,
        zDepth,
        brightness: b,
        kind: wf.kind,
        hatchPattern,
        priority: wf.priority ?? 0,
        normal: wf.normal,
      });
    });

    projected.sort((a, b) => {
      const zDiff = a.zDepth - b.zDepth;
      // Tolerância para evitar z-fighting em faces coplanares ou muito próximas.
      // Reduzido para 0.1 para que a subdivisão em Y e o bias de kind funcionem melhor.
      if (Math.abs(zDiff) > 0.1) return zDiff;
      if (a.kind !== b.kind) return a.kind === 'WATER' ? -1 : 1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.id - b.id;
    });

    return projected;
  }, [worldGeometry, project, brightness, rotate]);

  return {
    renderedFaces,
    project,
    rotate,
    SCALE,
    rotX,
    rotY,
    pan,
    isPanning,
    isOrbiting,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
    resetView,
    is3D,
  };
};