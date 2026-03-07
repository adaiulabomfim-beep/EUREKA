import { useState, useRef, useCallback, useMemo } from 'react';

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
  kind: "DAM" | "WATER";
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
  kind: "DAM" | "WATER";
  hatchPattern?: string;
  id: number;
  priority: number;
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
  // câmera mais próxima do TankScene
  const [rotX, setRotX] = useState(15);
  const [rotY, setRotY] = useState(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

    // escala mais parecida com a composição do TankScene
    const scaleX = (SVG_W * 0.8) / w;
    const scaleY = (SVG_H * 0.8) / h;
    
    let scale = Math.min(scaleX, scaleY, 150);

    // centraliza melhor no campo visual
    const panX = 0;
    const panY = 0;

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
      const local = {
        x: p.x - center.x,
        y: p.y - center.y,
        z: p.z - center.z,
      };

      const cx = SVG_W / 2 + finalPan.x;
      const cy = SVG_H / 2 + finalPan.y;

      if (!is3D) {
        return {
          x: cx + local.x * SCALE,
          y: cy - local.y * SCALE,
          zDepth: 0,
        };
      }

      const r = rotate(local);

      return {
        x: cx + r.x * SCALE,
        y: cy - r.y * SCALE,
        zDepth: r.z,
      };
    },
    [center, ORIGIN_X, ORIGIN_Y, finalPan.x, finalPan.y, is3D, rotate, SCALE]
  );

  const brightness = useCallback(
    (n: Point3D) => {
      if (!is3D) return 1;

      const rn = rotate(n);

      // luz semelhante ao TankScene
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

    const targetX = 15;
    const nearestTargetY =
      startY + ((((0 - startY) % 360) + 540) % 360) - 180;

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
        setRotY(0);
        cameraAnimRef.current = null;
      }
    };

    cameraAnimRef.current = requestAnimationFrame(step);
  }, [rotX, rotY, pan.x, pan.y]);

  const resetView = useCallback(() => {
    animateCameraReset();
  }, [animateCameraReset]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
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
    },
    []
  );

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
    const projected: Face[] = worldGeometry.map((wf, index) => {
      const proj = wf.pts3.map(project);
      // Usar o máximo zDepth (ponto mais próximo da câmera) ajuda a evitar que faces grandes fiquem atrás de faces menores
      const zDepth = Math.max(...proj.map((p) => p.zDepth));

      let b = 1;
      if (wf.normal) {
        b = brightness(wf.normal);
      }

      let fill = wf.fill;
      let hatchPattern = wf.hatchPattern;

      if (wf.kind === "WATER") {
        const isTop = wf.normal && wf.normal.y > 0.9;
        if (isTop) {
          hatchPattern = "url(#ripplePattern)";
        } else {
          hatchPattern = undefined;
        }
      }

      return {
        id: index,
        pts: proj.map((p) => ({ x: p.x, y: p.y })),
        fill: fill,
        opacity: wf.opacity,
        stroke: wf.stroke,
        strokeWidth: wf.strokeWidth,
        zDepth: zDepth,
        brightness: b,
        kind: wf.kind,
        hatchPattern: hatchPattern,
        priority: wf.priority ?? 0,
      };
    });

    projected.sort((a, b) => {
      if (a.zDepth !== b.zDepth) return a.zDepth - b.zDepth;
      if (a.kind !== b.kind) return a.kind === "WATER" ? -1 : 1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.id - b.id;
    });

    return projected;
  }, [worldGeometry, project, brightness]);

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