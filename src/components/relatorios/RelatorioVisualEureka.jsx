import React from 'react';
import { formatarDadosSimulacao, obterDimensoesLimpas } from '../../utils/exportacao/formatarDadosSimulacao';
import { montarEnunciado } from '../../utils/exportacao/montarEnunciado';

export const RelatorioVisualEureka = ({ simulacao, imagemSimulacao, dataText }) => {
  const dados = formatarDadosSimulacao(simulacao);
  const dimsLimpas = obterDimensoesLimpas(dados);
  const enunciado = montarEnunciado(dados);

  // Extrair apenas a data (sem hora) para o campo Aluno
  const dataApenas = (() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d} / ${m} / ${y}`;
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
    if (statusLabel === "AFUNDA") return <>Como o peso do corpo (P) é maior que o empuxo (E), a força resultante é dirigida para baixo. Assim, o corpo tenderá a <strong>AFUNDAR</strong> no fluido.</>;
    if (statusLabel === "FLUTUA") return <>Como a densidade do corpo é menor que a do fluido, o corpo irá <strong>FLUTUAR</strong>. Uma parte do seu volume ficará submersa para gerar um empuxo que equilibre o peso.</>;
    return <>As densidades são iguais. O objeto permanecerá em <strong>EQUILÍBRIO</strong> (totalmente submerso) onde for posicionado no fluido.</>;
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
    if (dados.geometria === 'CUBE') {
      h = (Number(dim1) / 100) * ratio;
    } else if (dados.geometria === 'CYLINDER') {
      h = (Number(dim2) / 100) * ratio;
    } else if (dados.geometria === 'SPHERE') {
      h = (Number(dim1) / 100) * 2 * ratio;
    } else {
      h = (Number(dim2) / 100) * ratio;
    }
    
    if (objDens >= fluidDens) {
      if (dados.geometria === 'CUBE') h = Number(dim1) / 100;
      else if (dados.geometria === 'CYLINDER') h = Number(dim2) / 100;
      else if (dados.geometria === 'SPHERE') h = (Number(dim1) / 100) * 2;
      else h = Number(dim2) / 100;
    }

    return h.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' m';
  })();

  /* ─── SVG icons as inline data URIs ─── */
  const mkIcon = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

  const iconWaves = mkIcon('<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>');
  const iconWavesBlue = mkIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="%230ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>');
  const iconCalendar = mkIcon('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>');
  const iconDoc = mkIcon('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>');

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .rv-page { width: 794px; height: 1123px; margin: 0 auto; background: #ffffff; font-family: "Segoe UI", "Inter", Arial, sans-serif; color: #1e293b; display: flex; flex-direction: column; overflow: hidden; }

        /* ── HEADER ── */
        .rv-header { height: 100px; padding: 20px 34px; display: flex; justify-content: space-between; align-items: center; color: white; background: linear-gradient(90deg, #1d4ed8 0%, #06b6d4 100%); border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; flex-shrink: 0; }
        .rv-brand { display: flex; align-items: center; gap: 14px; }
        .rv-logo-box { width: 56px; height: 56px; border: 1.5px solid rgba(255,255,255,0.4); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .rv-brand-title { font-size: 34px; font-weight: 900; letter-spacing: 1px; color: #67e8f9; line-height: 1; }
        .rv-brand-subtitle { margin-top: 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.3px; color: white; }
        .rv-header-info { display: flex; flex-direction: column; gap: 6px; font-size: 11.5px; font-weight: 500; }
        .rv-header-info-line { display: flex; align-items: flex-start; gap: 8px; justify-content: flex-start; }
        .rv-header-info-line img { margin-top: 2px; }

        /* ── CONTENT ── */
        .rv-content { padding: 24px 34px 0; flex: 1; display: flex; flex-direction: column; gap: 0; }
        .rv-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }

        /* ── INFO CARD ── */
        .rv-info-card { padding: 16px 24px; margin-bottom: 24px; }
        .rv-section-title { color: #0f4fd6; font-weight: 800; font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase; text-align: center; margin-bottom: 16px; }
        .rv-fields-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; font-size: 12px; color: #475569; margin-bottom: 12px; }
        .rv-field { display: flex; align-items: flex-end; gap: 8px; }
        .rv-field span { white-space: nowrap; padding-bottom: 2px; }
        .rv-blank { border-bottom: 1px solid #cbd5e1; flex: 1; height: 16px; }
        .rv-student-row { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; font-size: 12px; color: #475569; }
        .rv-date-value { color: #1e293b; font-weight: 700; font-size: 12px; padding-bottom: 2px; }

        /* ── PROBLEM ── */
        .rv-problem-section { margin-bottom: 20px; }
        .rv-problem-title { font-size: 16px; font-weight: 800; color: #0f4fd6; margin-bottom: 8px; text-transform: uppercase; }
        .rv-problem-text { font-size: 13px; line-height: 1.6; color: #334155; }
        .rv-problem-text strong { font-weight: 700; color: #0f172a; }

        /* ── GRID ── */
        .rv-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 0px; }
        .rv-content-card { padding: 16px 20px; margin-bottom: 20px; }
        .rv-card-title { color: #0f4fd6; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; margin-bottom: 16px; position: relative; padding-bottom: 10px; }
        .rv-card-title::after { content: ''; display: block; width: 100%; height: 1px; background: #f1f5f9; position: absolute; bottom: 0; left: 0; }

        /* ── SIMULATION TOOLBAR ── */
        .rv-sim-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .rv-sim-btn { display: flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.3px; }
        .rv-sim-btn-off { background: #f1f5f9; color: #475569; }
        .rv-sim-btn-on { background: #eff6ff; color: #1d4ed8; }
        .rv-sim-btn-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .rv-sim-btn-off .rv-sim-btn-dot { background: #94a3b8; }
        .rv-sim-btn-on .rv-sim-btn-dot { background: #3b82f6; }

        /* ── SIMULATION BOX ── */
        .rv-simulation-box { position: relative; height: 240px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .rv-simulation-box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #0ea5e9, #8b5cf6); }
        .rv-simulation-box img { width: 100%; height: 100%; object-fit: contain; padding-top: 10px; }

        /* ── DATA LIST ── */
        .rv-data-list { display: flex; flex-direction: column; gap: 6px; }
        .rv-data-row { min-height: 32px; padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0; background: #ffffff; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748b; }
        .rv-data-row strong { color: #0f172a; font-weight: 700; text-align: right; }

        /* ── FORMULAS ── */
        .rv-formula-row { min-height: 42px; padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0; background: #ffffff; display: grid; grid-template-columns: 110px 1fr; align-items: center; margin-bottom: 6px; }
        .rv-formula-label { color: #1d4ed8; font-weight: 700; font-size: 11.5px; font-style: italic; }
        .rv-formula { text-align: center; font-size: 16px; font-family: "Times New Roman", "Georgia", serif; color: #1e293b; }
        .rv-formula .v { font-style: italic; }
        .rv-formula .s { font-size: 11px; vertical-align: sub; font-style: italic; }

        /* ── RESULTS ── */
        .rv-result-row { min-height: 38px; padding: 8px 12px; margin-bottom: 8px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; color: #1e293b; }
        .rv-result-red { background: #fef2f2; border-left: 5px solid #ef4444; }
        .rv-result-green { background: #f0fdf4; border-left: 5px solid #22c55e; }
        .rv-result-blue { background: #eff6ff; border-left: 5px solid #3b82f6; }
        .rv-val-red { color: #ef4444; font-weight: 800; font-size: 13px; }
        .rv-val-green { color: #22c55e; font-weight: 800; font-size: 13px; }
        .rv-val-blue { color: #3b82f6; font-weight: 800; font-size: 13px; }

        /* ── CONDITION ── */
        .rv-condition-row { background: #faf5ff; border-radius: 6px; min-height: 38px; padding: 6px 12px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 600; color: #1e293b; border-left: 5px solid #a855f7; }
        .rv-badge { background: #f3e8ff; color: #9333ea; padding: 3px 16px; border-radius: 20px; font-size: 11.5px; font-weight: 800; text-align: center; letter-spacing: 1px; }
        .rv-cond-sub { text-align: center; margin-top: 2px; font-size: 10px; color: #6b7280; }

        /* ── ANALYSIS ── */
        .rv-analysis-card { padding: 16px 24px; margin-bottom: 20px; }
        .rv-analysis-text { padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12.5px; line-height: 1.6; color: #334155; }
        .rv-analysis-text strong { color: #7c3aed; font-weight: 800; }

        /* ── FOOTER ── */
        .rv-footer { height: 60px; margin-top: auto; background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
        .rv-footer-title { font-size: 18px; font-weight: 900; color: #0ea5e9; display: flex; align-items: center; gap: 6px; }
        .rv-footer-sub { font-size: 10px; color: #64748b; margin-top: 2px; font-weight: 500; }
      `}</style>

      <div id="relatorio-eureka" className="rv-page">
        {/* ═══════════ HEADER ═══════════ */}
        <header className="rv-header">
          <div className="rv-brand">
            <div className="rv-logo-box">
              <img src={iconWaves} alt="" style={{ width: '30px', height: '30px' }} />
            </div>
            <div>
              <div className="rv-brand-title">EUREKA!</div>
              <div className="rv-brand-subtitle">Laboratório Virtual de Hidrostática e Empuxo</div>
            </div>
          </div>
          <div className="rv-header-info">
            <div className="rv-header-info-line">
              <img src={iconCalendar} alt="" style={{ width: '13px', height: '13px' }} />
              <span>Data da Simulação: <strong>{dataText}</strong></span>
            </div>
            <div className="rv-header-info-line">
              <img src={iconDoc} alt="" style={{ width: '13px', height: '13px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span>Relatório gerado automaticamente</span>
                <span>pelo sistema <strong>EUREKA</strong></span>
              </div>
            </div>
          </div>
        </header>

        <main className="rv-content">
          {/* ═══════════ INFORMAÇÕES GERAIS ═══════════ */}
          <section className="rv-card rv-info-card">
            <div className="rv-section-title">INFORMAÇÕES GERAIS</div>
            <div className="rv-fields-grid">
              <div className="rv-field"><span>Instituição:</span><div className="rv-blank"></div></div>
              <div className="rv-field"><span>Disciplina:</span><div className="rv-blank"></div></div>
              <div className="rv-field"><span>Professor(a):</span><div className="rv-blank"></div></div>
            </div>
            <div className="rv-student-row">
              <div className="rv-field"><span>Aluno(a):</span><div className="rv-blank"></div></div>
              <div className="rv-field"><span>Data:</span><span className="rv-date-value">{dataApenas}</span></div>
            </div>
          </section>

          {/* ═══════════ 1. DESCRIÇÃO DO PROBLEMA ═══════════ */}
          <section className="rv-problem-section">
            <div className="rv-problem-title">1. DESCRIÇÃO DO PROBLEMA</div>
            <p className="rv-problem-text">
              {(() => {
                const dim = simulacao.dimensoes || {};
                const dim1 = dim['Aresta/Raio (cm)'] || dim['Aresta/Raio'] || dim['Base (m)'] || 0;
                const dim2 = dim['Comprimento (cm)'] || dim['Comprimento'] || dim['Altura (m)'] || 0;
                const formatMeters = (cm) => (Number(cm) / 100).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' m';
                
                if (dados.tipo === 'corpos-imersos') {
                  let desc;
                  if (dados.geometria === 'CUBE') desc = <span>Um bloco cúbico de aresta <strong>{formatMeters(dim1)}</strong></span>;
                  else if (dados.geometria === 'SPHERE') desc = <span>Uma esfera de raio <strong>{formatMeters(dim1)}</strong></span>;
                  else if (dados.geometria === 'CYLINDER') desc = <span>Um cilindro de raio <strong>{formatMeters(dim1)}</strong> e altura <strong>{formatMeters(dim2)}</strong></span>;
                  else if (dados.geometria === 'RECT' || dados.geometria === 'CUBOID') desc = <span>Um paralelepípedo de aresta da base <strong>{formatMeters(dim1)}</strong> e altura <strong>{formatMeters(dim2)}</strong></span>;
                  else desc = <span>Um bloco de aresta <strong>{formatMeters(dim1)}</strong></span>;

                  return (
                    <>{desc} e densidade de <strong>{dados.densidadeObjetoFmt}</strong> é colocado em um recipiente contendo um fluido de densidade <strong>{dados.densidadeFluidoFmt}</strong>. Considerando a aceleração da gravidade <strong>g = {dados.gravidade}</strong>, determine:</>
                  );
                }
                
                return <>{enunciado}</>;
              })()}
            </p>
          </section>

          {/* ═══════════ VIZ + DATA GRID ═══════════ */}
          <section className="rv-grid-2">
            <div className="rv-card rv-content-card">
              <div className="rv-card-title">VISUALIZAÇÃO DA SIMULAÇÃO</div>
              <div className="rv-sim-toolbar">
                <div className="rv-sim-btn rv-sim-btn-off">
                  <span className="rv-sim-btn-dot"></span>
                  3D OFF
                </div>
                <div className="rv-sim-btn rv-sim-btn-on">
                  <span className="rv-sim-btn-dot"></span>
                  VETORES
                </div>
              </div>
              <div className="rv-simulation-box">
                {imagemSimulacao ? (
                    <img src={imagemSimulacao} alt="Visualização" />
                ) : (
                    <span style={{ color: '#94a3b8' }}>[Sem Imagem]</span>
                )}
              </div>
            </div>

            <div className="rv-card rv-content-card">
              <div className="rv-card-title">DADOS DA SIMULAÇÃO</div>
              <div className="rv-data-list">
                <div className="rv-data-row"><span>Geometria do Objeto:</span><strong>{dados.geometriaNome}</strong></div>
                {dimsLimpas.map((d, i) => (
                    <div className="rv-data-row" key={i}><span>{d.label}:</span><strong>{d.value}</strong></div>
                ))}
                {dados.tipo === 'corpos-imersos' && (
                    <div className="rv-data-row"><span>Densidade do Objeto (ρ<sub style={{fontSize:'10px'}}>o</sub>):</span><strong>{dados.densidadeObjetoFmt}</strong></div>
                )}
                <div className="rv-data-row"><span>Densidade do Fluido (ρ<sub style={{fontSize:'10px'}}>f</sub>):</span><strong>{dados.densidadeFluidoFmt}</strong></div>
                <div className="rv-data-row"><span>Gravidade (g):</span><strong>{dados.gravidade}</strong></div>
                {dados.tipo === 'corpos-imersos' && alturaSubmersa && (
                    <div className="rv-data-row"><span>Altura Submersa (h):</span><strong>{alturaSubmersa}</strong></div>
                )}
                <div className="rv-data-row"><span>Volume Submerso:</span><strong>{dados.volumeDeslocadoFmt}</strong></div>
              </div>
            </div>
          </section>

          {/* ═══════════ FÓRMULAS + RESULTADOS ═══════════ */}
          <section className="rv-grid-2">
            <div className="rv-card rv-content-card">
              <div className="rv-card-title">2. FÓRMULAS UTILIZADAS</div>
              <div>
                <div className="rv-formula-row">
                  <div className="rv-formula-label">Peso (P):</div>
                  <div className="rv-formula">
                    <span className="v">P</span> = <span className="v">ρ</span><span className="s">o</span> · <span className="v">g</span> · <span className="v">V</span><span className="s">total</span>
                  </div>
                </div>
                <div className="rv-formula-row">
                  <div className="rv-formula-label">Empuxo (E):</div>
                  <div className="rv-formula">
                    <span className="v">E</span> = <span className="v">ρ</span><span className="s">f</span> · <span className="v">g</span> · <span className="v">V</span><span className="s">submerso</span>
                  </div>
                </div>
                <div className="rv-formula-row">
                  <div className="rv-formula-label">Peso Aparente (P<sub>ap</sub>):</div>
                  <div className="rv-formula">
                    <span className="v">P</span><span className="s">ap</span> = <span className="v">P</span> − <span className="v">E</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rv-card rv-content-card">
              <div className="rv-card-title">3. RESULTADOS OBTIDOS</div>
              <div className="rv-result-row rv-result-red">
                <span>Peso Real (P):</span>
                <span className="rv-val-red">{dados.pesoFmt}</span>
              </div>
              <div className="rv-result-row rv-result-green">
                <span>Empuxo (E):</span>
                <span className="rv-val-green">{dados.empuxoFmt}</span>
              </div>
              <div className="rv-result-row rv-result-blue">
                <span>Peso Aparente (P<sub>ap</sub>):</span>
                <span className="rv-val-blue">{dados.pesoAparenteFmt}</span>
              </div>
              <div className="rv-condition-row">
                <span>Condição:</span>
                <div>
                  <div className="rv-badge" style={{
                      background: statusLabel === "AFUNDA" ? '#f3e8ff' : statusLabel === "FLUTUA" ? '#dcfce7' : '#e0f2fe',
                      color: statusLabel === "AFUNDA" ? '#9333ea' : statusLabel === "FLUTUA" ? '#16a34a' : '#0284c7'
                  }}>{statusLabel}</div>
                  <div className="rv-cond-sub">{relCond}</div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════ 4. ANÁLISE QUALITATIVA ═══════════ */}
          <section className="rv-card rv-analysis-card">
            <div className="rv-card-title" style={{textAlign: 'left', borderBottom: 'none'}}>
              4. ANÁLISE QUALITATIVA
            </div>
            <div className="rv-analysis-text">
              {analiseQualitativa()}
            </div>
          </section>
        </main>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="rv-footer">
          <div className="rv-footer-title">
            <img src={iconWavesBlue} alt="" style={{ width: '22px', height: '22px' }} />
            <strong>EUREKA!</strong>
          </div>
          <div className="rv-footer-sub">Laboratório Virtual de Hidrostática e Empuxo</div>
        </footer>

      </div>
    </>
  );
};
