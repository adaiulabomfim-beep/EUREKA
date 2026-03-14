import React, { useState } from 'react';
import { LayoutDashboard, Anchor, Waves, BookOpen, GraduationCap, Mountain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImmersedBodiesLab } from './modulos/corpos-imersos';
import { DamLab } from './modulos/empuxo-em-superficies/barragens';
import { GatePressureLab } from './modulos/empuxo-em-superficies/pressao-em-comportas';
import { TheoryReference } from './interface/ReferenciaTeorica';
import { ChatBot } from './interface/ChatBot';
import { PaginaInicial } from './interface/PaginaInicial';
import { SimulationMode } from './types';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<SimulationMode>(SimulationMode.IMMERSED_BODIES);
  const [simulationContext, setSimulationContext] = useState<string>('');

  return (
    <>
      <AnimatePresence mode="wait">
        {!hasStarted ? (
          <motion.div key="landing" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
            <PaginaInicial onStart={() => setHasStarted(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-slate-100 to-blue-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900"
          >
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-white shadow-lg sticky top-0 z-50">
              <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                    <Waves className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight leading-none text-white drop-shadow-sm">
                      FENÔMENOS DE TRANSPORTE
                    </h1>
                    <p className="text-white/80 text-[9px] uppercase tracking-[0.2em] font-bold mt-1">
                      HIDROSTÁTICA E EMPUXO
                    </p>
                  </div>
                </div>

                {/* Bloco da direita (sem divisor sobrando) */}
                <div className="hidden md:flex items-center gap-6 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/90">
                      PROF. DAVI SANTIAGO AQUINO
                    </p>
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-white/70 font-bold">
                      <GraduationCap className="w-3 h-3" />
                      <span>
                        IFBA <span className="mx-1">•</span> CAMPUS EUNÁPOLIS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Navigation Tabs */}
            <div className="bg-white/75 backdrop-blur-md border-b border-blue-100/70 shadow-sm z-40 sticky top-16">
              <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex space-x-2 py-2 overflow-x-auto custom-scrollbar" aria-label="Tabs">
                  <button
                    onClick={() => setCurrentMode(SimulationMode.IMMERSED_BODIES)}
                    className={`
                      flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap
                      ${
                        currentMode === SimulationMode.IMMERSED_BODIES
                          ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                          : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
                      }
                    `}
                  >
                    <Anchor className="w-4 h-4" />
                    Corpos Imersos
                  </button>

                  <button
                    onClick={() => setCurrentMode(SimulationMode.DAM_HYDROLOGY)}
                    className={`
                      flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap
                      ${
                        currentMode === SimulationMode.DAM_HYDROLOGY
                          ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                          : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
                      }
                    `}
                  >
                    <Mountain className="w-4 h-4" />
                    Barragens
                  </button>

                  <button
                    onClick={() => setCurrentMode(SimulationMode.GATE_PRESSURE)}
                    className={`
                      flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap
                      ${
                        currentMode === SimulationMode.GATE_PRESSURE
                          ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                          : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
                      }
                    `}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Comportas
                  </button>

                  <button
                    onClick={() => setCurrentMode(SimulationMode.THEORY)}
                    className={`
                      flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap
                      ${
                        currentMode === SimulationMode.THEORY
                          ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                          : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
                      }
                    `}
                  >
                    <BookOpen className="w-4 h-4" />
                    Fundamentos Teóricos
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 max-w-full w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Section Title */}
                <div className="mb-8">
                  <h2 className="text-xl font-black tracking-normal uppercase text-cyan-500">
                    {currentMode === SimulationMode.IMMERSED_BODIES && 'Princípio de Arquimedes'}
                    {currentMode === SimulationMode.DAM_HYDROLOGY && 'Geometria e Análise de Barragens'}
                    {currentMode === SimulationMode.GATE_PRESSURE && 'Forças Hidrostáticas em Superfícies'}
                    {currentMode === SimulationMode.THEORY && 'Fundamentos Teóricos'}
                  </h2>
                  <p className="text-slate-500 text-sm mt-2 font-medium">
                    {currentMode === SimulationMode.IMMERSED_BODIES &&
                      'Simule flutuação, equilíbrio e submersão.'}
                    {currentMode === SimulationMode.DAM_HYDROLOGY && 'Análise do reservatório e geometria da barragem.'}
                    {currentMode === SimulationMode.GATE_PRESSURE &&
                      'Distribuição de pressão e força resultante em comportas planas e curvas.'}
                    {currentMode === SimulationMode.THEORY &&
                      'Fundamentos teóricos e fórmulas essenciais para os experimentos.'}
                  </p>
                </div>

                {currentMode === SimulationMode.IMMERSED_BODIES && <ImmersedBodiesLab onContextUpdate={setSimulationContext} />}
                {currentMode === SimulationMode.DAM_HYDROLOGY && <DamLab onContextUpdate={setSimulationContext} />}
                {currentMode === SimulationMode.GATE_PRESSURE && <GatePressureLab onContextUpdate={setSimulationContext} />}
                {currentMode === SimulationMode.THEORY && <TheoryReference />}
              </div>
            </main>

            {/* AI ChatBot Overlay */}
            <ChatBot simulationContext={simulationContext} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;