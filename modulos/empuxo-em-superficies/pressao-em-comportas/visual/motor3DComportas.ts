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
  kind: 'DAM' | 'WATER' | 'GATE';
  hatchPattern?: string;
  priority?: number;
  holes3?: Point3D[][];
}

export interface Face {
  pts: { x: number; y: number }[];
  fill: string;
  opacity: number;
  stroke?: string;
  strokeWidth?: number;
  zDepth: number;
  brightness?: number;
  kind: 'DAM' | 'WATER' | 'GATE';
  hatchPattern?: string;
  id: number;
  priority: number;
  normal?: Point3D;
  holes?: { x: number; y: number }[][];
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
  const [rotX, setRotX] = useState(15);
  const [rotY, setRotY] = useState(is3D ? 25 : 0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (is3D) {
      setRotY(25);
      setRotX(15);
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

  const [zoomFactor, setZoomFactor] = useState(1);

  const { autoScale, autoPan, center } = useMemo(() => {
    const { minX, maxX, minY, maxY, minZ, maxZ } = autoFitParams;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    // Rotação padrão inicial (15 deg X, 25 deg Y)
    const radX = (15 * Math.PI) / 180;
    const radY = (25 * Math.PI) / 180;

    const rotDefault = (v: Point3D) => {
      const x1 = v.x * Math.cos(radY) - v.z * Math.sin(radY);
      const z1 = v.x * Math.sin(radY) + v.z * Math.cos(radY);
      const y2 = v.y * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = v.y * Math.sin(radX) + z1 * Math.cos(radX);
      return { x: x1, y: y2, z: z2 };
    };

    const corners: Point3D[] = [
      { x: minX - centerX, y: minY - centerY, z: minZ - centerZ },
      { x: minX - centerX, y: minY - centerY, z: maxZ - centerZ },
      { x: minX - centerX, y: maxY - centerY, z: minZ - centerZ },
      { x: minX - centerX, y: maxY - centerY, z: maxZ - centerZ },
      { x: maxX - centerX, y: minY - centerY, z: minZ - centerZ },
      { x: maxX - centerX, y: minY - centerY, z: maxZ - centerZ },
      { x: maxX - centerX, y: maxY - centerY, z: minZ - centerZ },
      { x: maxX - centerX, y: maxY - centerY, z: maxZ - centerZ },
    ];

    let minRotX = Infinity, maxRotX = -Infinity;
    let minRotY = Infinity, maxRotY = -Infinity;

    corners.forEach((c) => {
      const r = rotDefault(c);
      minRotX = Math.min(minRotX, r.x);
      maxRotX = Math.max(maxRotX, r.x);
      minRotY = Math.min(minRotY, r.y);
      maxRotY = Math.max(maxRotY, r.y);
    });

    const rotW = Math.max(0.1, maxRotX - minRotX);
    const rotH = Math.max(0.1, maxRotY - minRotY);

    // Margens ajustadas: colado na borda esquerda da água e no solo na base da janela
    const padLeft = 4;
    const padBottom = 4;
    const padTop = 64;
    const padRight = 36;

    const availW = SVG_W - padLeft - padRight;
    const availH = SVG_H - padTop - padBottom;

    const scale = Math.min(availW / rotW, availH / rotH);

    const cx = SVG_W / 2;
    const cy = SVG_H / 2;

    const panX = padLeft - cx - minRotX * scale;
    const panY = SVG_H - padBottom - cy + minRotY * scale;

    return {
      autoScale: scale,
      autoPan: { x: panX, y: panY },
      center: { x: centerX, y: centerY, z: centerZ },
    };
  }, [autoFitParams, SVG_W, SVG_H]);

  const SCALE = autoScale * zoomFactor;
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

  // 🔥 CORREÇÃO PRINCIPAL: Alinhamento de referencial 2D/3D
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

      // Usar o centro do SVG para projeção 3D (como no Barragens)
      const cx = SVG_W / 2;
      const cy = SVG_H / 2;

      return {
        x: cx + finalPan.x + r.x * SCALE,
        y: cy + finalPan.y - r.y * SCALE,
        zDepth: r.z,
      };
    },
    [center, ORIGIN_X, ORIGIN_Y, finalPan.x, finalPan.y, is3D, rotate, SCALE, SVG_W, SVG_H]
  );

