
import React from 'react';

export const TheoryReference: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Archimedes */}
      <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-6 rounded-2xl shadow-xl shadow-blue-200/25">
        <h3 className="text-lg font-black text-blue-700 mb-3 border-b border-blue-100/50 pb-2 tracking-tight">Princípio de Arquimedes</h3>
        <p className="text-slate-600 mb-4 text-sm leading-relaxed">
          "Um corpo imerso em um fluido sofre uma força de baixo para cima denominada empuxo (E), 
          igual ao peso do volume do fluido deslocado."
        </p>
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-center font-serif text-xl mb-4 text-slate-800">
          E = γ<sub>fluido</sub> · V<sub>sub</sub>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-bold text-slate-700 text-sm">Peso Aparente (Problema da Coroa)</h4>
          <p className="text-xs text-slate-500">
            Quando imerso, o corpo parece mais leve. Um dinamômetro mede a resultante:
          </p>
          <div className="bg-blue-600/10 p-2.5 rounded-lg text-center font-mono text-sm text-blue-900 border border-blue-200/50">
            P<sub>ap</sub> = P<sub>real</sub> - E
          </div>
        </div>
      </div>

      {/* Hydrostatics */}
      <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-6 rounded-2xl shadow-xl shadow-blue-200/25">
        <h3 className="text-lg font-black text-cyan-700 mb-3 border-b border-cyan-100/50 pb-2 tracking-tight">Lei de Stevin & Hidrostática</h3>
        <p className="text-slate-600 mb-4 text-sm leading-relaxed">
          A pressão em um fluido em repouso aumenta linearmente com a profundidade.
        </p>
        <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100 text-center font-serif text-lg mb-4 text-slate-800">
          P = P<sub>atm</sub> + γ · h
        </div>
        
        <h4 className="font-bold text-slate-700 text-sm mb-2">Força em Superfícies Planas</h4>
        <p className="text-xs text-slate-500 mb-2">
          A força resultante (Empuxo Hidrostático) atua no <strong>Centro de Pressão (CP)</strong>, que está sempre abaixo do Centro de Gravidade (CG) da área molhada.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
           <div className="bg-cyan-50 p-2.5 rounded-lg border border-cyan-100/50">
             <strong className="text-cyan-800">Força Resultante:</strong><br/>
             F = P<sub>CG</sub> · A
           </div>
           <div className="bg-cyan-50 p-2.5 rounded-lg border border-cyan-100/50">
             <strong className="text-cyan-800">Posição do CP:</strong><br/>
             y<sub>p</sub> = ȳ + I<sub>0</sub> / (A · ȳ)
           </div>
        </div>
      </div>

      {/* Stability */}
      <div className="bg-white/75 backdrop-blur-md border border-blue-100/70 p-6 rounded-2xl shadow-xl shadow-blue-200/25 md:col-span-2">
        <h3 className="text-lg font-black text-emerald-700 mb-3 border-b border-emerald-100/50 pb-2 tracking-tight">Flutuabilidade e Estabilidade</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
            <div className="font-black text-emerald-800 mb-1">ρ<sub>corpo</sub> &lt; ρ<sub>fluido</sub></div>
            <div className="text-slate-600 text-xs">O corpo flutua na superfície.</div>
          </div>
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
            <div className="font-black text-emerald-800 mb-1">ρ<sub>corpo</sub> = ρ<sub>fluido</sub></div>
            <div className="text-slate-600 text-xs">O corpo fica em equilíbrio neutro (submerso).</div>
          </div>
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
            <div className="font-black text-emerald-800 mb-1">ρ<sub>corpo</sub> &gt; ρ<sub>fluido</sub></div>
            <div className="text-slate-600 text-xs">O corpo afunda até o fundo.</div>
          </div>
        </div>
      </div>

    </div>
  );
};
