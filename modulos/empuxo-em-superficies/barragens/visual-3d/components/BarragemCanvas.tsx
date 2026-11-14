import React, {
  ReactNode,
  Component,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Lights } from './Lights';

export interface Camera3DHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

// 1. LIGHTWEIGHT WEBGL DETECTOR
function checkWebGLSupportLeve(): boolean {
  if (typeof window === 'undefined' || !window.WebGLRenderingContext) {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

// Global console suppression for uncatchable WebGL warnings from R3F inside async setup
if (typeof console !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('THREE.WebGLRenderer') ||
      msg.includes('WebGL context') ||
      msg.includes('webgl') ||
      msg.includes('BindToCurrentSequence')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
}

// 2. FALLBACK COMPONENT
const WebGLFallback = ({ onRetry }: { onSwitchBack?: () => void; onRetry: () => void }) => {
  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full bg-slate-50 text-slate-500 p-8 text-center"
      style={{ minHeight: 520, borderRadius: '0.5rem' }}
    >
      <svg
        className="w-12 h-12 mx-auto text-amber-500 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h3 className="text-lg font-medium text-slate-800 mb-2">3D Acelerado Indisponível</h3>
      <p className="text-sm text-slate-600 mb-4">
        O contexto WebGL falhou ao iniciar neste ambiente.
        <br />
        Isto pode ocorrer por restrições do hardware ou do navegador.
      </p>

      <div className="flex gap-3 mt-2">
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded hover:bg-slate-300 transition shadow-sm"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
};

// 3. ERROR BOUNDARY
class CanvasErrorBoundary extends Component<
  { children: ReactNode; onFallback?: () => void; onRetry: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onFallback?: () => void; onRetry: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch() {
    // Silently catch and trigger fallback rendering
  }

  render() {
    if (this.state.hasError) {
      return <WebGLFallback onSwitchBack={this.props.onFallback} onRetry={this.props.onRetry} />;
    }
    return this.props.children;
  }
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

// Rig interno que gerencia OrbitControls, animação suave de zoom/reset e cálculo de zoom %
const CameraControlsRig: React.FC<{
  initialTarget: [number, number, number];
  defaultDistance: number;
  minDistance: number;
  maxDistance: number;
  controlRef?: React.MutableRefObject<Camera3DHandle | null>;
  onZoomChange?: (percent: number) => void;
}> = ({
  initialTarget,
  defaultDistance,
  minDistance,
  maxDistance,
  controlRef,
  onZoomChange,
}) => {
  const { camera } = useThree();
  const orbitRef = useRef<any>(null);
  const [spacePressed, setSpacePressed] = useState(false);

  const lastTargetRef = useRef<[number, number, number] | null>(null);
  const lastPctRef = useRef<number>(100);
  const offsetVecRef = useRef(new THREE.Vector3());

  const animRef = useRef<{
    mode: 'none' | 'dolly' | 'reset';
    goalDist: number;
    goalPos: THREE.Vector3;
    goalTarget: THREE.Vector3;
  }>({
    mode: 'none',
    goalDist: defaultDistance,
    goalPos: new THREE.Vector3(),
    goalTarget: new THREE.Vector3(),
  });

  // Inicializa / atualiza target apenas quando valores reais mudarem (preserva pan em re-renders)
  useEffect(() => {
    const ctrl = orbitRef.current;
    if (!ctrl) return;
    const prev = lastTargetRef.current;
    if (
      !prev ||
      Math.abs(prev[0] - initialTarget[0]) > 1e-4 ||
      Math.abs(prev[1] - initialTarget[1]) > 1e-4 ||
      Math.abs(prev[2] - initialTarget[2]) > 1e-4
    ) {
      ctrl.target.set(initialTarget[0], initialTarget[1], initialTarget[2]);
      ctrl.update();
      ctrl.saveState();
      lastTargetRef.current = [...initialTarget];
    }
  }, [initialTarget[0], initialTarget[1], initialTarget[2]]);

  // Espaço + arraste esquerdo alterna temporariamente para Pan também em 3D
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isEditableElement(e.target)) {
        setSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePressed(false);
    };
    const onBlur = () => setSpacePressed(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  const triggerDolly = useCallback(
    (factor: number) => {
      const ctrl = orbitRef.current;
      if (!ctrl) return;
      const minD = typeof ctrl.minDistance === 'number' ? ctrl.minDistance : minDistance;
      const maxD = typeof ctrl.maxDistance === 'number' ? ctrl.maxDistance : maxDistance;
      const curDist = camera.position.distanceTo(ctrl.target);
      const nextDist = Math.max(minD, Math.min(maxD, curDist * factor));
      animRef.current.mode = 'dolly';
      animRef.current.goalDist = nextDist;
    },
    [camera, minDistance, maxDistance]
  );

  const triggerReset = useCallback(() => {
    const ctrl = orbitRef.current;
    if (!ctrl) return;
    const pos0 = ctrl.position0 instanceof THREE.Vector3 ? ctrl.position0 : camera.position;
    const tgt0 = ctrl.target0 instanceof THREE.Vector3 ? ctrl.target0 : ctrl.target;
    animRef.current.mode = 'reset';
    animRef.current.goalPos.copy(pos0);
    animRef.current.goalTarget.copy(tgt0);
  }, [camera]);

  useEffect(() => {
    if (!controlRef) return;
    controlRef.current = {
      zoomIn: () => triggerDolly(0.78),
      zoomOut: () => triggerDolly(1.28),
      reset: triggerReset,
    };
    return () => {
      controlRef.current = null;
    };
  }, [controlRef, triggerDolly, triggerReset]);

  useFrame((_, delta) => {
    const ctrl = orbitRef.current;
    if (!ctrl) return;

    const anim = animRef.current;
    const alpha = 1 - Math.exp(-12 * Math.min(delta, 0.05));

    if (anim.mode === 'dolly') {
      const offset = offsetVecRef.current.copy(camera.position).sub(ctrl.target);
      const curDist = offset.length();
      if (curDist > 1e-4) {
        const nextDist = THREE.MathUtils.lerp(curDist, anim.goalDist, alpha);
        offset.setLength(nextDist);
        camera.position.copy(ctrl.target).add(offset);
        ctrl.update();
        if (Math.abs(nextDist - anim.goalDist) < 0.02) {
          offset.setLength(anim.goalDist);
          camera.position.copy(ctrl.target).add(offset);
          ctrl.update();
          anim.mode = 'none';
        }
      } else {
        anim.mode = 'none';
      }
    } else if (anim.mode === 'reset') {
      camera.position.lerp(anim.goalPos, alpha);
      ctrl.target.lerp(anim.goalTarget, alpha);
      ctrl.update();
      if (
        camera.position.distanceTo(anim.goalPos) < 0.05 &&
        ctrl.target.distanceTo(anim.goalTarget) < 0.05
      ) {
        camera.position.copy(anim.goalPos);
        ctrl.target.copy(anim.goalTarget);
        ctrl.update();
        anim.mode = 'none';
      }
    }

    if (onZoomChange) {
      const baseDist =
        ctrl.position0 instanceof THREE.Vector3 && ctrl.target0 instanceof THREE.Vector3
          ? Math.max(0.1, ctrl.position0.distanceTo(ctrl.target0))
          : defaultDistance;
      const curDist = Math.max(0.1, camera.position.distanceTo(ctrl.target));
      const pct = Math.max(1, Math.round((baseDist / curDist) * 100));
      if (pct !== lastPctRef.current) {
        lastPctRef.current = pct;
        onZoomChange(pct);
      }
    }
  });

  return (
    <OrbitControls
      ref={orbitRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enableRotate
      enableZoom
      enablePan
      screenSpacePanning
      rotateSpeed={0.75}
      zoomSpeed={0.9}
      panSpeed={0.9}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI / 2 - 0.04}
      mouseButtons={{
        LEFT: spacePressed ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.PAN,
      }}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      onStart={() => {
        animRef.current.mode = 'none';
      }}
    />
  );
};

// 4. MAIN WRAPPER
export const BarragemCanvas: React.FC<{
  children: ReactNode;
  targetY?: number;
  onFallback?: () => void;
  cameraPosition?: [number, number, number];
  fov?: number;
  target?: [number, number, number];
  controlRef?: React.MutableRefObject<Camera3DHandle | null>;
  onZoomChange?: (percent: number) => void;
  minDistance?: number;
  maxDistance?: number;
}> = ({
  children,
  targetY = 10,
  onFallback,
  cameraPosition = [-38, 32, 60],
  fov = 32,
  target,
  controlRef,
  onZoomChange,
  minDistance,
  maxDistance,
}) => {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setWebglSupported(checkWebGLSupportLeve());
  }, []);

  const handleRetry = () => {
    setWebglSupported(true);
    setRetryKey((k) => k + 1);
  };

  if (webglSupported === null) {
    return (
      <div
        className="w-full h-full bg-slate-50 animate-pulse border border-slate-200"
        style={{ minHeight: 520, borderRadius: '0.5rem' }}
      />
    );
  }

  if (webglSupported === false) {
    return (
      <div
        className="w-full h-full relative border border-slate-200"
        style={{ minHeight: 520, background: '#f8fafc', borderRadius: '0.5rem', overflow: 'hidden' }}
      >
        <WebGLFallback onSwitchBack={onFallback} onRetry={handleRetry} />
      </div>
    );
  }

  const controlsTarget: [number, number, number] = target || [0, targetY, 0];
  const initialDist = Math.max(
    1,
    Math.hypot(
      cameraPosition[0] - controlsTarget[0],
      cameraPosition[1] - controlsTarget[1],
      cameraPosition[2] - controlsTarget[2]
    )
  );
  const effectiveMinDistance = minDistance ?? Math.max(1.2, initialDist * 0.16);
  const effectiveMaxDistance = maxDistance ?? Math.max(40, initialDist * 4.0);

  return (
    <div
      className="w-full h-full relative touch-none"
      style={{ minHeight: 520, background: '#f8fafc', borderRadius: '0.5rem', overflow: 'hidden' }}
      onContextMenu={(e) => e.preventDefault()}
      onAuxClick={(e) => {
        if (e.button === 1) e.preventDefault();
      }}
      onMouseDown={(e) => {
        if (e.button === 1) e.preventDefault();
      }}
    >
      <CanvasErrorBoundary key={retryKey} onFallback={onFallback} onRetry={handleRetry}>
        <Canvas
          camera={{ position: cameraPosition, fov }}
          shadows
          gl={{
            toneMapping: THREE.NoToneMapping,
            antialias: true,
            preserveDrawingBuffer: true,
          }}
          onCreated={({ gl }) => {
            const handleContextLoss = (e: Event) => {
              e.preventDefault();
              if (onFallback) onFallback();
            };
            gl.domElement.addEventListener('webglcontextlost', handleContextLoss, false);
          }}
        >
          <Lights />
          <Environment preset="city" environmentIntensity={0.3} />
          {children}

          <CameraControlsRig
            initialTarget={controlsTarget}
            defaultDistance={initialDist}
            minDistance={effectiveMinDistance}
            maxDistance={effectiveMaxDistance}
            controlRef={controlRef}
            onZoomChange={onZoomChange}
          />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
};

