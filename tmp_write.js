import fs from 'fs';

const content = `import React from 'react';
import { formatarDadosSimulacao, obterDimensoesLimpas } from '../../utils/exportacao/formatarDadosSimulacao';
import { montarEnunciado } from '../../utils/exportacao/montarEnunciado';
import { 
  Waves, Calendar, FileText, User, Box, 
  RefreshCcw, Layers, ArrowDown, ArrowUp, 
  Sigma, BarChart, CheckCircle 
} from 'lucide-react';

export const RelatorioVisualEureka = ({ simulacao, imagemSimulacao, dataText }) => {
  const dados = formatarDadosSimulacao(simulacao);
  const dimsLimpas = obterDimensoesLimpas(dados);
  const enunciado = montarEnunciado(dados);

  const dataApenas = (() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return \`\${d} / \${m} / \${y}\`;
  })();

  let statusLabel = "EQUILÍBRIO";
  let relCond = "(P = E)";
  
  if (dados.statusFisico.includes("AFUNDAR") || dados.statusFisico.includes("AFUNDA")) {
      statusLabel = "AFUNDA";
      relCond = "(P > E)";
  } else if (dados.statusFisico.includes("FLUTUAR") || dados.statusFisico.includes("FLUTUA")) {
      statusLabel = "FLUTUA";
      relCond = "(P < E)";
  }

  const analiseQualitativa = () => {
    if (statusLabel === "AFUNDA") return <>Como o peso do corpo (P) é maior que o empuxo (E), a força resultante é dirigida para baixo. Assim, o corpo tenderá a <strong className="text-indigo-600">AFUNDAR</strong> no fluido até atingir o fundo do recipiente.</>;
    if (statusLabel === "FLUTUA") return <>Como a densidade do corpo é menor que a do fluido, o corpo irá <strong className="text-emerald-600">FLUTUAR</strong>. Uma parte do seu volume ficará submersa para gerar um empuxo que equilibre o peso.</>;
    return <>As densidades são iguais. O objeto permanecerá em <strong className="text-blue-600">EQUILÍBRIO</strong> (totalmente submerso) onde for posicionado no fluido.</>;
  }

  const alturaSubmersa = (() => {
    if (dados.tipo !== 'corpos-imersos') return null;
    const dim = simulacao.dimensoes || {};
    const dim1 = dim['Aresta/Raio (cm)'] || dim['Aresta/Raio'] || 0;
    const dim2 = dim['Comprimento (cm)'] || dim['Comprimento'] || 0;
    const objDens = parseFloat(simulacao.densidadeObjeto) || 0;
    const fluidDens = parseFloat(simulacao.densidadeFluido) || 0;
    
    if (fluidDens === 0) return null;
    
    const ratio = Math.min(1, objDens / fluidDens);
    
    let h = 0;
    if (dados.geometria === 'CUBE') h = (Number(dim1) / 100) * ratio;
    else if (dados.geometria === 'CYLINDER') h = (Number(dim2) / 100) * ratio;
    else if (dados.geometria === 'SPHERE') h = (Number(dim1) / 100) * 2 * ratio;
    else h = (Number(dim2) / 100) * ratio;
    
    if (objDens >= fluidDens) {
      if (dados.geometria === 'CUBE') h = Number(dim1) / 100;
      else if (dados.geometria === 'CYLINDER') h = Number(dim2) / 100;
      else if (dados.geometria === 'SPHERE') h = (Number(dim1) / 100) * 2;
      else h = Number(dim2) / 100;
    }

    return h.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' m';
  })();

  const descricaoProblema = () => {
    const dim = simulacao.dimensoes || {};
    const dim1 = dim['Aresta/Raio (cm)'] || dim['Aresta/Raio'] || dim['Base (m)'] || 0;
    const dim2 = dim['Comprimento (cm)'] || dim['Comprimento'] || dim['Altura (m)'] || 0;
    const formatMeters = (cm) => (Number(cm) / 100).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' m';
    
    if (dados.tipo === 'corpos-imersos') {
      let desc;
      if (dados.geometria === 'CUBE') desc = <span>Um bloco cúbico de aresta <strong className="text-slate-800">{formatMeters(dim1)}</strong></span>;
      else if (dados.geometria === 'SPHERE') desc = <span>Uma esfera de raio <strong className="text-slate-800">{formatMeters(dim1)}</strong></span>;
      else if (dados.geometria === 'CYLINDER') desc = <span>Um cilindro de raio <strong className="text-slate-800">{formatMeters(dim1)}</strong> e altura <strong className="text-slate-800">{formatMeters(dim2)}</strong></span>;
      else if (dados.geometria === 'RECT' || dados.geometria === 'CUBOID') desc = <span>Um paralelepípedo de aresta da base <strong className="text-slate-800">{formatMeters(dim1)}</strong> e altura <strong className="text-slate-800">{formatMeters(dim2)}</strong></span>;
      else desc = <span>Um bloco de aresta <strong className="text-slate-800">{formatMeters(dim1)}</strong></span>;

      return (
        <>{desc} e densidade de <strong className="text-slate-800">{dados.densidadeObjetoFmt}</strong> é colocado em um recipiente contendo um fluido de densidade <strong className="text-slate-800">{dados.densidadeFluidoFmt}</strong>. Considerando a aceleração da gravidade <strong className="text-slate-800">g = {dados.gravidade}</strong>, determine:</>
      );
    }
    
    return <>{enunciado}</>;
  };

  return (
    <div id="relatorio-eureka" className="bg-white mx-auto flex flex-col font-sans" style={{ width: '794px', minHeight: '1123px' }}>
      
      {/* HEADER */}
      <header className="bg-gradient-to-r from-blue-700 to-sky-500 p-6 text-white flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <Waves size={36} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight m-0">EUREKA!</h1>
            <p className="text-sm font-light opacity-90 m-0 leading-tight mt-1">Laboratório Virtual de Hidrostática e Empuxo</p>
          </div>
        </div>
        <div className="text-xs text-right space-y-1.5 opacity-90">
          <div className="flex items-center justify-end gap-2">
            <Calendar size={14} />
            <span>Data da Simulação: {dataText}</span>
          </div>
          <div className="flex items-center justify-end gap-2 text-right">
            <FileText size={14} className="shrink-0" />
            <span className="max-w-[180px] leading-tight">Relatório gerado automaticamente pelo sistema <strong>EUREKA</strong></span>
          </div>
        </div>
      </header>

      <main className="p-8 space-y-7 flex-grow flex flex-col">
        
        {/* INFORMAÇÕES GERAIS */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5 text-sky-600 font-bold uppercase text-xs tracking-wider">
            <User size={18} /> INFORMAÇÕES GERAIS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Instituição</label>
              <div className="border-b-2 border-slate-100 py-1 text-slate-800 min-h-[1.5rem] text-sm">&nbsp;</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Disciplina</label>
              <div className="border-b-2 border-slate-100 py-1 text-slate-800 min-h-[1.5rem] text-sm">&nbsp;</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Professor(a)</label>
              <div className="border-b-2 border-slate-100 py-1 text-slate-800 min-h-[1.5rem] text-sm">&nbsp;</div>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Aluno(a)</label>
              <div className="border-b-2 border-slate-100 py-1 text-slate-800 min-h-[1.5rem] text-sm">&nbsp;</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Data</label>
              <div className="py-1 text-slate-800 font-medium text-sm">{dataApenas}</div>
            </div>
          </div>
        </section>

        {/* 1. DESCRIÇÃO DO PROBLEMA */}
        <section>
          <h2 className="text-[16px] font-bold text-blue-900 mb-2 uppercase flex items-center gap-2">1. DESCRIÇÃO DO PROBLEMA</h2>
          <p className="text-slate-600 leading-relaxed text-[13px]">
            {descricaoProblema()}
          </p>
        </section>

        <div className="grid grid-cols-2 gap-6">
          {/* VISUALIZAÇÃO DA SIMULAÇÃO */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-sky-600 font-bold uppercase text-xs tracking-wider">
              <Box size={18} /> VISUALIZAÇÃO DA SIMULAÇÃO
            </div>
            <div className="relative bg-slate-50 border border-slate-100 rounded-lg flex-grow min-h-[260px] flex items-center justify-center overflow-hidden">
              <div className="absolute top-3 right-3 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm z-10">
                <Layers size={16} className="text-slate-400" />
              </div>
              
              <div className="relative w-full h-full flex items-center justify-center p-4">
                {imagemSimulacao ? (
                  <img src={imagemSimulacao} alt="Visualização" className="w-[120%] h-[120%] object-contain" />
                ) : (
                  <span className="text-slate-400 text-sm">[Sem Imagem]</span>
                )}
              </div>
            </div>
          </div>

          {/* DADOS DA SIMULAÇÃO */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-sky-600 font-bold uppercase text-xs tracking-wider">
              <FileText size={18} /> DADOS DA SIMULAÇÃO
            </div>
            <div className="space-y-[2px] mt-2">
              <div className="flex justify-between items-center p-2 border-b border-slate-50 rounded-lg">
                <span className="text-slate-500 text-[12px]">Geometria do Objeto:</span>
                <span className="font-bold text-slate-800 text-[12px]">{dados.geometriaNome}</span>
              </div>
              {dimsLimpas.map((d, i) => (
                  <div className="flex justify-between items-center p-2 border-b border-slate-50 rounded-lg" key={i}>
                    <span className="text-slate-500 text-[12px]">{d.label}:</span>
                    <span className="font-bold text-slate-800 text-[12px]">{d.value}</span>
                  </div>
              ))}
              {dados.tipo === 'corpos-imersos' && (
                  <div className="flex justify-between items-center p-2 border-b border-slate-50 rounded-lg">
                    <span className="text-slate-500 text-[12px]">Densidade do Objeto (ρ<sub>o</sub>):</span>
                    <span className="font-bold text-slate-800 text-[12px]">{dados.densidadeObjetoFmt}</span>
                  </div>
              )}
              <div className="flex justify-between items-center p-2 border-b border-slate-50 rounded-lg">
                <span className="text-slate-500 text-[12px]">Densidade do Fluido (ρ<sub>f</sub>):</span>
                <span className="font-bold text-slate-800 text-[12px]">{dados.densidadeFluidoFmt}</span>
              </div>
              <div className="flex justify-between items-center p-2 border-b border-slate-50 rounded-lg">
                <span className="text-slate-500 text-[12px]">Gravidade (g):</span>
                <span className="font-bold text-slate-800 text-[12px]">{dados.gravidade}</span>
              </div>
              {dados.tipo === 'corpos-imersos' && alturaSubmersa && (
                  <div className="flex justify-between items-center p-2 border-b border-slate-50 rounded-lg">
                    <span className="text-slate-500 text-[12px]">Altura Submersa (h):</span>
                    <span className="font-bold text-slate-800 text-[12px]">{alturaSubmersa}</span>
                  </div>
              )}
              <div className="flex justify-between items-center p-2 rounded-lg">
                <span className="text-slate-500 text-[12px]">Volume Submerso:</span>
                <span className="font-bold text-slate-800 text-[12px]">{dados.volumeDeslocadoFmt}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 2. FÓRMULAS UTILIZADAS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5 text-sky-600 font-bold uppercase text-xs tracking-wider">
              <Sigma size={18} /> 2. FÓRMULAS UTILIZADAS
            </div>
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] text-sky-600 font-bold mb-1 uppercase">Peso (P):</p>
                <div className="text-center italic font-serif text-slate-800 py-1 text-[15px]">
                  P = ρ<sub>o</sub> · g · V<sub>total</sub>
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] text-sky-600 font-bold mb-1 uppercase">Empuxo (E):</p>
                <div className="text-center italic font-serif text-slate-800 py-1 text-[15px]">
                  E = ρ<sub>f</sub> · g · V<sub>submerso</sub>
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] text-sky-600 font-bold mb-1 uppercase">Peso Aparente (P<sub>ap</sub>):</p>
                <div className="text-center italic font-serif text-slate-800 py-1 text-[15px]">
                  P<sub>ap</sub> = P - E
                </div>
              </div>
            </div>
          </div>

          {/* 3. RESULTADOS OBTIDOS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4 text-sky-600 font-bold uppercase text-xs tracking-wider shrink-0">
              <BarChart size={18} /> 3. RESULTADOS OBTIDOS
            </div>
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border-l-4 border-red-500">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Peso (P):</span>
                <span className="text-[14px] font-bold text-red-600">{dados.pesoFmt}</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border-l-4 border-emerald-500">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Empuxo (E):</span>
                <span className="text-[14px] font-bold text-emerald-600">{dados.empuxoFmt}</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border-l-4 border-blue-500">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">P<sub>ap</sub>:</span>
                <span className="text-[14px] font-bold text-blue-600">{dados.pesoAparenteFmt}</span>
              </div>
              
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center justify-center shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Condição:</span>
                    <div className="px-6 py-1.5 rounded-full font-black text-sm tracking-widest shadow-sm" style={{
                        background: statusLabel === "AFUNDA" ? '#f3e8ff' : statusLabel === "FLUTUA" ? '#dcfce7' : '#e0f2fe',
                        color: statusLabel === "AFUNDA" ? '#9333ea' : statusLabel === "FLUTUA" ? '#16a34a' : '#0284c7'
                    }}>
                    {statusLabel}
                    </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1.5">{relCond}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. ANÁLISE QUALITATIVA */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mt-auto mb-2">
          <div className="flex items-center gap-2 mb-3 text-sky-600 font-bold uppercase text-xs tracking-wider">
            <CheckCircle size={18} /> 4. ANÁLISE QUALITATIVA
          </div>
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-slate-700 leading-relaxed text-[13px]">
            {analiseQualitativa()}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-auto p-8 flex flex-col items-center gap-1.5 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2 text-sky-500 font-black text-xl">
          <Waves size={24} /> EUREKA!
        </div>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Laboratório Virtual de Hidrostática e Empuxo</p>
      </footer>
    </div>
  );
};
`;

fs.writeFileSync('./src/components/relatorios/RelatorioVisualEureka.jsx', content);