  const rotateDirection = useCallback(
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

  const brightness = useCallback(
    (n: Point3D) => {
      if (!is3D) return 1;

      const rn = rotateDirection(n);

      const lx = -0.5;
      const ly = 0.5;
      const lz = -0.8;

      const mag = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
      const dot = (rn.x * lx + rn.y * ly + rn.z * lz) / mag;

      return Math.max(0.1, 0.5 + dot * 0.5);
    },
    [is3D, rotateDirection]
  );

  const animateCameraReset = useCallback(() => {
    if (cameraAnimRef.current) {
      cancelAnimationFrame(cameraAnimRef.current);
    }

    const startX = rotX;
    const startY = rotY;
    const startPanX = pan.x;
    const startPanY = pan.y;

    const targetX = is3D ? 15 : 0;
    const targetYBase = is3D ? 25 : 0;
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
      setZoomFactor(1);

      if (progress < 1) {
        cameraAnimRef.current = requestAnimationFrame(step);
      } else {
        setRotY(targetYBase);
        cameraAnimRef.current = null;
      }
    };

    cameraAnimRef.current = requestAnimationFrame(step);
  }, [rotX, rotY, pan.x, pan.y, is3D]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoomFactor((prev) => Math.max(0.4, Math.min(3.0, +(prev * factor).toFixed(3))));
  }, []);

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
      let facingScore = 0;
      if (wf.normal) {
        const rn = rotateDirection(wf.normal);
        facingScore = rn.z;
        // BACKFACE CULLING ESTRITO: 
        // Se a face está de costas para a câmera (Z negativo), ela NUNCA deve ser desenhada.
        if (facingScore < 0) return;
      }

      const proj = wf.pts3.map(project);

      // Determinar centroide base
      let cX = wf.pts3.reduce((sum, p) => sum + p.x, 0) / Math.max(1, wf.pts3.length);
      const cY = wf.pts3.reduce((sum, p) => sum + p.y, 0) / Math.max(1, wf.pts3.length);
      const cZ = wf.pts3.reduce((sum, p) => sum + p.z, 0) / Math.max(1, wf.pts3.length);

      // Z-Depth Anchor Correction para volumes massivos de água
      if (wf.kind === 'WATER') {
        cX = Math.max(...wf.pts3.map(p => p.x)); // Força a profundidade pro ponto de contato
      }

      const anchorLocal = { x: cX - center.x, y: cY - center.y, z: cZ - center.z };
      let zDepth = rotate(anchorLocal).z;

      // Desempate sutil automático
      if (wf.kind === 'WATER') zDepth -= 0.1;
      if (wf.kind === 'GATE') zDepth += 0.02;
      if (wf.kind === 'DAM') zDepth += 0.1;

      if (proj.length === 2) {
        zDepth += 0.05;
      }
      
      let b = 1;
      if (wf.normal) {
        b = brightness(wf.normal);
      }

      let hatchPattern = wf.hatchPattern;
      let projectedHoles = wf.holes3 ? wf.holes3.map(hole => hole.map(project)) : undefined;

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
        holes: projectedHoles ? projectedHoles.map(h => h.map(p => ({ x: p.x, y: p.y }))) : undefined
      });
    });

    // Algoritmo do Pintor Baseado no Z-Depth Ancorado
    projected.sort((a, b) => {
      const isLookingFromBelow = rotX < 0;

      // Regra 1: GROUND ABSOLUTO protege a fundação do glitch visual
      if (a.priority === 0 || b.priority === 0) {
        if (a.priority !== b.priority) {
          return isLookingFromBelow ? b.priority - a.priority : a.priority - b.priority;
        }
      }

      // Regra 2: Distância principal
      const zDiff = a.zDepth - b.zDepth;
      if (Math.abs(zDiff) > 0.05) return zDiff;

      // Regra 3: Empate coplanar milimétrico
      if (a.priority !== b.priority) return a.priority - b.priority;

      return a.id - b.id;
    });

    return projected;
  }, [worldGeometry, project, brightness, rotateDirection, rotate, center, rotX]);

  return {
    renderedFaces,
    project,
    rotate,
    rotateDirection,
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
      onWheel: handleWheel,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
    resetView,
    is3D,
    center,
  };
};