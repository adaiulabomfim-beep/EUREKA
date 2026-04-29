import React from "react";
import { motion } from "motion/react";
import { Play, Waves, ShieldCheck, Zap } from "lucide-react";
import { LogoEureka } from "../src/components/ui/LogoEureka";

interface LandingPageProps {
  onStart: () => void;
}

// >>> TROQUE AQUI PELO NOME DO PROFESSOR ORIENTADOR <<<
const PROFESSOR_ORIENTADOR = "PROF. DAVI SANTIAGO AQUINO";

const BUBBLES = [
  { left: "8%", size: 6, duration: 12, delay: 0 },
  { left: "14%", size: 3, duration: 9, delay: 2 },
  { left: "22%", size: 5, duration: 13, delay: 4 },
  { left: "29%", size: 2, duration: 8, delay: 1 },
  { left: "35%", size: 7, duration: 14, delay: 6 },
  { left: "42%", size: 4, duration: 10, delay: 3 },
  { left: "48%", size: 3, duration: 11, delay: 7 },
  { left: "55%", size: 6, duration: 15, delay: 5 },
  { left: "62%", size: 2, duration: 9, delay: 2.5 },
  { left: "68%", size: 5, duration: 12, delay: 8 },
  { left: "74%", size: 3, duration: 10, delay: 1.5 },
  { left: "80%", size: 7, duration: 14, delay: 9 },
  { left: "88%", size: 4, duration: 11, delay: 4.5 },
  { left: "93%", size: 2, duration: 8, delay: 6.5 },
] as const;

