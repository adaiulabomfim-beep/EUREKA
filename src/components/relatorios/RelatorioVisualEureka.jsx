import React from 'react';
import { formatarDadosSimulacao, obterDimensoesLimpas } from '../../utils/exportacao/formatarDadosSimulacao';
import { montarEnunciado } from '../../utils/exportacao/montarEnunciado';

export const RelatorioVisualEureka = ({ simulacao, imagemSimulacao, dataText }) => {
  const dados = formatarDadosSimulacao(simulacao);
  const dimsLimpas = obterDimensoesLimpas(dados);
  const enunciado = montarEnunciado(dados);

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

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .rv-page { width: 794px; min-height: 1123px; margin: 0 auto; background: #f3f8ff; padding-bottom: 28px; font-family: "Inter", "Segoe UI", Arial, sans-serif; color: #17345f; }
        .rv-header { height: 122px; padding: 28px 34px; display: flex; justify-content: space-between; align-items: center; color: white; background: linear-gradient(120deg, #2563eb 0%, #1d8cf8 48%, #06b6d4 100%); border-bottom-left-radius: 14px; border-bottom-right-radius: 14px; }
        .rv-brand { display: flex; align-items: center; gap: 18px; }
        .rv-logo-box { width: 72px; height: 72px; border: 2px solid rgba(255,255,255,0.45); border-radius: 18px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.08); }
        .rv-wave-icon { font-size: 34px; line-height: 1; font-weight: 800; }
        .rv-brand-title { font-size: 42px; font-weight: 900; letter-spacing: 1px; color: #67e8f9; text-shadow: 0 3px 12px rgba(0,0,0,0.16); }
        .rv-brand-subtitle { margin-top: 6px; font-size: 15px; font-weight: 700; letter-spacing: 0.6px; color: white; }
        .rv-header-info { font-size: 13px; line-height: 1.8; text-align: left; max-width: 270px; font-weight: 500; }
        .rv-content { padding: 28px 34px 0; }
        .rv-card { background: white; border: 1px solid #dce9fb; border-radius: 14px; box-shadow: 0 5px 16px rgba(30, 80, 150, 0.09); }
        .rv-info-card { padding: 18px 20px; margin-bottom: 28px; }
        .rv-section-title { display: flex; align-items: center; gap: 10px; color: #0f4fd6; font-weight: 900; font-size: 17px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 14px; }
        .rv-topic-icon { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(135deg, #2563eb, #22c7e8); color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; box-shadow: 0 4px 10px rgba(37,99,235,0.28); flex-shrink: 0; }
        .rv-line { height: 1px; background: #dce9fb; margin-bottom: 17px; }
        .rv-fields-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 22px; font-size: 13px; color: #49658d; }
        .rv-field { display: flex; align-items: center; gap: 8px; }
        .rv-field span { white-space: nowrap; }
        .rv-blank { border-bottom: 1.5px solid #b7cbed; flex: 1; height: 18px; }
        .rv-student-row { margin-top: 18px; display: grid; grid-template-columns: 2fr 1fr; gap: 22px; font-size: 13px; color: #49658d; }
        .rv-problem-title { font-size: 21px; font-weight: 900; color: #0f4fd6; margin-bottom: 14px; }
        .rv-problem-text { font-size: 15px; line-height: 1.65; margin-bottom: 26px; color: #17345f; }
        .rv-problem-text strong { font-weight: 900; }
        .rv-grid-2 { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 20px; margin-bottom: 20px; }
        .rv-content-card { padding: 16px; }
        .rv-card-title { display: flex; align-items: center; gap: 11px; color: #0f4fd6; font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 13px; border-bottom: 1px solid #dce9fb; margin-bottom: 14px; }
        .rv-simulation-box { height: 275px; border: 1px solid #e1ecfb; border-radius: 12px; background: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .rv-simulation-box img { width: 100%; height: 100%; object-fit: contain; }
        .rv-data-list { display: flex; flex-direction: column; gap: 7px; }
        .rv-data-row { min-height: 37px; padding: 9px 12px; border-radius: 9px; border: 1px solid #dce9fb; background: linear-gradient(90deg, #ffffff, #f8fbff); display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #526b93; }
        .rv-data-row strong { color: #17345f; font-weight: 900; text-align: right; }
        .rv-formula-row { min-height: 54px; padding: 12px 14px; border-radius: 10px; background: linear-gradient(90deg, #ffffff, #f8fbff); display: grid; grid-template-columns: 120px 1fr; align-items: center; margin-bottom: 8px; font-size: 13px; }
        .rv-formula-label { color: #0f4fd6; font-weight: 800; }
        .rv-formula { text-align: center; font-size: 20px; font-family: "Times New Roman", serif; color: #102440; font-style: italic; }
        .rv-result-row { min-height: 48px; padding: 12px 14px; margin-bottom: 9px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; border-left: 5px solid transparent; }
        .rv-result-red { background: #fff7f7; border-left-color: #ef4444; }
        .rv-result-green { background: #f2fff8; border-left-color: #10b981; }
        .rv-result-blue { background: #f3f8ff; border-left-color: #2563eb; }
        .rv-value-red { color: #ef4444; font-weight: 900; }
        .rv-value-green { color: #059669; font-weight: 900; }
        .rv-value-blue { color: #2563eb; font-weight: 900; }
        .rv-condition-row { background: #fbf6ff; border-radius: 10px; min-height: 46px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
        .rv-badge { padding: 5px 26px; border-radius: 999px; background: #eadcff; color: #7c3aed; font-size: 15px; font-weight: 900; text-align: center; }
        .rv-analysis-card { padding: 16px; margin-top: 18px; }
        .rv-analysis-text { padding-top: 12px; border-top: 1px solid #dce9fb; font-size: 15px; line-height: 1.55; color: #17345f; }
        .rv-analysis-text strong { color: #7c3aed; font-weight: 900; }
        .rv-footer { margin-top: 26px; height: 70px; background: linear-gradient(180deg, #d9efff, #eef8ff); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #0f4fd6; }
        .rv-footer-title { font-size: 26px; font-weight: 900; color: #0f8ee8; }
        .rv-footer-subtitle { font-size: 12px; color: #49658d; margin-top: 3px; }
      `}</style>
      <div id="relatorio-eureka" className="rv-page">
        <header className="rv-header">
          <div className="rv-brand">
            <div className="rv-logo-box">
              <div className="rv-wave-icon">≋</div>
            </div>
            <div>
              <div className="rv-brand-title">EUREKA!</div>
              <div className="rv-brand-subtitle">Laboratório Virtual de Hidrostática e Empuxo</div>
            </div>
          </div>
          <div className="rv-header-info">
            📅 &nbsp; Data da Simulação: <strong>{dataText}</strong><br />
            📄 &nbsp; Relatório gerado automaticamente<br />
            pelo sistema <strong>EUREKA</strong>
          </div>
        </header>

        <main className="rv-content">
          <section className="rv-card rv-info-card">
            <div className="rv-section-title">
              <span className="rv-topic-icon">♙</span>
              INFORMAÇÕES GERAIS
            </div>
            <div className="rv-line"></div>
            <div className="rv-fields-grid">
              <div className="rv-field"><span>Instituição:</span><div className="rv-blank"></div></div>
              <div className="rv-field"><span>Disciplina:</span><div className="rv-blank"></div></div>
              <div className="rv-field"><span>Professor(a):</span><div className="rv-blank"></div></div>
            </div>
            <div className="rv-student-row">
              <div className="rv-field"><span>Aluno(a):</span><div className="rv-blank"></div></div>
              <div className="rv-field"><span>Data:</span><strong>{dataText}</strong><div className="rv-blank"></div></div>
            </div>
          </section>

          <section>
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

          <section className="rv-grid-2">
            <div className="rv-card rv-content-card">
              <div className="rv-card-title">
                <span className="rv-topic-icon">≋</span>
                VISUALIZAÇÃO DA SIMULAÇÃO
              </div>
              <div className="rv-simulation-box">
                {imagemSimulacao ? (
                    <img src={imagemSimulacao} alt="Visualização" />
                ) : (
                    <span>[Sem Imagem]</span>
                )}
              </div>
            </div>

            <div className="rv-card rv-content-card">
              <div className="rv-card-title">
                <span className="rv-topic-icon">≋</span>
                DADOS DA SIMULAÇÃO
              </div>
              <div className="rv-data-list">
                <div className="rv-data-row"><span>Geometria do Objeto:</span><strong>{dados.geometriaNome}</strong></div>
                {dimsLimpas.map((d, i) => (
                    <div className="rv-data-row" key={i}><span>{d.label}:</span><strong>{d.value}</strong></div>
                ))}
                {dados.tipo === 'corpos-imersos' && (
                    <div className="rv-data-row"><span>Densidade do Objeto:</span><strong>{dados.densidadeObjetoFmt}</strong></div>
                )}
                <div className="rv-data-row"><span>Densidade do Fluido:</span><strong>{dados.densidadeFluidoFmt}</strong></div>
                <div className="rv-data-row"><span>Gravidade:</span><strong>{dados.gravidade}</strong></div>
                <div className="rv-data-row"><span>Volume Submerso:</span><strong>{dados.volumeDeslocadoFmt}</strong></div>
              </div>
            </div>
          </section>

          <section className="rv-grid-2">
            <div className="rv-card rv-content-card">
              <div className="rv-card-title">
                <span className="rv-topic-icon">≋</span>
                2. FÓRMULAS UTILIZADAS
              </div>
              <div className="rv-formula-row">
                <div className="rv-formula-label">Peso (P):</div>
                <div className="rv-formula">P = rho_objeto · g · V_total</div>
              </div>
              <div className="rv-formula-row">
                <div className="rv-formula-label">Empuxo (E):</div>
                <div className="rv-formula">E = rho_fluido · g · V_submerso</div>
              </div>
              <div className="rv-formula-row">
                <div className="rv-formula-label">Peso Aparente:</div>
                <div className="rv-formula">Pap = P − E</div>
              </div>
            </div>

            <div className="rv-card rv-content-card">
              <div className="rv-card-title">
                <span className="rv-topic-icon">≋</span>
                3. RESULTADOS OBTIDOS
              </div>
              <div className="rv-result-row rv-result-red">
                <span>Peso Real (P):</span>
                <span className="rv-value-red">{dados.pesoFmt}</span>
              </div>
              <div className="rv-result-row rv-result-green">
                <span>Empuxo (E):</span>
                <span className="rv-value-green">{dados.empuxoFmt}</span>
              </div>
              <div className="rv-result-row rv-result-blue">
                <span>Peso Aparente (Pap):</span>
                <span className="rv-value-blue">{dados.pesoAparenteFmt}</span>
              </div>
              <div className="rv-condition-row">
                <span>Condição:</span>
                <div>
                  <div className="rv-badge" style={{
                      background: statusLabel === "AFUNDA" ? '#eadcff' : statusLabel === "FLUTUA" ? '#dcfce7' : '#e0f2fe',
                      color: statusLabel === "AFUNDA" ? '#7c3aed' : statusLabel === "FLUTUA" ? '#16a34a' : '#0369a1'
                  }}>{statusLabel}</div>
                  <div style={{ textAlign: "center", marginTop: "4px", fontSize: "12px", color: "#49658d" }}>
                    {relCond}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rv-card rv-analysis-card">
            <div className="rv-card-title">
              <span className="rv-topic-icon">≋</span>
              4. ANÁLISE QUALITATIVA
            </div>
            <div className="rv-analysis-text">
              {analiseQualitativa()}
            </div>
          </section>
        </main>

        <footer className="rv-footer">
          <div className="rv-footer-title">≋ EUREKA!</div>
          <div className="rv-footer-subtitle">Laboratório Virtual de Hidrostática e Empuxo</div>
        </footer>
      </div>
    </>
  );
};
