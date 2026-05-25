import React, { ReactNode, Component, ErrorInfo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Lights } from './Lights';

// 1. LIGHTWEIGHT WEBGL DETECTOR
function checkWebGLSupportLeve(): boolean {
  if (typeof window === 'undefined' || !window.WebGLRenderingContext) {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
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
      // Ignored WebGL error
      return;
    }
    originalError.call(console, ...args);
  };
}

// 2. FALLBACK COMPONENT
const WebGLFallback = ({ onSwitchBack, onRetry }: { onSwitchBack?: () => void, onRetry: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 text-slate-500 p-8 text-center" style={{ minHeight: 520, borderRadius: '0.5rem' }}>
      <svg className="w-12 h-12 mx-auto text-amber-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 className="text-lg font-medium text-slate-800 mb-2">3D Acelerado Indisponível</h3>
      <p className="text-sm text-slate-600 mb-4">
        O contexto WebGL falhou ao iniciar neste ambiente.
        <br/>Isto pode ocorrer por restrições do hardware ou do navegador.
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
class CanvasErrorBoundary extends Component<{ children: ReactNode, onFallback?: () => void, onRetry: () => void }, { hasError: boolean }> {
  constructor(props: { children: ReactNode, onFallback?: () => void, onRetry: () => void }) {
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

// 4. MAIN WRAPPER
export const BarragemCanvas: React.FC<{ children: ReactNode, targetY?: number, onFallback?: () => void }> = ({ children, targetY = 10, onFallback }) => {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    // Component Mount: Lightweight check only
    setWebglSupported(checkWebGLSupportLeve());
  }, []);

  const handleRetry = () => {
    setWebglSupported(true);
    setRetryKey(k => k + 1);
  };

  if (webglSupported === null) {
    return <div className="w-full h-full bg-slate-50 animate-pulse border border-slate-200" style={{ minHeight: 520, borderRadius: '0.5rem' }} />;
  }

  if (webglSupported === false) {
    return (
      <div className="w-full h-full relative border border-slate-200" style={{ minHeight: 520, background: '#f8fafc', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <WebGLFallback onSwitchBack={onFallback} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ minHeight: 520, background: '#f8fafc', borderRadius: '0.5rem', overflow: 'hidden' }}>
      <CanvasErrorBoundary key={retryKey} onFallback={onFallback} onRetry={handleRetry}>
        <Canvas 
          camera={{ position: [-38, 32, 60], fov: 32 }} 
          shadows
          onCreated={({ gl }) => {
            // Se o canvas perder contexto, o onError não seria chamado pela boundary,
            // mas podemos forçar fallback se ele não conseguir restaurar
            const handleContextLoss = (e: Event) => {
               e.preventDefault();
               if (onFallback) onFallback();
            };
            gl.domElement.addEventListener('webglcontextlost', handleContextLoss, false);
          }}
        >
          <Lights />
          <Environment preset="city" />
          {children}
          
          <OrbitControls makeDefault target={[0, targetY, 0]} maxPolarAngle={Math.PI / 2 - 0.05} />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
};
