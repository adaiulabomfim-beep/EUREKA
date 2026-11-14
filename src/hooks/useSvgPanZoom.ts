import { useCallback, useEffect, useRef, useState } from 'react';

export interface SvgPanZoomOptions {
  svgWidth: number;
  svgHeight: number;
  minZoom?: number;
  maxZoom?: number;
  enabled?: boolean;
  /** Em cenas 3D baseadas em SVG, permite pan também com botão direito ou Shift + esquerdo */
  allowRightDragPan?: boolean;
}

interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
}

const isEditableElement = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
};

const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

export const useSvgPanZoom = ({
  svgWidth,
  svgHeight,
  minZoom = 0.45,
  maxZoom = 4.0,
  enabled = true,
  allowRightDragPan = false,
}: SvgPanZoomOptions) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [view, setView] = useState<ViewState>({ zoom: 1, panX: 0, panY: 0 });
  const viewRef = useRef<ViewState>({ zoom: 1, panX: 0, panY: 0 });

  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const spacePressedRef = useRef(false);

  const isPanningRef = useRef(false);
  const lastClientRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number | null>(null);

  const pinchRef = useRef<{
    active: boolean;
    dist: number;
    midClient: { x: number; y: number };
  }>({ active: false, dist: 0, midClient: { x: 0, y: 0 } });

  const commitView = useCallback((next: ViewState) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const cancelAnimation = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  /** Converte coordenadas client (px da janela) para coordenadas do viewBox SVG */
  const clientToSvg = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: svgWidth / 2, y: svgHeight / 2 };

      try {
        const ctm = svg.getScreenCTM();
        if (ctm && ctm.a !== 0 && ctm.d !== 0) {
          const pt = svg.createSVGPoint();
          pt.x = clientX;
          pt.y = clientY;
          const transformed = pt.matrixTransform(ctm.inverse());
          return { x: transformed.x, y: transformed.y };
        }
      } catch {
        // Fallback geométrico caso getScreenCTM falhe
      }

      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return { x: svgWidth / 2, y: svgHeight / 2 };
      }
      const scale = Math.min(rect.width / svgWidth, rect.height / svgHeight);
      const renderedW = svgWidth * scale;
      const renderedH = svgHeight * scale;
      const offsetX = rect.left + (rect.width - renderedW) / 2;
      const offsetY = rect.top + (rect.height - renderedH) / 2;
      return {
        x: (clientX - offsetX) / (scale || 1),
        y: (clientY - offsetY) / (scale || 1),
      };
    },
    [svgWidth, svgHeight]
  );

  /** Fator de conversão de pixels de tela para unidades do viewBox SVG */
  const getClientToSvgScale = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return 1;
    try {
      const ctm = svg.getScreenCTM();
      if (ctm && ctm.a !== 0) {
        return 1 / Math.abs(ctm.a);
      }
    } catch {
      // Fallback
    }
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return 1;
    const scale = Math.min(rect.width / svgWidth, rect.height / svgHeight);
    return scale > 0 ? 1 / scale : 1;
  }, [svgWidth, svgHeight]);

  /** Aplica zoom mantendo fixo o ponto focal (em coordenadas do viewBox SVG) */
  const zoomAtSvgPoint = useCallback(
    (nextZoomRaw: number, focalX: number, focalY: number) => {
      const cur = viewRef.current;
      const nextZoom = clamp(nextZoomRaw, minZoom, maxZoom);
      if (Math.abs(nextZoom - cur.zoom) < 1e-5) return;

      const worldX = (focalX - cur.panX) / cur.zoom;
      const worldY = (focalY - cur.panY) / cur.zoom;
      const nextPanX = focalX - worldX * nextZoom;
      const nextPanY = focalY - worldY * nextZoom;

      commitView({ zoom: nextZoom, panX: nextPanX, panY: nextPanY });
    },
    [commitView, minZoom, maxZoom]
  );

  const animateToView = useCallback(
    (target: ViewState, durationMs = 240) => {
      cancelAnimation();
      const start = { ...viewRef.current };
      const startTime = performance.now();

      const step = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const ease = 1 - Math.pow(1 - progress, 3);
        commitView({
          zoom: start.zoom + (target.zoom - start.zoom) * ease,
          panX: start.panX + (target.panX - start.panX) * ease,
          panY: start.panY + (target.panY - start.panY) * ease,
        });
        if (progress < 1) {
          animRef.current = requestAnimationFrame(step);
        } else {
          animRef.current = null;
        }
      };

      animRef.current = requestAnimationFrame(step);
    },
    [cancelAnimation, commitView]
  );

  const zoomIn = useCallback(() => {
    if (!enabled) return;
    const cur = viewRef.current;
    const nextZoom = clamp(cur.zoom * 1.25, minZoom, maxZoom);
    const fx = svgWidth / 2;
    const fy = svgHeight / 2;
    const wx = (fx - cur.panX) / cur.zoom;
    const wy = (fy - cur.panY) / cur.zoom;
    animateToView(
      { zoom: nextZoom, panX: fx - wx * nextZoom, panY: fy - wy * nextZoom },
      180
    );
  }, [enabled, minZoom, maxZoom, svgWidth, svgHeight, animateToView]);

  const zoomOut = useCallback(() => {
    if (!enabled) return;
    const cur = viewRef.current;
    const nextZoom = clamp(cur.zoom * 0.8, minZoom, maxZoom);
    const fx = svgWidth / 2;
    const fy = svgHeight / 2;
    const wx = (fx - cur.panX) / cur.zoom;
    const wy = (fy - cur.panY) / cur.zoom;
    animateToView(
      { zoom: nextZoom, panX: fx - wx * nextZoom, panY: fy - wy * nextZoom },
      180
    );
  }, [enabled, minZoom, maxZoom, svgWidth, svgHeight, animateToView]);

  const resetView = useCallback(() => {
    animateToView({ zoom: 1, panX: 0, panY: 0 }, 280);
  }, [animateToView]);

  // Rastreamento da tecla Espaço (Space + arraste esquerdo = pan)
  useEffect(() => {
    if (!enabled) {
      spacePressedRef.current = false;
      setIsSpacePressed(false);
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isEditableElement(e.target)) {
        if (!spacePressedRef.current) {
          spacePressedRef.current = true;
          setIsSpacePressed(true);
        }
        // Evita rolagem da página quando Espaço é usado dentro do simulador
        if (containerRef.current && containerRef.current.matches(':hover')) {
          e.preventDefault();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressedRef.current = false;
        setIsSpacePressed(false);
      }
    };

    const onBlur = () => {
      spacePressedRef.current = false;
      setIsSpacePressed(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [enabled]);

  // Listeners nativos { passive: false } para wheel (zoom no cursor) e touch (pinch + pan 2 dedos)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      cancelAnimation();

      const rawDelta =
        e.deltaMode === 1
          ? e.deltaY * 16
          : e.deltaMode === 2
            ? e.deltaY * 100
            : e.deltaY;
      const clampedDelta = clamp(rawDelta, -180, 180);
      const factor = Math.exp(-clampedDelta * 0.0018);

      const focal = clientToSvg(e.clientX, e.clientY);
      zoomAtSvgPoint(viewRef.current.zoom * factor, focal.x, focal.y);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        cancelAnimation();
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        pinchRef.current = {
          active: true,
          dist: Math.max(1, dist),
          midClient: {
            x: (t0.clientX + t1.clientX) / 2,
            y: (t0.clientY + t1.clientY) / 2,
          },
        };
      } else {
        pinchRef.current.active = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current.active) {
        e.preventDefault();
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const newDist = Math.max(
          1,
          Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
        );
        const newMidClient = {
          x: (t0.clientX + t1.clientX) / 2,
          y: (t0.clientY + t1.clientY) / 2,
        };

        const prevMidSvg = clientToSvg(
          pinchRef.current.midClient.x,
          pinchRef.current.midClient.y
        );
        const newMidSvg = clientToSvg(newMidClient.x, newMidClient.y);

        const cur = viewRef.current;
        const ratio = newDist / pinchRef.current.dist;
        const nextZoom = clamp(cur.zoom * ratio, minZoom, maxZoom);

        const worldX = (prevMidSvg.x - cur.panX) / cur.zoom;
        const worldY = (prevMidSvg.y - cur.panY) / cur.zoom;
        const nextPanX = newMidSvg.x - worldX * nextZoom;
        const nextPanY = newMidSvg.y - worldY * nextZoom;

        commitView({ zoom: nextZoom, panX: nextPanX, panY: nextPanY });

        pinchRef.current.dist = newDist;
        pinchRef.current.midClient = newMidClient;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchRef.current.active = false;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [
    enabled,
    cancelAnimation,
    clientToSvg,
    zoomAtSvgPoint,
    commitView,
    minZoom,
    maxZoom,
  ]);

  // Limpeza de animação ao desmontar
  useEffect(() => cancelAnimation, [cancelAnimation]);

  const startPan = useCallback(
    (clientX: number, clientY: number) => {
      cancelAnimation();
      isPanningRef.current = true;
      setIsPanning(true);
      lastClientRef.current = { x: clientX, y: clientY };

      const handleWindowMove = (ev: MouseEvent) => {
        if (!isPanningRef.current) return;
        const dxClient = ev.clientX - lastClientRef.current.x;
        const dyClient = ev.clientY - lastClientRef.current.y;
        lastClientRef.current = { x: ev.clientX, y: ev.clientY };

        const unitScale = getClientToSvgScale();
        const cur = viewRef.current;
        commitView({
          ...cur,
          panX: cur.panX + dxClient * unitScale,
          panY: cur.panY + dyClient * unitScale,
        });
      };

      const handleWindowUp = () => {
        isPanningRef.current = false;
        setIsPanning(false);
        window.removeEventListener('mousemove', handleWindowMove);
        window.removeEventListener('mouseup', handleWindowUp);
      };

      window.addEventListener('mousemove', handleWindowMove);
      window.addEventListener('mouseup', handleWindowUp);
    },
    [cancelAnimation, getClientToSvgScale, commitView]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      const isMiddle = e.button === 1;
      const isSpaceLeft = e.button === 0 && spacePressedRef.current;
      const isRightOrShift =
        allowRightDragPan &&
        (e.button === 2 || (e.button === 0 && e.shiftKey));

      if (isMiddle || isSpaceLeft || isRightOrShift) {
        e.preventDefault();
        e.stopPropagation();
        startPan(e.clientX, e.clientY);
      }
    },
    [enabled, allowRightDragPan, startPan]
  );

  const handleAuxClick = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
    }
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (allowRightDragPan) {
        e.preventDefault();
      }
    },
    [allowRightDragPan]
  );

  return {
    containerRef,
    svgRef,
    zoom: view.zoom,
    pan: { x: view.panX, y: view.panY },
    zoomPercent: Math.round(view.zoom * 100),
    isPanning,
    isSpacePressed,
    canZoomIn: view.zoom < maxZoom - 0.01,
    canZoomOut: view.zoom > minZoom + 0.01,
    zoomIn,
    zoomOut,
    resetView,
    minZoom,
    maxZoom,
    containerHandlers: {
      onMouseDown: handleMouseDown,
      onAuxClick: handleAuxClick,
      onContextMenu: handleContextMenu,
    },
  };
};