export const PaginaInicial: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="h-screen overflow-hidden flex flex-col relative font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 bg-gradient-to-b from-slate-50 via-slate-100 to-blue-50">
      <style>{`
        html, body, #root {
          height: 100%;
          overflow: hidden;
        }

        @keyframes waveMoveA { 
          0% { transform: translateX(0); } 
          100% { transform: translateX(-160px); } 
        }
        @keyframes waveMoveB { 
          0% { transform: translateX(-80px); } 
          100% { transform: translateX(140px); } 
        }
        @keyframes causticsPulseA {
          0% { opacity: .16; transform: scale(1); }
          50% { opacity: .34; transform: scale(1.05); }
          100% { opacity: .16; transform: scale(1); }
        }
        @keyframes causticsPulseB {
          0% { opacity: .12; transform: scale(1.03); }
          50% { opacity: .26; transform: scale(1); }
          100% { opacity: .12; transform: scale(1.03); }
        }
        @keyframes bubbleUp {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          15% { opacity: .55; }
          100% { transform: translateY(-300px) translateX(10px); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-wave-a, .anim-wave-b, .anim-caustics-a, .anim-caustics-b, .anim-bubble { 
            animation: none !important; 
          }
        }
      `}</style>

      {/* FUNDO BASE & GLOWS */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400/5 blur-[120px] rounded-full" />
      </div>

      {/* Refração (halo) atrás do card */}
      <div className="absolute inset-0 z-[5] pointer-events-none flex items-center justify-center">
        <div
          className="w-[920px] h-[540px] rounded-full blur-[60px] opacity-30"
          style={{
            background:
              "radial-gradient(circle at 50% 60%, rgba(34,211,238,0.18), transparent 55%), radial-gradient(circle at 40% 40%, rgba(59,130,246,0.18), transparent 60%)",
          }}
        />
      </div>

      {/* ÁREA DE ÁGUA */}
      <div className="absolute left-0 right-0 bottom-0 h-[42vh] z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/30 via-sky-500/25 to-cyan-400/20 backdrop-blur-[4px] saturate-[1.25]" />

        <div
          className="absolute inset-0 blur-md pointer-events-none anim-caustics-a"
          style={{
            animation: "causticsPulseA 12s ease-in-out infinite",
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.24), transparent 55%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(circle at 55% 25%, rgba(255,255,255,0.12), transparent 55%), radial-gradient(circle at 45% 70%, rgba(255,255,255,0.10), transparent 60%)",
            backgroundSize: "100% 100%",
          }}
        />
        <div
          className="absolute inset-0 blur-lg pointer-events-none anim-caustics-b"
          style={{
            animation: "causticsPulseB 16s ease-in-out infinite",
            backgroundImage:
              "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18), transparent 50%), radial-gradient(circle at 30% 80%, rgba(255,255,255,0.14), transparent 65%), radial-gradient(circle at 15% 55%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(circle at 60% 50%, rgba(255,255,255,0.08), transparent 60%)",
            backgroundSize: "100% 100%",
          }}
        />

        <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none z-10">
          <div
            className="absolute top-[10px] left-0 right-0 h-[2px] opacity-75"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.70), rgba(34,211,238,0.40), rgba(255,255,255,0.70), transparent)",
            }}
          />
          <div
            className="absolute top-[12px] left-0 right-0 h-6 opacity-50 blur-[6px]"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0))",
            }}
          />
          <div
            className="absolute top-2 -left-[15%] w-[130%] h-14 rounded-full blur-[2px] bg-white/35 anim-wave-a"
            style={{ animation: "waveMoveA 14s linear infinite" }}
          />
          <div
            className="absolute top-8 -left-[15%] w-[130%] h-10 rounded-full blur-[2px] bg-cyan-200/28 anim-wave-b"
            style={{ animation: "waveMoveB 20s linear infinite" }}
          />
        </div>

        {BUBBLES.map((b, idx) => (
          <div
            key={idx}
            className="absolute bottom-[-26px] rounded-full anim-bubble"
            style={{
              left: b.left,
              width: b.size,
              height: b.size,
              animation: `bubbleUp ${b.duration}s ease-in-out ${b.delay}s infinite`,
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(255,255,255,0.38)",
              filter: "blur(0.4px)",
              mixBlendMode: "screen",
              boxShadow: "0 0 10px rgba(255,255,255,0.18)",
            }}
          />
        ))}
      </div>

      {/* TOPBAR */}
      <header className="relative z-30 w-full px-10 py-6 flex justify-between items-start bg-white/40 backdrop-blur-sm border-b border-blue-100/20">
        {/* Esquerda */}
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">
            IFBA <span className="mx-2 text-slate-300">•</span> ENGENHARIA CIVIL
          </div>
          <div className="text-[10px] tracking-[0.25em] text-slate-400">
            <span className="italic">CAMPUS</span> EUNÁPOLIS
          </div>
        </div>

        {/* Direita */}
        <div className="flex flex-col gap-1 text-right">
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">
            FENÔMENOS DE TRANSPORTE
          </div>
          <div className="text-[10px] tracking-[0.25em] text-slate-400">
            {PROFESSOR_ORIENTADOR}
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-xl bg-white/80 backdrop-blur-md border border-blue-100/70 shadow-2xl shadow-blue-200/30 rounded-[2.5rem] overflow-hidden relative z-10"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500" />

          {/* Refinamento do grid interno */}
          <div className="pt-14 pb-12 px-12 text-center flex flex-col items-center">
            {/* TÍTULO (mais alto e mais leve) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, scale: [1, 1.01, 1] }}
              transition={{
                opacity: { delay: 0.15, duration: 0.7 },
                y: { delay: 0.15, duration: 0.7 },
                scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              }}
              className="flex items-center gap-2 mb-3"
            >
              {/* Gradiente ainda mais claro */}
              <h1
                className="
                  text-6xl font-black tracking-tight
                  bg-clip-text text-transparent
                  bg-gradient-to-r
                  from-blue-500
                  via-sky-400
                  to-cyan-300
                  drop-shadow-[0_10px_24px_rgba(56,189,248,0.16)]
                "
              >
                EUREKA
              </h1>

              {/* Exclamação + gota */}
              <div className="flex flex-col items-center justify-center h-[3.8rem] pt-1">
                <div className="w-2.5 h-10 bg-blue-500 rounded-sm mb-1.5" />
                <motion.div
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-3.5 h-3.5 bg-gradient-to-br from-sky-400 to-cyan-300 rounded-full rounded-tr-none rotate-45 shadow-[0_2px_14px_rgba(56,189,248,0.55)]"
                />
              </div>
            </motion.div>

            <p className="text-sm font-medium tracking-[0.12em] text-slate-600 mb-8">
              Laboratório Virtual de Hidrostática e Empuxo
            </p>

            <div className="w-24 h-[1px] bg-slate-100 mb-10" />

            {/* BOTÃO (mais bem enquadrado no centro do card) */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.55 }}
              className="mb-12"
            >
              <button
                onClick={onStart}
                className="
                  group relative
                  flex items-center justify-center gap-3
                  min-w-[280px]
                  bg-gradient-to-br from-blue-600 to-blue-500
                  hover:from-blue-700 hover:to-blue-600
                  text-white
                  px-12 py-4
                  rounded-2xl
                  font-bold text-xs
                  tracking-[0.22em] uppercase
                  transition-all duration-300
                  active:scale-95
                  shadow-lg shadow-blue-500/20
                  hover:shadow-blue-600/40
                  hover:saturate-[1.1]
                "
              >
                INICIAR SIMULAÇÃO
                <Play className="w-3.5 h-3.5 fill-current group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </motion.div>

            {/* BADGES */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="flex justify-center gap-6 mb-10"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/60 border border-blue-100/50 backdrop-blur-sm">
                <Waves className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-blue-600/80">
                  Física Real
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50/60 border border-emerald-100/50 backdrop-blur-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/80">
                  Didático
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50/60 border border-amber-100/50 backdrop-blur-sm">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600/80">
                  Interativo
                </span>
              </div>
            </motion.div>

            {/* DETALHE CIENTÍFICO */}
            <div className="flex gap-6 opacity-40 text-[10px] font-mono tracking-widest text-slate-500">
              <span>E = ρ·g·V</span>
              <span className="text-slate-300">|</span>
              <span>
                P = P<sub>atm</sub> + ρ·g·h
              </span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 w-full py-10 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.9 }}
          className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-400/60"
        >
          DESENVOLVIDO POR <span className="text-slate-500">ADAIULA FERRAZ</span>
        </motion.p>
      </footer>
    </div>
  );
};