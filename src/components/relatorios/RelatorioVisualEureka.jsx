import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  Cuboid,
  ListChecks,
  Zap,
  BarChart3,
  ShieldCheck,
  Calculator,
  BookOpen,
} from 'lucide-react';

import { formatarDadosSimulacao } from '../../utils/exportacao/formatarDadosSimulacao';
import { montarEnunciado } from '../../utils/exportacao/montarEnunciado';
import {
  SectionTitle,
  Card,
  DataRow,
  ReportHeader,
  InfoGeralCard,
  ReportFooter,
  SimulationImageBox,
  buildSimulationDataRows,
  parseNumero,
  formatarVolume,
  calcularAlturaSubmersaTexto,
  calcularVolumeSubmersoTexto,
  renderDescricaoProblema,
} from './ReportShared';

const texNum = (valor) => String(valor ?? '').replace(/(\d),(\d)/g, '$1{,}$2');

const MathTex = ({ tex, display = false, className = '' }) => {
  const html = React.useMemo(
    () =>
      katex.renderToString(String(tex || ''), {
        displayMode: display,
        output: 'html',
        throwOnError: false,
        strict: 'ignore',
      }),
    [tex, display]
  );

  return (
    <span
      className={`eureka-math ${
        display ? 'eureka-math-display flex max-w-full justify-center' : 'eureka-math-inline inline align-baseline'
      } ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

const FormulaRow = ({ label, children }) => (
  <div className="flex min-h-[46px] items-center gap-[8px] rounded-[8px] bg-[#f8fbff] px-[12px] py-[4px]">
    <span className="w-[122px] shrink-0 text-[10.5px] font-black leading-[1.25] text-[#2472ff]">
      {label}
    </span>

    <div className="flex flex-1 items-center justify-center text-[13px] text-[#1f3557]">
      {children}
    </div>
  </div>
);

const ResultRow = ({ label, value, tone }) => {
  const tones = {
    red: {
      bg: 'bg-[#fffafa]',
      border: 'border-[#ff3b30]',
      text: 'text-[#ff3b30]',
    },
    green: {
      bg: 'bg-[#f8fffb]',
      border: 'border-[#1fc896]',
      text: 'text-[#1eae82]',
    },
    blue: {
      bg: 'bg-[#f8fbff]',
      border: 'border-[#2676ff]',
      text: 'text-[#2676ff]',
    },
  };

  const t = tones[tone] || tones.blue;

  return (
    <div
      className={`flex min-h-[32px] items-center justify-between gap-[8px] rounded-[8px] border-l-[4px] px-[11px] py-[4px] ${t.border} ${t.bg}`}
    >
      <span className="text-[10.5px] font-medium leading-[1.3] text-[#6d82a7]">
        {label}
      </span>

      <span className={`shrink-0 text-right text-[11.5px] font-black leading-[1.3] tracking-[0.2px] ${t.text}`}>
        {value}
      </span>
    </div>
  );
};

const StabilityVerificationRow = ({
  label,
  fsValue,
  hasValue,
  minCriterion = 1.5,
  criterionTex = 'FS \\ge 1{,}50',
}) => {
  const approved = hasValue && Number.isFinite(fsValue) && fsValue >= minCriterion;
  const maxScale = minCriterion * 2; // Escala linear [0, 3,00] posiciona o critério 1,50 exatamente em 50%
  const fillPct = hasValue && Number.isFinite(fsValue)
    ? Math.max(0, Math.min(100, (fsValue / maxScale) * 100))
    : 0;
  const thresholdPct = (minCriterion / maxScale) * 100;

  const accentBorder = !hasValue
    ? 'border-[#cbd5e1] border-l-[#94a3b8]'
    : approved
      ? 'border-[#d3f3e6] border-l-[#1fc896]'
      : 'border-[#ffd8d6] border-l-[#ff3b30]';

  const valueColor = !hasValue
    ? 'text-[#64748b]'
    : approved
      ? 'text-[#15803d]'
      : 'text-[#dc2626]';

  const statusClasses = !hasValue
    ? 'bg-[#f1f5f9] text-[#64748b]'
    : approved
      ? 'bg-[#dcfce7] text-[#15803d]'
      : 'bg-[#fee2e2] text-[#dc2626]';

  const statusText = !hasValue ? 'Pendente' : approved ? 'Aprovado' : 'Não aprovado';

  return (
    <div
      className={`rounded-[7px] border border-l-[3.5px] bg-white px-[8px] py-[5px] ${accentBorder}`}
    >
      <div className="flex items-center justify-between gap-[6px]">
        <span className="min-w-0 text-[9.3px] font-bold leading-[1.2] text-[#23477f]">
          {label}
        </span>

        <div className="flex shrink-0 items-center gap-[5px]">
          <span className={`text-[11.5px] font-black leading-none tabular-nums ${valueColor}`}>
            {hasValue ? <MathTex tex={texNum(fmtBr(fsValue))} /> : '-'}
          </span>
          <span
            className={`rounded-[4px] px-[5px] py-[2px] text-[7.8px] font-black uppercase leading-none tracking-[0.3px] whitespace-nowrap ${statusClasses}`}
          >
            {statusText}
          </span>
        </div>
      </div>

      <div className="mt-[4px] flex items-center justify-between gap-[8px]">
        <span className="text-[8.6px] font-medium leading-none text-[#5b759b]">
          Critério: <strong className="font-bold text-[#355079]"><MathTex tex={criterionTex} /></strong>
        </span>

        <div
          className="relative h-[5px] w-[104px] shrink-0 rounded-full bg-[#e2e8f0]"
          aria-hidden="true"
        >
          {hasValue && (
            <div
              className="h-full rounded-full"
              style={{
                width: `${fillPct}%`,
                backgroundColor: approved ? '#1fc896' : '#ff3b30',
              }}
            />
          )}
          <div
            className="absolute -top-[1.5px] h-[8px] w-[1.5px] -translate-x-1/2 rounded-full bg-[#334155]"
            style={{ left: `${thresholdPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const CompactDataTile = ({ label, value }) => (
  <div className="flex min-w-0 flex-col justify-center rounded-[7px] border border-[#dce8f6] bg-[#fbfdff] px-[9px] py-[5px]">
    <span className="text-[9.5px] font-medium leading-[1.25] text-[#6d82a7]">
      {label}
    </span>
    <span className="mt-[2px] text-[11px] font-black leading-[1.25] text-[#2f4468]">
      {value}
    </span>
  </div>
);

const MemorialStepBlock = ({ step, isLast, measureId }) => {
  const toneStyles = {
    blue: 'border-[#2676ff] bg-[#f4f8ff] text-[#1755c8]',
    green: 'border-[#1fc896] bg-[#f2fff9] text-[#118660]',
    amber: 'border-[#f59e0b] bg-[#fffaf0] text-[#b45309]',
    red: 'border-[#ff3b30] bg-[#fff5f5] text-[#c92a2a]',
    cyan: 'border-[#0891b2] bg-[#f0fbff] text-[#0e7490]',
    slate: 'border-[#64748b] bg-[#f8fafc] text-[#334155]',
  };

  const resultBoxClass = toneStyles[step.tone] || toneStyles.blue;

  return (
    <article
      data-measure-id={measureId}
      className={`py-[7px] ${!isLast ? 'border-b border-[#e3edf9]' : ''}`}
    >
      <div className="flex items-center gap-[8px]">
        <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[5px] bg-[#1f6fff] text-[10px] font-black text-white">
          {step.number}
        </span>
        <h4 className="m-0 text-[11.5px] font-black uppercase tracking-[0.3px] text-[#1e3e72]">
          {step.title}
        </h4>
      </div>

      <div className="mt-[5px] flex items-center justify-center rounded-[7px] border border-[#e3eefb] bg-[#f7fbff] px-[12px] py-[4.5px] text-center text-[12px] text-[#1f3557]">
        {step.equation}
      </div>

      <div className="mt-[5px] space-y-[2px] px-[2px] text-[10px] leading-[1.4] text-[#435d85]">
        {step.variables && (
          <p className="m-0">
            <strong className="font-bold text-[#2b4875]">Variáveis:</strong>{' '}
            {step.variables}
          </p>
        )}
        {step.substitution && (
          <p className="m-0">
            <strong className="font-bold text-[#2b4875]">Substituição e desenvolvimento:</strong>{' '}
            {step.substitution}
          </p>
        )}
      </div>

      <div className="mt-[5px] flex flex-wrap items-center justify-between gap-[10px]">
        <div
          className={`inline-flex items-center rounded-[7px] border-l-[3.5px] px-[10px] py-[4px] text-[10.8px] font-black ${resultBoxClass}`}
        >
          {step.result}
        </div>
        {step.note && (
          <span className="flex-1 text-right text-[9.4px] font-medium italic leading-[1.32] text-[#5e779c]">
            {step.note}
          </span>
        )}
      </div>
    </article>
  );
};

const TheoryConceptCard = ({ concept, measureId }) => (
  <article
    data-measure-id={measureId}
    className="flex flex-col rounded-[11px] border border-[#dce8f6] bg-white px-[15px] py-[8px] shadow-[0_2px_8px_rgba(35,71,127,0.06)]"
  >
    <div className="flex items-center gap-[8px] border-b border-[#eaf1fa] pb-[4px]">
      <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[5px] bg-[#eef4ff] text-[10px] font-black text-[#1f6fff]">
        {concept.number}
      </span>
      <h4 className="m-0 text-[11.4px] font-black uppercase tracking-[0.3px] text-[#1e3e72]">
        {concept.title}
      </h4>
    </div>

    <p className="m-0 mt-[5px] text-[10px] font-medium leading-[1.38] text-[#3f5980]">
      {concept.explanation}
    </p>

    {concept.equation && (
      <div className="mt-[5px] flex items-center justify-center rounded-[7px] border border-[#e3eefb] bg-[#f7fbff] px-[12px] py-[4.5px] text-center text-[11.6px] text-[#1b365d]">
        {concept.equation}
      </div>
    )}

    <div className="mt-[5px] space-y-[2.5px] text-[9.6px] leading-[1.38] text-[#435d85]">
      {concept.variables && (
        <p className="m-0">
          <strong className="font-bold text-[#244a82]">Significado das variáveis:</strong>{' '}
          {concept.variables}
        </p>
      )}
      {concept.application && (
        <p className="m-0 rounded-[6px] bg-[#f8fbff] px-[9px] py-[3.5px] text-[#355079]">
          <strong className="font-bold text-[#1057cc]">Aplicação ao problema simulado:</strong>{' '}
          {concept.application}
        </p>
      )}
    </div>
  </article>
);

const fmtBr = (valor, min = 2, max = 2) =>
  Number(valor || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });

const paginarConteudoContinuo = ({
  memorialSteps,
  theoryConcepts,
  measuredHeights = {},
  pageBudget = 932,
}) => {
  const hMemHeader = measuredHeights['header-memorial'] ?? 46;
  const hMemCardChrome = 10;
  const hUnanalyzed = measuredHeights['memorial-unanalyzed'] ?? 108;
  const hTheoryHeader = measuredHeights['header-theory'] ?? 44;
  const hTheoryGapBefore = 10;
  const hTheoryCardGap = 8;

  const pages = [];
  let page = { memorial: null, theory: null };
  let used = 0;
  let memorialStarted = false;
  let theoryStarted = false;

  const commitPage = () => {
    if (page.memorial || page.theory) {
      pages.push(page);
    }
    page = { memorial: null, theory: null };
    used = 0;
  };

  if (memorialSteps === null) {
    page.memorial = {
      isContinuation: false,
      steps: [],
      showUnanalyzedNotice: true,
    };
    used += hMemHeader + hUnanalyzed;
    memorialStarted = true;
  } else if (Array.isArray(memorialSteps)) {
    memorialSteps.forEach((step) => {
      const id = `memorial-step-${step.number}`;
      const fallbackH = Math.round((step.estimatedHeight || 165) * 0.8);
      const stepH = measuredHeights[id] ?? fallbackH;

      if (!page.memorial) {
        const openCost = hMemHeader + hMemCardChrome + stepH;
        if (used > 0 && used + openCost > pageBudget) {
          commitPage();
        }
        page.memorial = {
          isContinuation: memorialStarted,
          steps: [step],
          showUnanalyzedNotice: false,
        };
        used += hMemHeader + hMemCardChrome + stepH;
        memorialStarted = true;
      } else if (used + stepH > pageBudget) {
        commitPage();
        page.memorial = {
          isContinuation: true,
          steps: [step],
          showUnanalyzedNotice: false,
        };
        used += hMemHeader + hMemCardChrome + stepH;
      } else {
        page.memorial.steps.push(step);
        used += stepH;
      }
    });
  }

  if (Array.isArray(theoryConcepts)) {
    theoryConcepts.forEach((concept) => {
      const id = `theory-card-${concept.number}`;
      const fallbackH = Math.round((concept.estimatedHeight || 190) * 0.86);
      const cardH = measuredHeights[id] ?? fallbackH;

      if (!page.theory) {
        const gapBefore = page.memorial ? hTheoryGapBefore : 0;
        const openCost = gapBefore + hTheoryHeader + cardH;

        if ((page.memorial || used > 0) && used + openCost > pageBudget) {
          commitPage();
        }

        const appliedGap = page.memorial ? hTheoryGapBefore : 0;
        page.theory = {
          isContinuation: theoryStarted,
          concepts: [concept],
        };
        used += appliedGap + hTheoryHeader + cardH;
        theoryStarted = true;
      } else {
        const needed = hTheoryCardGap + cardH;
        if (used + needed > pageBudget) {
          commitPage();
          page.theory = {
            isContinuation: true,
            concepts: [concept],
          };
          used += hTheoryHeader + cardH;
        } else {
          page.theory.concepts.push(concept);
          used += needed;
        }
      }
    });
  }

  if (page.memorial || page.theory) {
    pages.push(page);
  }

  // Evita deixar um único cartão teórico isolado na última página
  if (pages.length >= 2) {
    const lastPage = pages[pages.length - 1];
    const prevPage = pages[pages.length - 2];
    if (
      !lastPage.memorial &&
      lastPage.theory &&
      lastPage.theory.concepts.length === 1 &&
      prevPage.theory &&
      prevPage.theory.concepts.length >= 3
    ) {
      const movedConcept = prevPage.theory.concepts.pop();
      lastPage.theory.concepts.unshift(movedConcept);
    }
  }

  return pages;
};

const signatureOfPages = (pages) =>
  pages
    .map((p) => {
      const m = p.memorial
        ? p.memorial.showUnanalyzedNotice
          ? 'M:N'
          : `M:${p.memorial.steps.map((s) => s.number).join(',')}`
        : '';
      const t = p.theory ? `T:${p.theory.concepts.map((c) => c.number).join(',')}` : '';
      return `${m}|${t}`;
    })
    .join('/');

const formatarUnidadeTexto = (valor) => {
  const txt = String(valor ?? '');
  if (!txt) return txt;
  const parts = txt.split(/(kg\/m³|N\/m³|kgf\/m³|kgf\/m²|m\/s²|m³|m²|m⁴)/g);
  if (parts.length === 1) return txt;
  return (
    <>
      {parts.map((part, idx) => {
        if (part === 'kg/m³') return <MathTex key={idx} tex="\text{kg/m}^3" />;
        if (part === 'N/m³') return <MathTex key={idx} tex="\text{N/m}^3" />;
        if (part === 'kgf/m³') return <MathTex key={idx} tex="\text{kgf/m}^3" />;
        if (part === 'kgf/m²') return <MathTex key={idx} tex="\text{kgf/m}^2" />;
        if (part === 'm/s²') return <MathTex key={idx} tex="\text{m/s}^2" />;
        if (part === 'm³') return <MathTex key={idx} tex="\text{m}^3" />;
        if (part === 'm²') return <MathTex key={idx} tex="\text{m}^2" />;
        if (part === 'm⁴') return <MathTex key={idx} tex="\text{m}^4" />;
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
};

const extractReactText = (node) => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractReactText).join('');
  if (React.isValidElement(node)) return extractReactText(node.props?.children);
  return '';
};

const renderDataRowLabelEureka = (label, idx) => {
  if (typeof label === 'string') {
    if (label.includes('(g):')) {
      return <>Aceleração da gravidade (<MathTex tex="g" />):</>;
    }
    if (label.includes('(h):')) {
      return <>Altura submersa (<MathTex tex="h" />):</>;
    }
    return label;
  }
  if (idx > 0 && React.isValidElement(label)) {
    const str = extractReactText(label).toLowerCase();
    if (str.includes('densidade do objeto')) {
      return <>Densidade do objeto (<MathTex tex="\rho_o" />):</>;
    }
    if (str.includes('densidade do fluido')) {
      return <>Densidade do fluido (<MathTex tex="\rho_f" />):</>;
    }
  }
  return label;
};

export const RelatorioVisualEureka = ({
  simulacao,
  imagemSimulacao,
  dataText,
}) => {
  const dados = formatarDadosSimulacao(simulacao);
  const enunciado = montarEnunciado(dados);

  let statusLabel = 'EQUILÍBRIO';
  let relCondTex = 'P = E';

  if (
    dados.statusFisico?.includes('AFUNDAR') ||
    dados.statusFisico?.includes('AFUNDA')
  ) {
    statusLabel = 'AFUNDA';
    relCondTex = 'P > E';
  } else if (
    dados.statusFisico?.includes('FLUTUAR') ||
    dados.statusFisico?.includes('FLUTUA')
  ) {
    statusLabel = 'FLUTUA';
    relCondTex = 'P = E';
  }

  const statusColor = {
    AFUNDA: {
      bg: '#f3e8ff',
      color: '#8b3bea',
    },
    FLUTUA: {
      bg: '#dcfce7',
      color: '#16a34a',
    },
    EQUILÍBRIO: {
      bg: '#e0f2fe',
      color: '#0284c7',
    },
  }[statusLabel];

  const alturaSubmersa = calcularAlturaSubmersaTexto(simulacao, dados);
  const volumeSubmersoCorrigido = calcularVolumeSubmersoTexto(simulacao, dados);
  const dataRows = buildSimulationDataRows(dados, {
    includeCalculated: true,
    alturaSubmersa,
    volumeSubmerso: volumeSubmersoCorrigido,
  });

  const useTwoColumnDataGrid = dataRows.length > 7;

  const rhoOGlobal = parseNumero(simulacao.densidadeEquivalente ?? simulacao.densidadeObjeto) || 0;
  const rhoFGlobal = parseNumero(dados.densidadeFluido) || 0;
  const pesoNGlobal = Number(simulacao.peso || 0);
  const empuxoNGlobal = Number(simulacao.empuxo || 0);
  const volSubNumGlobal = parseNumero(volumeSubmersoCorrigido) || 0;
  const hSubNumGlobal = parseNumero(alturaSubmersa) || 0;

  const analiseQualitativa = () => {
    if (dados.tipo === 'comportas') {
      if (!dados.analyzedResults || !dados.analyzedResults.forceData?.up) {
        return (
          <span>
            Análise qualitativa completa disponível após executar o botão{' '}
            <strong className="font-black text-[#2563eb]">ANALISAR</strong> no laboratório de Comportas.
          </span>
        );
      }
      const fd = dados.analyzedResults.forceData;
      const eq = dados.analyzedResults.equilibrium;
      const hCg = fd.up.h_cg ?? 0;
      const hCp = fd.up.h_cp ?? hCg;
      const hasTie = eq && Math.abs(eq.F_tie || 0) > 1e-6;
      return (
        <span>
          A força hidrostática resultante (<MathTex tex={`F_R = ${texNum(fmtBr(Math.abs(fd.FR_net || 0) / 1000))}\\text{ kN}`} />) atua no{' '}
          <strong className="font-black text-[#2563eb]">centro de pressão</strong> (<MathTex tex={`h_{\\text{cp}} = ${texNum(fmtBr(hCp))}\\text{ m}`} />), situado abaixo do centro de gravidade da área molhada (<MathTex tex={`h_{\\text{cg}} = ${texNum(fmtBr(hCg))}\\text{ m}`} />) devido ao acréscimo linear da pressão com a profundidade.
          {hasTie && (
            <>
              {' '}O equilíbrio estático exige força mínima no tirante de{' '}
              <MathTex tex={`F_{\\text{tirante}} = ${texNum(fmtBr(Math.abs(eq.F_tie) / 1000))}\\text{ kN}`} />.
            </>
          )}
        </span>
      );
    }

    if (dados.tipo === 'barragens') {
      if (!dados.analyzedResults || !dados.analyzedResults.stabilityData || !dados.analyzedResults.forceData) {
        return (
          <span>
            Análise qualitativa completa disponível após executar o botão{' '}
            <strong className="font-black text-[#2563eb]">ANALISAR</strong> no laboratório de Barragens.
          </span>
        );
      }
      const st = dados.analyzedResults.stabilityData;
      const fd = dados.analyzedResults.forceData;
      const ni = dados.analyzedResults.normalizedInputs || {};
      const isDamKgf = ni.unitSystem === 'TECNICO_KGF';
      const damG = ni.gravity || 9.81;
      const fmtDamF = (valN) => (isDamKgf ? fmtBr(valN / damG, 1, 1) : fmtBr(valN / 1000, 2, 2));
      const unitDamFTex = isDamKgf ? '\\text{kgf/m}' : '\\text{kN/m}';

      if (st.isArchDam) {
        return (
          <span>
            Em barragens em arco, a estabilidade decorre da{' '}
            <strong className="font-black text-[#2563eb]">transmissão de esforços em arco às ombreiras</strong>{' '}
            (<MathTex tex={`N_{\\text{arco}} = ${texNum(fmtDamF(st.archThrust || 0))}\\;${unitDamFTex}`} /> e{' '}
            <MathTex tex={`\\sigma_{\\text{arco}} = ${texNum(fmtBr((st.archStressBase || 0) / 1e6))}\\text{ MPa}`} />).
          </span>
        );
      }
      const slideSafe = st.fs_desl >= 1.5;
      const overSafe = st.fs_tomb >= 1.5;
      return (
        <span>
          Sob empuxo horizontal líquido <MathTex tex={`F_{H,\\text{líq}} = ${texNum(fmtDamF(Math.abs(fd.FH_net || 0)))}\\;${unitDamFTex}`} /> (em <MathTex tex={`y_{\\text{cp}} = ${texNum(fmtBr(fd.y_cp_net))}\\text{ m}`} />) e peso próprio <MathTex tex={`W = ${texNum(fmtDamF(st.weight))}\\;${unitDamFTex}`} />, a estrutura apresenta-se{' '}
          {slideSafe && overSafe ? (
            <strong className="font-black text-[#16a34a]">ESTÁVEL</strong>
          ) : (
            <strong className="font-black text-[#ff3b30]">INSTÁVEL</strong>
          )}{' '}
          (<MathTex tex={`FS_{\\text{desl}} = ${texNum(fmtBr(st.fs_desl))}`} /> e <MathTex tex={`FS_{\\text{tomb}} = ${texNum(fmtBr(st.fs_tomb))}`} /> frente ao critério <MathTex tex="FS \ge 1{,}50" />).
        </span>
      );
    }

    if (statusLabel === 'AFUNDA') {
      return (
        <span>
          Como a densidade do corpo (<MathTex tex={`\\rho_o = ${texNum(fmtBr(rhoOGlobal, 0, 0))}\\text{ kg/m}^3`} />) supera a do fluido (<MathTex tex={`\\rho_f = ${texNum(fmtBr(rhoFGlobal, 0, 0))}\\text{ kg/m}^3`} />), o peso real (<MathTex tex={`P = ${texNum(fmtBr(pesoNGlobal))}\\text{ N}`} />) excede o empuxo máximo (<MathTex tex={`E = ${texNum(fmtBr(empuxoNGlobal))}\\text{ N}`} />), levando o objeto a{' '}
          <strong className="mx-[2px] font-black text-[#7c3aed]">AFUNDAR</strong> com volume deslocado <MathTex tex={`V_{\\text{sub}} = ${texNum(fmtBr(volSubNumGlobal, 4, 4))}\\text{ m}^3`} />.
        </span>
      );
    }

    if (statusLabel === 'FLUTUA') {
      return (
        <span>
          Como <MathTex tex={`\\rho_o = ${texNum(fmtBr(rhoOGlobal, 0, 0))}\\text{ kg/m}^3 < \\rho_f = ${texNum(fmtBr(rhoFGlobal, 0, 0))}\\text{ kg/m}^3`} />, o corpo tende a{' '}
          <strong className="mx-[2px] font-black text-[#16a34a]">FLUTUAR</strong> em equilíbrio (<MathTex tex={`P = E = ${texNum(fmtBr(pesoNGlobal))}\\text{ N}`} />), com calado <MathTex tex={`h_{\\text{sub}} = ${texNum(fmtBr(hSubNumGlobal))}\\text{ m}`} /> e <MathTex tex={`V_{\\text{sub}} = ${texNum(fmtBr(volSubNumGlobal, 4, 4))}\\text{ m}^3`} />.
        </span>
      );
    }

    return (
      <span>
        O peso e o empuxo igualam-se integralmente (<MathTex tex={`P = E = ${texNum(fmtBr(empuxoNGlobal))}\\text{ N}`} />), mantendo o corpo em{' '}
        <strong className="mx-[2px] font-black text-[#2563eb]">EQUILÍBRIO</strong> totalmente submerso com <MathTex tex={`V_{\\text{sub}} = ${texNum(fmtBr(volSubNumGlobal, 4, 4))}\\text{ m}^3`} />.
      </span>
    );
  };

  const buildMemorialSteps = () => {
    if (dados.tipo === 'corpos-imersos') {
      const dim = simulacao.dimensoes || {};
      const dim1Cm = Number(dim['Aresta/Raio (cm)'] || dim['Aresta/Raio'] || 0);
      const dim2Cm = Number(dim['Comprimento (cm)'] || dim['Comprimento'] || 0);
      const d1 = dim1Cm / 100;
      const d2 = dim2Cm / 100;
      let vTotal = 0;
      let geomEqTex = 'V_{\\text{total}} = a^3';
      let geomVars = (
        <>aresta <MathTex tex={`a = ${texNum(fmtBr(d1))}\\text{ m}`} /></>
      );
      let geomSub = (
        <MathTex tex={`V_{\\text{total}} = (${texNum(fmtBr(d1))})^3 = ${texNum(fmtBr(Math.pow(d1, 3), 4, 4))}\\text{ m}^3`} />
      );

      if (dados.geometria === 'CUBE') {
        vTotal = Math.pow(d1, 3);
        geomEqTex = 'V_{\\text{total}} = a^3';
        geomVars = <>aresta <MathTex tex={`a = ${texNum(fmtBr(d1))}\\text{ m}`} /></>;
        geomSub = <MathTex tex={`V_{\\text{total}} = (${texNum(fmtBr(d1))})^3 = ${texNum(fmtBr(vTotal, 4, 4))}\\text{ m}^3`} />;
      } else if (dados.geometria === 'SPHERE') {
        vTotal = (4 / 3) * Math.PI * Math.pow(d1, 3);
        geomEqTex = 'V_{\\text{total}} = \\frac{4}{3} \\cdot \\pi \\cdot R^3';
        geomVars = <>raio <MathTex tex={`R = ${texNum(fmtBr(d1))}\\text{ m}`} /></>;
        geomSub = <MathTex tex={`V_{\\text{total}} = \\frac{4}{3} \\cdot \\pi \\cdot (${texNum(fmtBr(d1))})^3 = ${texNum(fmtBr(vTotal, 4, 4))}\\text{ m}^3`} />;
      } else if (dados.geometria === 'CYLINDER') {
        vTotal = Math.PI * Math.pow(d1, 2) * d2;
        geomEqTex = 'V_{\\text{total}} = \\pi \\cdot R^2 \\cdot H';
        geomVars = <>raio <MathTex tex={`R = ${texNum(fmtBr(d1))}\\text{ m}`} />; altura <MathTex tex={`H = ${texNum(fmtBr(d2))}\\text{ m}`} /></>;
        geomSub = <MathTex tex={`V_{\\text{total}} = \\pi \\cdot (${texNum(fmtBr(d1))})^2 \\cdot (${texNum(fmtBr(d2))}) = ${texNum(fmtBr(vTotal, 4, 4))}\\text{ m}^3`} />;
      } else {
        vTotal = Math.pow(d1, 2) * d2;
        geomEqTex = 'V_{\\text{total}} = b^2 \\cdot H';
        geomVars = <>largura <MathTex tex={`b = ${texNum(fmtBr(d1))}\\text{ m}`} />; altura <MathTex tex={`H = ${texNum(fmtBr(d2))}\\text{ m}`} /></>;
        geomSub = <MathTex tex={`V_{\\text{total}} = (${texNum(fmtBr(d1))})^2 \\cdot (${texNum(fmtBr(d2))}) = ${texNum(fmtBr(vTotal, 4, 4))}\\text{ m}^3`} />;
      }

      const rhoO = rhoOGlobal;
      const rhoF = rhoFGlobal;
      const g = 9.81;
      const pesoN = pesoNGlobal;
      const massaKg = pesoN > 0 ? pesoN / g : rhoO * vTotal;
      const empuxoN = empuxoNGlobal;
      const volSubNum = volSubNumGlobal;
      const simulacaoAindaNaoSolta = simulacao.isSimulating === false && empuxoN === 0;

      return [
        {
          number: 1,
          title: 'Determinação do volume total e do peso real do corpo',
          equation: (
            <MathTex
              display
              tex={`${geomEqTex} \\quad | \\quad m = \\rho_o \\cdot V_{\\text{total}} \\quad | \\quad P = m \\cdot g`}
            />
          ),
          variables: (
            <>
              {geomVars}; <MathTex tex={`\\rho_o = ${texNum(fmtBr(rhoO, 0, 0))}\\text{ kg/m}^3`} />; <MathTex tex="g = 9{,}81\text{ m/s}^2" />
            </>
          ),
          substitution: (
            <>
              {geomSub}; <MathTex tex={`m = ${texNum(fmtBr(rhoO, 0, 0))} \\times ${texNum(fmtBr(vTotal, 4, 4))} = ${texNum(fmtBr(massaKg))}\\text{ kg}`} />; <MathTex tex={`P = ${texNum(fmtBr(massaKg))} \\times 9{,}81`} />
            </>
          ),
          result: <MathTex tex={`P = ${texNum(fmtBr(pesoN))}\\text{ N}\\;(${texNum(fmtBr(pesoN / 1000))}\\text{ kN})`} />,
          note: (
            <>
              Volume geométrico total <MathTex tex={`V_{\\text{total}} = ${texNum(fmtBr(vTotal, 4, 4))}\\text{ m}^3`} /> e massa <MathTex tex={`m = ${texNum(fmtBr(massaKg))}\\text{ kg}`} />.
            </>
          ),
          tone: 'red',
          estimatedHeight: 170,
        },
        {
          number: 2,
          title: 'Determinação do volume deslocado e da altura submersa',
          equation:
            rhoO < rhoF ? (
              <MathTex display tex="\frac{V_{\text{sub}}}{V_{\text{total}}} = \frac{\rho_o}{\rho_f} \quad (\text{flutuação em equilíbrio})" />
            ) : (
              <MathTex display tex="V_{\text{sub}} = V_{\text{total}} \quad (\text{submersão integral, } \rho_o \ge \rho_f)" />
            ),
          variables: (
            <>
              <MathTex tex={`V_{\\text{total}} = ${texNum(fmtBr(vTotal, 4, 4))}\\text{ m}^3`} />; <MathTex tex={`\\rho_o = ${texNum(fmtBr(rhoO, 0, 0))}\\text{ kg/m}^3`} />; <MathTex tex={`\\rho_f = ${texNum(fmtBr(rhoF, 0, 0))}\\text{ kg/m}^3`} />
            </>
          ),
          substitution: simulacaoAindaNaoSolta ? (
            'Bloco na posição inicial acima da superfície livre do fluido antes da liberação no tanque.'
          ) : rhoO < rhoF ? (
            <MathTex tex={`V_{\\text{sub}} = ${texNum(fmtBr(vTotal, 4, 4))} \\times \\frac{${texNum(fmtBr(rhoO, 0, 0))}}{${texNum(fmtBr(rhoF, 0, 0))}} = ${texNum(fmtBr(volSubNum, 4, 4))}\\text{ m}^3`} />
          ) : (
            <>
              Corpo totalmente imerso: <MathTex tex={`V_{\\text{sub}} = ${texNum(fmtBr(volSubNum, 4, 4))}\\text{ m}^3`} />
            </>
          ),
          result: (
            <MathTex
              tex={`V_{\\text{sub}} = ${texNum(fmtBr(volSubNum, 4, 4))}\\text{ m}^3 \\;\\;|\\;\\; h_{\\text{sub}} = ${texNum(fmtBr(hSubNumGlobal))}\\text{ m}`}
            />
          ),
          note: simulacaoAindaNaoSolta
            ? 'Simulação exportada em repouso inicial; solte o bloco para registrar o calado dinâmico.'
            : `Fração de volume imerso equivalente a ${vTotal > 0 ? fmtBr((volSubNum / vTotal) * 100, 1, 1) : '0,0'}% do corpo.`,
          tone: 'cyan',
          estimatedHeight: 170,
        },
        {
          number: 3,
          title: 'Determinação da força de empuxo (Princípio de Arquimedes)',
          equation: <MathTex display tex="E = \rho_f \cdot g \cdot V_{\text{sub}}" />,
          variables: (
            <>
              <MathTex tex={`\\rho_f = ${texNum(fmtBr(rhoF, 0, 0))}\\text{ kg/m}^3`} />; <MathTex tex="g = 9{,}81\text{ m/s}^2" />; <MathTex tex={`V_{\\text{sub}} = ${texNum(fmtBr(volSubNum, 4, 4))}\\text{ m}^3`} />
            </>
          ),
          substitution: (
            <MathTex tex={`E = ${texNum(fmtBr(rhoF, 0, 0))} \\times 9{,}81 \\times ${texNum(fmtBr(volSubNum, 4, 4))}`} />
          ),
          result: <MathTex tex={`E = ${texNum(fmtBr(empuxoN))}\\text{ N}\\;(${texNum(fmtBr(empuxoN / 1000))}\\text{ kN})`} />,
          note: 'Força vertical orientada de baixo para cima, igual ao peso do fluido deslocado.',
          tone: 'green',
          estimatedHeight: 158,
        },
        {
          number: 4,
          title: 'Determinação do peso aparente do corpo imerso',
          equation: <MathTex display tex="P_{\text{ap}} = \max(0,\; P - E)" />,
          variables: (
            <>
              <MathTex tex={`P = ${texNum(fmtBr(pesoN))}\\text{ N}`} />; <MathTex tex={`E = ${texNum(fmtBr(empuxoN))}\\text{ N}`} />
            </>
          ),
          substitution: (
            <MathTex tex={`P_{\\text{ap}} = \\max\\!\\left(0,\\; ${texNum(fmtBr(pesoN))} - ${texNum(fmtBr(empuxoN))}\\right)`} />
          ),
          result: <MathTex tex={`P_{\\text{ap}} = ${texNum(fmtBr(dados.pesoAparenteNum))}\\text{ N}`} />,
          note:
            dados.pesoAparenteNum <= 0.01 ? (
              <>
                Em flutuação livre (<MathTex tex="P = E" />), o peso aparente resultante é nulo.
              </>
            ) : (
              'Leitura efetiva registrada caso o corpo seja sustentado submerso.'
            ),
          tone: 'blue',
          estimatedHeight: 154,
        },
        {
          number: 5,
          title: 'Verificação da condição de equilíbrio e flutuação',
          equation: <MathTex display tex="\text{Comparação entre } \rho_o \text{ e } \rho_f \quad (\text{ou entre } P \text{ e } E)" />,
          variables: (
            <>
              <MathTex tex={`\\rho_o = ${texNum(fmtBr(rhoO, 0, 0))}\\text{ kg/m}^3`} />; <MathTex tex={`\\rho_f = ${texNum(fmtBr(rhoF, 0, 0))}\\text{ kg/m}^3`} />; <MathTex tex={`P = ${texNum(fmtBr(pesoN))}\\text{ N}`} />; <MathTex tex={`E = ${texNum(fmtBr(empuxoN))}\\text{ N}`} />
            </>
          ),
          substitution:
            statusLabel === 'FLUTUA' ? (
              <MathTex tex={`\\rho_o\\;(${texNum(fmtBr(rhoO, 0, 0))}) < \\rho_f\\;(${texNum(fmtBr(rhoF, 0, 0))})`} />
            ) : statusLabel === 'AFUNDA' ? (
              <MathTex tex={`\\rho_o\\;(${texNum(fmtBr(rhoO, 0, 0))}) > \\rho_f\\;(${texNum(fmtBr(rhoF, 0, 0))})`} />
            ) : (
              <MathTex tex={`\\rho_o\\;(${texNum(fmtBr(rhoO, 0, 0))}) = \\rho_f\\;(${texNum(fmtBr(rhoF, 0, 0))})`} />
            ),
          result: (
            <>
              Condição final: {statusLabel} (<MathTex tex={relCondTex} />)
            </>
          ),
          note: dados.statusFisico,
          tone: statusLabel === 'AFUNDA' ? 'amber' : 'green',
          estimatedHeight: 158,
        },
      ];
    }

    if (dados.tipo === 'comportas') {
      const ar = dados.analyzedResults;
      if (!ar || !ar.forceData?.up) {
        return null;
      }

      const up = ar.forceData.up;
      const down = ar.forceData.down;
      const fd = ar.forceData;
      const eq = ar.equilibrium || { M_hinge: 0, F_tie: 0 };
      const dim = simulacao.dimensoes || {};
      const H = Number(dim['Altura (m)'] ?? 1);
      const W = Number(dim['Base/Largura (m)'] ?? 1);
      const theta = Number(dim['Inclinação (°)'] ?? 90);
      const geoLower = String(dados.geometria || '').toLowerCase();
      const isCircular = geoLower.includes('circular') && !geoLower.includes('semi');
      const isSemi = geoLower.includes('semi');
      const isRect = !isCircular && !isSemi;

      const isKgf = ar.sistemaUnidades === 'TECNICO_KGF';
      const g = 9.81;
      const rhoUp = ar.densityUp ?? dados.densidadeFluido ?? 1000;
      const gammaUp = ar.gammaUp ?? rhoUp * g;
      const gammaDisp = isKgf ? fmtBr(rhoUp, 0, 0) : fmtBr(gammaUp, 0, 0);
      const gammaUnitTex = isKgf ? '\\text{kgf/m}^3' : '\\text{N/m}^3';
      const pCgPa = gammaUp * up.h_cg;
      const pCgDisp = isKgf ? fmtBr(pCgPa / g, 1, 1) : fmtBr(pCgPa / 1000, 2, 2);
      const pUnitTex = isKgf ? '\\text{kgf/m}^2' : '\\text{kPa}';
      const fmtForce = (valN) => (isKgf ? fmtBr(valN / g, 1, 1) : fmtBr(valN / 1000, 2, 2));
      const forceUnitTex = isKgf ? '\\text{kgf}' : '\\text{kN}';
      const momentUnitTex = isKgf ? '\\text{kgf}\\cdot\\text{m}' : '\\text{kN}\\cdot\\text{m}';

      const yCg = up.Y_CG ?? up.h_cg / Math.max(0.001, Math.sin((theta * Math.PI) / 180));
      const Ixx =
        up.Ixx ??
        (isCircular
          ? (Math.PI * Math.pow(H / 2, 4)) / 4
          : isRect
            ? (W * Math.pow(H, 3)) / 12
            : Math.pow(H, 4) * (Math.PI / 8 - 8 / (9 * Math.PI)));
      const deltaY = up.delta_y ?? Ixx / Math.max(1e-6, up.area * yCg);
      const yCp = up.Y_CP ?? yCg + deltaY;
      const hasDown = (down?.FR ?? 0) > 1e-3;
      const pesoComporta = Number(dados.peso || 0);

      return [
        {
          number: 1,
          title: 'Propriedades geométricas da superfície molhada',
          equation: isCircular ? (
            <MathTex display tex="A = \frac{\pi \cdot D^2}{4} \quad | \quad I_{xx} = \frac{\pi \cdot D^4}{64}" />
          ) : isRect ? (
            <MathTex display tex="A = B \cdot H \quad | \quad I_{xx} = \frac{B \cdot H^3}{12}" />
          ) : (
            <MathTex display tex="A = \frac{\pi \cdot R^2}{2} \quad | \quad I_{xx} = R^4 \cdot \left(\frac{\pi}{8} - \frac{8}{9\pi}\right)" />
          ),
          variables: isCircular ? (
            <>diâmetro <MathTex tex={`D = ${texNum(fmtBr(H))}\\text{ m}`} /></>
          ) : isRect ? (
            <>largura <MathTex tex={`B = ${texNum(fmtBr(W))}\\text{ m}`} />; altura <MathTex tex={`H = ${texNum(fmtBr(H))}\\text{ m}`} /></>
          ) : (
            <>raio <MathTex tex={`R = ${texNum(fmtBr(H))}\\text{ m}`} /></>
          ),
          substitution: isCircular ? (
            <>
              <MathTex tex={`A = \\frac{\\pi \\cdot (${texNum(fmtBr(H))})^2}{4} = ${texNum(fmtBr(up.area, 4, 4))}\\text{ m}^2`} />; <MathTex tex={`I_{xx} = \\frac{\\pi \\cdot (${texNum(fmtBr(H))})^4}{64} = ${texNum(fmtBr(Ixx, 5, 5))}\\text{ m}^4`} />
            </>
          ) : isRect ? (
            <>
              <MathTex tex={`A = ${texNum(fmtBr(W))} \\times ${texNum(fmtBr(H))} = ${texNum(fmtBr(up.area, 4, 4))}\\text{ m}^2`} />; <MathTex tex={`I_{xx} = \\frac{${texNum(fmtBr(W))} \\times (${texNum(fmtBr(H))})^3}{12} = ${texNum(fmtBr(Ixx, 5, 5))}\\text{ m}^4`} />
            </>
          ) : (
            <>
              <MathTex tex={`A = \\frac{\\pi \\cdot (${texNum(fmtBr(H))})^2}{2} = ${texNum(fmtBr(up.area, 4, 4))}\\text{ m}^2`} />; <MathTex tex={`I_{xx} = ${texNum(fmtBr(Ixx, 5, 5))}\\text{ m}^4`} />
            </>
          ),
          result: <MathTex tex={`A = ${texNum(fmtBr(up.area, 4, 4))}\\text{ m}^2 \\;\\;|\\;\\; I_{xx} = ${texNum(fmtBr(Ixx, 5, 5))}\\text{ m}^4`} />,
          note: 'Área efetiva submersa e momento de inércia centroidal utilizados no cálculo do empuxo.',
          tone: 'slate',
          estimatedHeight: 165,
        },
        {
          number: 2,
          title: 'Profundidade do centróide e pressão hidrostática no CG',
          equation: <MathTex display tex="h_{\text{cg}} = Y_{\text{CG}} \cdot \operatorname{sen}(\theta) \quad | \quad p_{\text{cg}} = \gamma \cdot h_{\text{cg}}" />,
          variables: (
            <>
              <MathTex tex={`Y_{\\text{CG}} = ${texNum(fmtBr(yCg, 3, 3))}\\text{ m}`} />; <MathTex tex={`\\theta = ${texNum(fmtBr(theta, 1, 1))}^\\circ`} />; <MathTex tex={`\\gamma = ${texNum(gammaDisp)}\\;${gammaUnitTex}`} />
            </>
          ),
          substitution: (
            <>
              <MathTex tex={`h_{\\text{cg}} = ${texNum(fmtBr(yCg, 3, 3))} \\times \\operatorname{sen}(${texNum(fmtBr(theta, 1, 1))}^\\circ) = ${texNum(fmtBr(up.h_cg, 3, 3))}\\text{ m}`} />; <MathTex tex={`p_{\\text{cg}} = ${texNum(gammaDisp)} \\times ${texNum(fmtBr(up.h_cg, 3, 3))}`} />
            </>
          ),
          result: <MathTex tex={`h_{\\text{cg}} = ${texNum(fmtBr(up.h_cg, 3, 3))}\\text{ m} \\;\\;|\\;\\; p_{\\text{cg}} = ${texNum(pCgDisp)}\\;${pUnitTex}`} />,
          note: 'Pressão média exercida pelo fluido no centro de gravidade da área molhada.',
          tone: 'blue',
          estimatedHeight: 160,
        },
        {
          number: 3,
          title: 'Determinação da força hidrostática resultante',
          equation: hasDown ? (
            <MathTex display tex="F_{R,\text{mont}} = p_{\text{cg}} \cdot A \quad | \quad F_{R,\text{líq}} = |F_{R,\text{mont}} - F_{R,\text{jus}}|" />
          ) : (
            <MathTex display tex="F_R = p_{\text{cg}} \cdot A = \gamma \cdot h_{\text{cg}} \cdot A" />
          ),
          variables: (
            <>
              <MathTex tex={`p_{\\text{cg}} = ${texNum(pCgDisp)}\\;${pUnitTex}`} />; <MathTex tex={`A = ${texNum(fmtBr(up.area, 4, 4))}\\text{ m}^2`} />
              {hasDown && <>; <MathTex tex={`F_{R,\\text{jus}} = ${texNum(fmtForce(down.FR))}\\;${forceUnitTex}`} /></>}
            </>
          ),
          substitution: hasDown ? (
            <MathTex tex={`F_{R,\\text{mont}} = ${texNum(fmtForce(up.FR))}\\;${forceUnitTex}; \\quad F_{R,\\text{líq}} = |${texNum(fmtForce(up.FR))} - ${texNum(fmtForce(down.FR))}|`} />
          ) : (
            <MathTex tex={`F_R = ${texNum(pCgDisp)} \\times ${texNum(fmtBr(up.area, 4, 4))}`} />
          ),
          result: <MathTex tex={`F_R = ${texNum(fmtForce(Math.abs(fd.FR_net)))}\\;${forceUnitTex}\\;(${texNum(fmtBr(Math.abs(fd.FR_net), 0, 0))}\\text{ N})`} />,
          note: 'Força resultante perpendicular ao plano da comporta.',
          tone: 'green',
          estimatedHeight: 158,
        },
        {
          number: 4,
          title: 'Determinação do centro de pressão e ponto de aplicação',
          equation: (
            <MathTex
              display
              tex="\Delta y = \frac{I_{xx}}{A \cdot Y_{\text{CG}}} \quad | \quad Y_{\text{CP}} = Y_{\text{CG}} + \Delta y \quad | \quad h_{\text{cp}} = Y_{\text{CP}} \cdot \operatorname{sen}(\theta)"
            />
          ),
          variables: (
            <>
              <MathTex tex={`I_{xx} = ${texNum(fmtBr(Ixx, 5, 5))}\\text{ m}^4`} />; <MathTex tex={`A = ${texNum(fmtBr(up.area, 4, 4))}\\text{ m}^2`} />; <MathTex tex={`Y_{\\text{CG}} = ${texNum(fmtBr(yCg, 3, 3))}\\text{ m}`} />
            </>
          ),
          substitution: (
            <>
              <MathTex tex={`\\Delta y = ${texNum(fmtBr(deltaY, 4, 4))}\\text{ m}`} />; <MathTex tex={`Y_{\\text{CP}} = ${texNum(fmtBr(yCg, 3, 3))} + ${texNum(fmtBr(deltaY, 4, 4))} = ${texNum(fmtBr(yCp, 3, 3))}\\text{ m}`} />; <MathTex tex={`h_{\\text{cp}} = ${texNum(fmtBr(yCp, 3, 3))} \\times \\operatorname{sen}(${texNum(fmtBr(theta, 1, 1))}^\\circ)`} />
            </>
          ),
          result: <MathTex tex={`h_{\\text{cp}} = ${texNum(fmtBr(up.h_cp ?? up.h_cg, 3, 3))}\\text{ m} \\;\\;|\\;\\; s_{\\text{cp}} = ${texNum(fmtBr(fd.s_cp_net, 3, 3))}\\text{ m}`} />,
          note: (
            <>
              Ponto de aplicação deslocado <MathTex tex="\Delta y" /> abaixo do centróide ao longo da superfície.
            </>
          ),
          tone: 'cyan',
          estimatedHeight: 170,
        },
        {
          number: 5,
          title: 'Verificação do equilíbrio estático na articulação e tirante',
          equation: (
            <MathTex
              display
              tex="\Sigma M_{\text{articulação}} = 0 \;\Rightarrow\; F_{\text{tirante}} = \frac{|M_{\text{articulação}}|}{d_{\text{tirante}} \cdot \operatorname{sen}(\alpha)}"
            />
          ),
          variables: (
            <>
              <MathTex tex={`s_{\\text{cp}} = ${texNum(fmtBr(fd.s_cp_net, 3, 3))}\\text{ m}`} />; peso próprio <MathTex tex={`P = ${texNum(fmtBr(pesoComporta))}\\text{ N}`} />
            </>
          ),
          substitution:
            Math.abs(eq.M_hinge || 0) > 1e-6 || Math.abs(eq.F_tie || 0) > 1e-6 ? (
              <>
                <MathTex tex={`M_{\\text{articulação}} = ${texNum(fmtBr(Math.abs(eq.M_hinge) / (isKgf ? g : 1000)))}\\;${momentUnitTex}`} />; <MathTex tex="F_{\text{tirante}}" /> calculada pelo balanço estático de momentos
              </>
            ) : (
              'Sem solicitação ativa no tirante ou articulação configurada sem momento líquido externo.'
            ),
          result:
            Math.abs(eq.F_tie || 0) > 1e-6 ? (
              <MathTex tex={`F_{\\text{tirante}} = ${texNum(fmtForce(Math.abs(eq.F_tie)))}\\;${forceUnitTex}\\;(${texNum(fmtBr(Math.abs(eq.F_tie), 1, 1))}\\text{ N})`} />
            ) : (
              <MathTex tex={`M_{\\text{articulação}} = ${texNum(fmtBr(Math.abs(eq.M_hinge) / (isKgf ? g : 1000)))}\\;${momentUnitTex} \\;\\;|\\;\\; F_{\\text{tirante}} = 0{,}00\\;${forceUnitTex}`} />
            ),
          note:
            pesoComporta > 0
              ? 'Momento resultante considera empuxo hidrostático e peso próprio da comporta.'
              : 'Peso próprio da comporta não habilitado nesta simulação.',
          tone: 'amber',
          estimatedHeight: 170,
        },
      ];
    }

    // barragens
    const ar = dados.analyzedResults;
    if (!ar || !ar.stabilityData || !ar.forceData) {
      return null;
    }

    const fd = ar.forceData;
    const st = ar.stabilityData;
    const ni = ar.normalizedInputs || {};
    const isKgf = ni.unitSystem === 'TECNICO_KGF';
    const g = ni.gravity || 9.81;
    const rho = ni.density || 1000;
    const gammaWVal = isKgf ? rho : rho * g;
    const gammaWUnitTex = isKgf ? '\\text{kgf/m}^3' : '\\text{N/m}^3';
    const fmtF = (valN) => (isKgf ? fmtBr(valN / g, 1, 1) : fmtBr(valN / 1000, 2, 2));
    const unitFTex = isKgf ? '\\text{kgf/m}' : '\\text{kN/m}';
    const fmtM = (valNm) => (isKgf ? fmtBr(valNm / g, 1, 1) : fmtBr(valNm / 1000, 2, 2));
    const unitMTex = isKgf ? '\\text{kgf}\\cdot\\text{m/m}' : '\\text{kN}\\cdot\\text{m/m}';
    const fmtP = (valPa) => (isKgf ? fmtBr(valPa / g, 0, 0) : fmtBr(valPa / 1000, 2, 2));
    const unitPTex = isKgf ? '\\text{kgf/m}^2' : '\\text{kPa}';

    const hUp = ni.upstreamLevel ?? 0;
    const hDown = ni.downstreamLevel ?? 0;
    const thetaUp = fd.thetaUp ?? ni.inclinationAngle ?? 90;
    const thetaDown = fd.thetaDown ?? ni.downstreamAngle ?? thetaUp;
    const mud = fd.up?.mudLayer;
    const gammaMatDisp = isKgf ? fmtBr((st.gammaMaterial || 24000) / g, 0, 0) : fmtBr((st.gammaMaterial || 24000) / 1000, 1, 1);
    const gammaMatUnitTex = isKgf ? '\\text{kgf/m}^3' : '\\text{kN/m}^3';

    const steps = [
      {
        number: 1,
        title: 'Determinação do peso próprio da barragem',
        equation: <MathTex display tex="V = A_{\text{seção}} \cdot 1{,}00\text{ m} \quad | \quad W = V \cdot \gamma_{\text{mat}}" />,
        variables: (
          <>
            <MathTex tex={`H = ${texNum(fmtBr(ni.damHeight))}\\text{ m}`} />; <MathTex tex={`B = ${texNum(fmtBr(st.actualBaseWidth))}\\text{ m}`} />; <MathTex tex={`b_{\\text{crista}} = ${texNum(fmtBr(ni.damCrestWidth))}\\text{ m}`} />; <MathTex tex={`A_{\\text{seção}} = ${texNum(fmtBr(st.area))}\\text{ m}^2/\\text{m}`} />; <MathTex tex={`\\gamma_{\\text{mat}} = ${texNum(gammaMatDisp)}\\;${gammaMatUnitTex}`} />
          </>
        ),
        substitution: (
          <>
            <MathTex tex={`V = ${texNum(fmtBr(st.area))} \\times 1{,}00 = ${texNum(fmtBr(st.area))}\\text{ m}^3/\\text{m}`} />; <MathTex tex={`W = ${texNum(fmtBr(st.area))} \\times ${texNum(gammaMatDisp)}`} />
          </>
        ),
        result: <MathTex tex={`W = ${texNum(fmtF(st.weight))}\\;${unitFTex}`} />,
        note: (
          <>
            Centro de gravidade em <MathTex tex={`x_{\\text{cg}} = ${texNum(fmtBr(st.x_cg))}\\text{ m}`} /> (do pé de montante) e <MathTex tex={`y_{\\text{cg}} = ${texNum(fmtBr(st.y_cg))}\\text{ m}`} />.
            {ar.damType === 'CONTRAFORTE' ? ' Fator de volume de contrafortes (20%) aplicado.' : ''}
          </>
        ),
        tone: 'slate',
        estimatedHeight: 168,
      },
      {
        number: 2,
        title: 'Determinação da força hidrostática horizontal',
        equation: mud ? (
          <MathTex display tex="F_{H,\text{mont}} = (P' + P'') \cdot \operatorname{sen}(\theta) \quad | \quad F_{H,\text{líq}} = F_{H,\text{mont}} - F_{H,\text{jus}} \quad | \quad y_{\text{cp}} = \frac{\Sigma M_H}{F_{H,\text{líq}}}" />
        ) : (
          <MathTex display tex="F_{H,\text{mont}} = \frac{1}{2} \cdot \gamma \cdot h_{\text{mont}}^2 \quad | \quad F_{H,\text{líq}} = F_{H,\text{mont}} - F_{H,\text{jus}} \quad | \quad y_{\text{cp}} = \frac{\Sigma M_H}{F_{H,\text{líq}}}" />
        ),
        variables: mud ? (
          <>
            <MathTex tex={`\\gamma_{\\text{água}} = ${texNum(fmtBr(gammaWVal, 0, 0))}\\;${gammaWUnitTex}`} />; <MathTex tex={`h_{\\text{água}} = ${texNum(fmtBr(mud.waterHeight))}\\text{ m}`} />; <MathTex tex={`h_{\\text{lama}} = ${texNum(fmtBr(mud.mudHeight))}\\text{ m}`} /> (<MathTex tex={`\\rho_{\\text{lama}} = ${texNum(fmtBr(mud.mudDensity, 0, 0))}\\text{ kg/m}^3`} />); <MathTex tex={`h_{\\text{jus}} = ${texNum(fmtBr(hDown))}\\text{ m}`} />
          </>
        ) : (
          <>
            <MathTex tex={`\\gamma = ${texNum(fmtBr(gammaWVal, 0, 0))}\\;${gammaWUnitTex}`} />; <MathTex tex={`h_{\\text{mont}} = ${texNum(fmtBr(hUp))}\\text{ m}`} />; <MathTex tex={`h_{\\text{jus}} = ${texNum(fmtBr(hDown))}\\text{ m}`} />; <MathTex tex={`\\theta_{\\text{mont}} = ${texNum(fmtBr(thetaUp, 1, 1))}^\\circ`} />
          </>
        ),
        substitution: mud ? (
          <>
            <MathTex tex={`P' = ${texNum(fmtF(mud.F_water))}\\;${unitFTex}`} /> (<MathTex tex={`y_{C'} = ${texNum(fmtBr(mud.y_cp_water))}\\text{ m}`} />); <MathTex tex={`p_{\\text{int}} = ${texNum(fmtP(mud.p_interface))}\\;${unitPTex}`} />; <MathTex tex={`P'' = ${texNum(fmtF(mud.F_mud_rect))} + ${texNum(fmtF(mud.F_mud_tri))} = ${texNum(fmtF(mud.F_mud))}\\;${unitFTex}`} /> (<MathTex tex={`y_{C''} = ${texNum(fmtBr(mud.y_cp_mud))}\\text{ m}`} />); <MathTex tex={`F_{H,\\text{mont}} = ${texNum(fmtF(fd.up.FH))}\\;${unitFTex}`} />
            {hDown > 0 && <>; <MathTex tex={`F_{H,\\text{jus}} = ${texNum(fmtF(fd.down.FH))}\\;${unitFTex}`} /></>}
          </>
        ) : (
          <>
            <MathTex tex={`F_{R,\\text{mont}} = ${texNum(fmtF(fd.up.FR))}\\;${unitFTex}`} />; <MathTex tex={`F_{H,\\text{mont}} = ${texNum(fmtF(fd.up.FH))}\\;${unitFTex}`} />
            {hDown > 0 && (
              <>
                ; <MathTex tex={`F_{H,\\text{jus}} = ${texNum(fmtF(fd.down.FH))}\\;${unitFTex}`} />; <MathTex tex={`F_{H,\\text{líq}} = ${texNum(fmtF(fd.up.FH))} - ${texNum(fmtF(fd.down.FH))}`} />
              </>
            )}
          </>
        ),
        result: <MathTex tex={`F_{H,\\text{líq}} = ${texNum(fmtF(fd.FH_net))}\\;${unitFTex} \\;\\;|\\;\\; y_{\\text{cp}} = ${texNum(fmtBr(fd.y_cp_net))}\\text{ m (da base)}`} />,
        note: (
          <>
            Pressão máxima na base a montante <MathTex tex={`p_{\\text{máx}} = ${texNum(fmtP(fd.p_max_up))}\\;${unitPTex}`} />.
          </>
        ),
        tone: 'blue',
        estimatedHeight: mud || hDown > 0 ? 198 : 172,
      },
      {
        number: 3,
        title: 'Determinação da componente vertical hidrostática',
        equation: <MathTex display tex="F_V = \gamma \cdot \text{Vol}_{\text{água}} = F_{R,\text{mont}} \cdot \cos(\theta_{\text{mont}}) + F_{R,\text{jus}} \cdot \cos(\theta_{\text{jus}})" />,
        variables: (
          <>
            <MathTex tex={`F_{R,\\text{mont}} = ${texNum(fmtF(fd.up.FR))}\\;${unitFTex}`} /> (<MathTex tex={`\\theta_{\\text{mont}} = ${texNum(fmtBr(thetaUp, 1, 1))}^\\circ`} />)
            {hDown > 0 && (
              <>
                ; <MathTex tex={`F_{R,\\text{jus}} = ${texNum(fmtF(fd.down.FR))}\\;${unitFTex}`} /> (<MathTex tex={`\\theta_{\\text{jus}} = ${texNum(fmtBr(thetaDown, 1, 1))}^\\circ`} />)
              </>
            )}
          </>
        ),
        substitution: (
          <>
            <MathTex tex={`F_{V,\\text{mont}} = ${texNum(fmtF(fd.up.FV))}\\;${unitFTex}`} />
            {hDown > 0 && (
              <>
                ; <MathTex tex={`F_{V,\\text{jus}} = ${texNum(fmtF(fd.down.FV))}\\;${unitFTex}`} />; <MathTex tex={`F_{V,\\text{líq}} = ${texNum(fmtF(fd.up.FV))} + ${texNum(fmtF(fd.down.FV))}`} />
              </>
            )}
          </>
        ),
        result: <MathTex tex={`F_V = ${texNum(fmtF(fd.FV_net))}\\;${unitFTex}`} />,
        note:
          Math.abs(fd.FV_net) < 1e-3 ? (
            <>
              Paramentos verticais (<MathTex tex="\cos 90^\circ = 0" />): não há coluna de fluido apoiada sobre a face.
            </>
          ) : (
            'Peso de fluido atuando verticalmente para baixo sobre as faces inclinadas da barragem.'
          ),
        tone: 'cyan',
        estimatedHeight: 162,
      },
      {
        number: 4,
        title: 'Determinação da subpressão na base',
        equation: <MathTex display tex="U = \frac{1}{2} \cdot \gamma \cdot (h_{\text{mont}} + h_{\text{jus}}) \cdot B \quad (\text{diagrama linear em base permeável})" />,
        variables: (
          <>
            <MathTex tex={`B = ${texNum(fmtBr(st.actualBaseWidth))}\\text{ m}`} />; <MathTex tex={`h_{\\text{mont}} = ${texNum(fmtBr(hUp))}\\text{ m}`} />; <MathTex tex={`h_{\\text{jus}} = ${texNum(fmtBr(hDown))}\\text{ m}`} />; critério: {st.upliftAssumption}
          </>
        ),
        substitution: 'Conforme critério adotado nesta simulação, considera-se fundação impermeável sem percolação ativa sob a base.',
        result: <MathTex tex={`U = 0{,}00\\;${unitFTex}\\;(\\text{base impermeável})`} />,
        note: (
          <>
            Resultante vertical efetiva na fundação: <MathTex tex={`\\Sigma F_V = W + F_V - U = ${texNum(fmtF(st.total_vertical_force))}\\;${unitFTex}`} />.
          </>
        ),
        tone: 'amber',
        estimatedHeight: 164,
      },
    ];

    if (st.isArchDam) {
      steps.push({
        number: 5,
        title: 'Verificação estrutural pelo efeito de arco',
        equation: <MathTex display tex="N_{\text{arco}} = p_{\text{máx}} \cdot R_{\text{arco}} \quad | \quad \sigma_{\text{arco}} = \frac{N_{\text{arco}}}{B_{\text{base}}}" />,
        variables: (
          <>
            <MathTex tex={`p_{\\text{máx}} = ${texNum(fmtP(fd.p_max_up))}\\;${unitPTex}`} />; <MathTex tex={`R_{\\text{arco}} = ${texNum(fmtBr(ni.archRadius ?? 30, 1, 1))}\\text{ m}`} />; <MathTex tex={`B = ${texNum(fmtBr(st.actualBaseWidth))}\\text{ m}`} />
          </>
        ),
        substitution: (
          <>
            <MathTex tex={`N_{\\text{arco}} = ${texNum(fmtP(fd.p_max_up))} \\times ${texNum(fmtBr(ni.archRadius ?? 30, 1, 1))}`} />; <MathTex tex={`\\sigma_{\\text{arco}} = \\frac{${texNum(fmtF(st.archThrust ?? 0))}}{${texNum(fmtBr(st.actualBaseWidth))}}`} />
          </>
        ),
        result: <MathTex tex={`N_{\\text{arco}} = ${texNum(fmtF(st.archThrust ?? 0))}\\;${unitFTex} \\;\\;|\\;\\; \\sigma_{\\text{arco}} = ${texNum(fmtBr((st.archStressBase ?? 0) / 1e6))}\\text{ MPa}`} />,
        note: 'Em barragens em arco, o empuxo é transferido às ombreiras por compressão em arco (FS 2D de gravidade não aplicáveis).',
        tone: 'green',
        estimatedHeight: 172,
      });
    } else {
      const deslOk = st.fs_desl >= 1.5;
      const tombOk = st.fs_tomb >= 1.5;
      const fResN = st.total_vertical_force * st.mu;

      steps.push({
        number: 5,
        title: 'Verificação da segurança ao deslizamento',
        equation: <MathTex display tex="F_{\text{res}} = \mu \cdot \Sigma F_V \quad | \quad FS_{\text{desl}} = \frac{F_{\text{res}}}{|F_{H,\text{líq}}|}" />,
        variables: (
          <>
            <MathTex tex={`\\mu = ${texNum(fmtBr(st.mu))}`} />; <MathTex tex={`\\Sigma F_V = W + F_V = ${texNum(fmtF(st.total_vertical_force))}\\;${unitFTex}`} />; <MathTex tex={`|F_{H,\\text{líq}}| = ${texNum(fmtF(Math.abs(fd.FH_net)))}\\;${unitFTex}`} />
          </>
        ),
        substitution: (
          <>
            <MathTex tex={`F_{\\text{res}} = ${texNum(fmtBr(st.mu))} \\times ${texNum(fmtF(st.total_vertical_force))} = ${texNum(fmtF(fResN))}\\;${unitFTex}`} />; <MathTex tex={`FS_{\\text{desl}} = \\frac{${texNum(fmtF(fResN))}}{${texNum(fmtF(Math.abs(fd.FH_net)))}}`} />
          </>
        ),
        result: (
          <>
            <MathTex tex={`FS_{\\text{desl}} = ${texNum(fmtBr(st.fs_desl))}`} />{' '}
            <span className="ml-[6px]">
              ({deslOk ? 'ATENDIDO: ' : 'NÃO ATENDIDO: '}
              <MathTex tex={deslOk ? 'FS \\ge 1{,}50' : 'FS < 1{,}50'} />)
            </span>
          </>
        ),
        note: 'Relação entre força resistente ao atrito na base e força horizontal solicitante.',
        tone: deslOk ? 'green' : 'red',
        estimatedHeight: 172,
      });

      steps.push({
        number: 6,
        title: 'Verificação da segurança ao tombamento',
        equation: <MathTex display tex="M_{\text{est}} = W \cdot b_W + \Sigma(F_V \cdot b_V) \quad | \quad FS_{\text{tomb}} = \frac{M_{\text{est}}}{M_{\text{tomb}}}" />,
        variables: (
          <>
            <MathTex tex={`b_W = B - x_{\\text{cg}} = ${texNum(fmtBr(st.lever_arm_weight))}\\text{ m}`} />; <MathTex tex={`M_{\\text{est}} = ${texNum(fmtM(st.moment_resisting))}\\;${unitMTex}`} />; <MathTex tex={`M_{\\text{tomb}} = |F_{H,\\text{líq}}| \\cdot y_{\\text{cp}} = ${texNum(fmtM(st.moment_overturning))}\\;${unitMTex}`} />
          </>
        ),
        substitution: (
          <MathTex tex={`FS_{\\text{tomb}} = \\frac{${texNum(fmtM(st.moment_resisting))}}{${texNum(fmtM(st.moment_overturning))}}`} />
        ),
        result: (
          <>
            <MathTex tex={`FS_{\\text{tomb}} = ${texNum(fmtBr(st.fs_tomb))}`} />{' '}
            <span className="ml-[6px]">
              ({tombOk ? 'ATENDIDO: ' : 'NÃO ATENDIDO: '}
              <MathTex tex={tombOk ? 'FS \\ge 1{,}50' : 'FS < 1{,}50'} />)
            </span>
          </>
        ),
        note: (
          <>
            Momentos calculados em torno do pé de jusante. Excentricidade na base: <MathTex tex={`e = ${texNum(fmtBr(st.e))}\\text{ m}`} />.
          </>
        ),
        tone: tombOk ? 'green' : 'red',
        estimatedHeight: 172,
      });
    }

    return steps;
  };

  const buildTheoryConcepts = () => {
    if (dados.tipo === 'corpos-imersos') {
      return [
        {
          number: 1,
          title: 'Princípio de Arquimedes',
          explanation:
            'Todo corpo total ou parcialmente imerso em um fluido em repouso sofre uma força vertical orientada de baixo para cima igual ao peso do volume de fluido deslocado pelo corpo.',
          equation: <MathTex display tex="E = P_{\text{fluido deslocado}} = \gamma_f \cdot V_{\text{sub}}" />,
          variables: (
            <>
              <MathTex tex="E" /> = força de empuxo (<MathTex tex="\text{N}" />); <MathTex tex="\gamma_f = \rho_f \cdot g" /> = peso específico do fluido (<MathTex tex="\text{N/m}^3" />); <MathTex tex="V_{\text{sub}}" /> = volume de fluido deslocado pela parte submersa (<MathTex tex="\text{m}^3" />).
            </>
          ),
          application:
            'No tanque simulado, quanto maior o volume submerso da geometria analisada, maior a massa de fluido deslocada e maior a sustentação hidrostática atuante sobre o corpo.',
          estimatedHeight: 190,
        },
        {
          number: 2,
          title: 'Empuxo Hidrostático',
          explanation:
            'O empuxo resulta da diferença entre as pressões hidrostáticas exercidas pelo fluido sobre as faces inferior e superior do corpo, crescendo linearmente com a profundidade segundo a Lei de Stevin.',
          equation: <MathTex display tex="E = \rho_f \cdot g \cdot V_{\text{sub}}" />,
          variables: (
            <>
              <MathTex tex="\rho_f" /> = massa específica do fluido (<MathTex tex="\text{kg/m}^3" />); <MathTex tex="g" /> = aceleração da gravidade (<MathTex tex="\text{m/s}^2" />); <MathTex tex="V_{\text{sub}}" /> = volume imerso (<MathTex tex="\text{m}^3" />).
            </>
          ),
          application: (
            <>
              Explica por que fluidos mais densos (maior <MathTex tex="\rho_f" />) geram maior empuxo para o mesmo volume submerso, reduzindo o calado necessário para equilibrar o corpo.
            </>
          ),
          estimatedHeight: 190,
        },
        {
          number: 3,
          title: 'Peso Real e Peso Aparente',
          explanation:
            'O peso real corresponde à ação gravitacional sobre a massa total do corpo, enquanto o peso aparente representa a resultante líquida percebida quando o corpo está imerso e aliviado pelo empuxo.',
          equation: <MathTex display tex="P = \rho_o \cdot g \cdot V_{\text{total}} \quad | \quad P_{\text{ap}} = \max(0,\; P - E)" />,
          variables: (
            <>
              <MathTex tex="P" /> = peso real (<MathTex tex="\text{N}" />); <MathTex tex="\rho_o" /> = densidade média do corpo (<MathTex tex="\text{kg/m}^3" />); <MathTex tex="V_{\text{total}}" /> = volume total do corpo (<MathTex tex="\text{m}^3" />); <MathTex tex="P_{\text{ap}}" /> = peso aparente (<MathTex tex="\text{N}" />).
            </>
          ),
          application: (
            <>
              Quando o corpo flutua livremente, o empuxo iguala o peso real (<MathTex tex="P_{\text{ap}} = 0" />); quando afunda, <MathTex tex="P_{\text{ap}}" /> traduz a força líquida que pressiona o fundo.
            </>
          ),
          estimatedHeight: 195,
        },
        {
          number: 4,
          title: 'Condições de Flutuação e Afundamento',
          explanation:
            'A tendência inicial de movimento vertical decorre da comparação direta entre a densidade média do corpo e a do fluido. Se for menos denso, emerge até deslocar exatamente o seu próprio peso.',
          equation: (
            <MathTex
              display
              tex="\rho_o < \rho_f \Rightarrow \text{Flutua}\;\left(\frac{V_{\text{sub}}}{V_{\text{total}}} = \frac{\rho_o}{\rho_f}\right) \quad | \quad \rho_o > \rho_f \Rightarrow \text{Afunda}"
            />
          ),
          variables: (
            <>
              <MathTex tex="\rho_o" /> = densidade do corpo (<MathTex tex="\text{kg/m}^3" />); <MathTex tex="\rho_f" /> = densidade do fluido (<MathTex tex="\text{kg/m}^3" />); <MathTex tex="\frac{V_{\text{sub}}}{V_{\text{total}}}" /> = fração volumétrica submersa.
            </>
          ),
          application: (
            <>
              Determina se a peça simulada permanece parcialmente emersa (como um bloco de madeira ou gelo) ou se submerge integralmente até o leito do tanque.
            </>
          ),
          estimatedHeight: 200,
        },
        {
          number: 5,
          title: 'Equilíbrio de Corpos Imersos',
          explanation:
            'O equilíbrio estático vertical ocorre quando o somatório das forças verticais se anula. Se a densidade do corpo iguala a do fluido, há equilíbrio indiferente em qualquer profundidade totalmente submersa.',
          equation: <MathTex display tex="\Sigma F_y = E - P = 0 \quad \Longleftrightarrow \quad E = P" />,
          variables: (
            <>
              <MathTex tex="\Sigma F_y" /> = resultante vertical de forças (<MathTex tex="\text{N}" />); <MathTex tex="E" /> = empuxo (<MathTex tex="\text{N}" />); <MathTex tex="P" /> = peso real (<MathTex tex="\text{N}" />).
            </>
          ),
          application:
            'Permite interpretar o repouso final atingido pelo corpo no laboratório após a estabilização das oscilações hidrostáticas na superfície ou no interior do fluido.',
          estimatedHeight: 190,
        },
      ];
    }

    if (dados.tipo === 'comportas') {
      return [
        {
          number: 1,
          title: 'Pressão Hidrostática em Superfícies Planas',
          explanation:
            'Em um fluido incompressível em repouso (Lei de Stevin), a pressão cresce linearmente com a profundidade vertical e atua sempre perpendicularmente à face plana submersa, independentemente do volume do reservatório.',
          equation: <MathTex display tex="p(h) = \gamma \cdot h = \rho \cdot g \cdot h" />,
          variables: (
            <>
              <MathTex tex="p(h)" /> = pressão manométrica na profundidade <MathTex tex="h" /> (<MathTex tex="\text{Pa}" />); <MathTex tex="\gamma" /> = peso específico do fluido (<MathTex tex="\text{N/m}^3" />); <MathTex tex="\rho" /> = densidade (<MathTex tex="\text{kg/m}^3" />); <MathTex tex="h" /> = profundidade vertical (<MathTex tex="\text{m}" />).
            </>
          ),
          application:
            'Define o carregamento distribuído sobre a comporta, sendo nulo na superfície livre e máximo na aresta ou geratriz mais profunda.',
          estimatedHeight: 190,
        },
        {
          number: 2,
          title: 'Força Hidrostática Resultante',
          explanation:
            'A força total exercida pelo fluido sobre uma superfície plana submersa equivale ao produto da pressão atuante no seu centroide pela área total molhada, atuando normalmente ao plano da comporta.',
          equation: <MathTex display tex="F_R = p_{\text{cg}} \cdot A = \gamma \cdot h_{\text{cg}} \cdot A" />,
          variables: (
            <>
              <MathTex tex="F_R" /> = força hidrostática resultante (<MathTex tex="\text{N}" />); <MathTex tex="p_{\text{cg}}" /> = pressão no centróide (<MathTex tex="\text{Pa}" />); <MathTex tex="h_{\text{cg}}" /> = profundidade do centróide (<MathTex tex="\text{m}" />); <MathTex tex="A" /> = área molhada (<MathTex tex="\text{m}^2" />).
            </>
          ),
          application:
            'Quantifica o esforço global que a comporta deve suportar devido à coluna de fluido a montante (e ao eventual alívio de pressão caso haja fluido a jusante).',
          estimatedHeight: 190,
        },
        {
          number: 3,
          title: 'Centroide da Superfície',
          explanation:
            'O centróide (CG) representa o centro geométrico da área molhada da comporta. Sua profundidade vertical e seu momento de inércia centroidal governam tanto a magnitude do empuxo quanto a excentricidade da resultante.',
          equation: <MathTex display tex="h_{\text{cg}} = Y_{\text{CG}} \cdot \operatorname{sen}(\theta) \quad | \quad I_{xx,\text{ret}} = \frac{B \cdot H^3}{12}" />,
          variables: (
            <>
              <MathTex tex="Y_{\text{CG}}" /> = distância inclinada da superfície livre ao centróide (<MathTex tex="\text{m}" />); <MathTex tex="\theta" /> = inclinação da comporta (<MathTex tex="^\circ" />); <MathTex tex="I_{xx}" /> = momento de inércia centroidal (<MathTex tex="\text{m}^4" />).
            </>
          ),
          application:
            'Permite caracterizar corretamente comportas retangulares, circulares ou semicirculares a partir de suas dimensões e ângulo de instalação.',
          estimatedHeight: 195,
        },
        {
          number: 4,
          title: 'Centro de Pressão',
          explanation:
            'Como a pressão hidrostática aumenta com a profundidade, a resultante concentra-se no Centro de Pressão (CP), posicionado sempre abaixo do centroide da área molhada ao longo do plano inclinado.',
          equation: <MathTex display tex="Y_{\text{CP}} = Y_{\text{CG}} + \frac{I_{xx}}{A \cdot Y_{\text{CG}}} \quad | \quad h_{\text{cp}} = Y_{\text{CP}} \cdot \operatorname{sen}(\theta)" />,
          variables: (
            <>
              <MathTex tex="Y_{\text{CP}}" /> = distância inclinada até o centro de pressão (<MathTex tex="\text{m}" />); <MathTex tex="h_{\text{cp}}" /> = profundidade vertical do CP (<MathTex tex="\text{m}" />); <MathTex tex="\Delta y = \frac{I_{xx}}{A \cdot Y_{\text{CG}}}" /> = excentricidade abaixo do CG.
            </>
          ),
          application:
            'Define o ponto exato de aplicação do vetor resultante sobre a comporta simulada, essencial para o cálculo correto dos momentos fletores e reações.',
          estimatedHeight: 195,
        },
        {
          number: 5,
          title: 'Braço de Alavanca',
          explanation:
            'O braço de alavanca é a distância perpendicular entre a linha de ação de cada força (empuxo resultante, peso próprio ou tração no tirante) e o eixo da articulação ou apoio.',
          equation: <MathTex display tex="M = F \cdot d_{\perp}" />,
          variables: (
            <>
              <MathTex tex="M" /> = momento estático gerado pela força (<MathTex tex="\text{N}\cdot\text{m}" />); <MathTex tex="F" /> = intensidade da força aplicada (<MathTex tex="\text{N}" />); <MathTex tex="d_{\perp}" /> = braço de alavanca perpendicular ao eixo da dobradiça (<MathTex tex="\text{m}" />).
            </>
          ),
          application:
            'Determina a eficácia geométrica do tirante e a ampliação de momento causada pelo deslocamento do centro de pressão em relação ao pino de giro.',
          estimatedHeight: 185,
        },
        {
          number: 6,
          title: 'Equilíbrio de Momentos e Força de Abertura',
          explanation:
            'Para manter a comporta fechada em equilíbrio estático, o momento resistente produzido pelo tirante (ou batente) deve anular o momento resultante gerado pela pressão hidrostática e pelo peso próprio em torno da articulação.',
          equation: <MathTex display tex="\Sigma M_{\text{articulação}} = 0 \;\Rightarrow\; F_{\text{tirante}} = \frac{|M_{\text{articulação}}|}{d_{\text{tirante}} \cdot \operatorname{sen}(\alpha)}" />,
          variables: (
            <>
              <MathTex tex="\Sigma M_{\text{articulação}}" /> = somatório de momentos no pino (<MathTex tex="\text{N}\cdot\text{m}" />); <MathTex tex="F_{\text{tirante}}" /> = força mínima no cabo/tirante (<MathTex tex="\text{N}" />); <MathTex tex="d_{\text{tirante}}" /> = braço de ancoragem (<MathTex tex="\text{m}" />); <MathTex tex="\alpha" /> = ângulo do tirante.
            </>
          ),
          application:
            'Dimensiona o esforço mínimo necessário no mecanismo de acionamento para conter ou iniciar a abertura da comporta diante da carga hidráulica simulada.',
          estimatedHeight: 195,
        },
      ];
    }

    // barragens
    const isArch = Boolean(dados.analyzedResults?.stabilityData?.isArchDam);
    const barragensBaseConcepts = [
      {
        number: 1,
        title: 'Pressão Hidrostática',
        explanation:
          'A água armazenada no reservatório exerce pressão normal ao paramento de montante (e de jusante, quando houver lâmina d’água), crescendo linearmente conforme a profundidade vertical abaixo do nível livre.',
        equation: <MathTex display tex="p(z) = \gamma \cdot z = \rho \cdot g \cdot z" />,
        variables: (
          <>
            <MathTex tex="p(z)" /> = pressão hidrostática na profundidade <MathTex tex="z" /> (<MathTex tex="\text{Pa}" />); <MathTex tex="\gamma" /> = peso específico do fluido (<MathTex tex="\text{N/m}^3" />); <MathTex tex="z" /> = profundidade em relação à superfície livre (<MathTex tex="\text{m}" />).
          </>
        ),
        application:
          'Estabelece a solicitação unitária em toda a face molhada da barragem, alcançando o valor máximo junto à fundação.',
        estimatedHeight: 185,
      },
      {
        number: 2,
        title: 'Distribuição Triangular de Pressões',
        explanation:
          'Em reservatórios homogêneos, a pressão parte de zero no nível d’água e cresce linearmente até a base, formando um diagrama triangular de tensões com centroide posicionado a um terço da altura molhada a partir da base.',
        equation: <MathTex display tex="p_{\text{máx}} = \gamma \cdot h \quad | \quad y_{\text{cp}} = \frac{h}{3}" />,
        variables: (
          <>
            <MathTex tex="p_{\text{máx}}" /> = pressão na base do reservatório (<MathTex tex="\text{Pa}" />); <MathTex tex="h" /> = altura da lâmina fluida (<MathTex tex="\text{m}" />); <MathTex tex="y_{\text{cp}}" /> = cota de aplicação medida a partir da base (<MathTex tex="\text{m}" />).
          </>
        ),
        application:
          'Quando há camada de sedimentos/lama no fundo, o diagrama torna-se composto (triangular na água e trapezoidal na lama), elevando a solicitação junto ao pé.',
        estimatedHeight: 195,
      },
      {
        number: 3,
        title: 'Força Hidrostática Resultante',
        explanation:
          'Corresponde à área do diagrama de pressões multiplicada por uma faixa unitária de largura da barragem. Em análises bidimensionais por metro linear, sua componente horizontal é o principal carregamento solicitante.',
        equation: <MathTex display tex="F_H = \frac{1}{2} \cdot \gamma \cdot h^2 \quad | \quad F_{H,\text{líq}} = F_{H,\text{mont}} - F_{H,\text{jus}}" />,
        variables: (
          <>
            <MathTex tex="F_H" /> = empuxo horizontal por metro linear (<MathTex tex="\text{N/m}" />); <MathTex tex="h" /> = nível d’água (<MathTex tex="\text{m}" />); <MathTex tex="F_{H,\text{mont}}, F_{H,\text{jus}}" /> = empuxos de montante e jusante (<MathTex tex="\text{N/m}" />).
          </>
        ),
        application:
          'Define o esforço horizontal líquido que tende a deslocar e tombar a barragem para jusante.',
        estimatedHeight: 190,
      },
      {
        number: 4,
        title: 'Peso Próprio da Estrutura',
        explanation:
          'É a força gravitacional devida ao volume de concreto, rocha ou solo da seção transversal por metro linear. Constitui a força vertical estabilizadora fundamental em barragens de gravidade.',
        equation: <MathTex display tex="W = \gamma_{\text{mat}} \cdot A_{\text{seção}} \cdot 1{,}00\text{ m}" />,
        variables: (
          <>
            <MathTex tex="W" /> = peso próprio por metro linear (<MathTex tex="\text{N/m}" />); <MathTex tex="\gamma_{\text{mat}}" /> = peso específico do material da barragem (<MathTex tex="\text{N/m}^3" />); <MathTex tex="A_{\text{seção}}" /> = área da seção transversal (<MathTex tex="\text{m}^2" />).
          </>
        ),
        application:
          'Aumenta diretamente a força normal na fundação e o momento estabilizador em torno do pé de jusante; em contrafortes, considera o fator volumétrico dos contrafortes.',
        estimatedHeight: 190,
      },
      {
        number: 5,
        title: 'Componente Vertical Hidrostática',
        explanation:
          'Sempre que o paramento de montante ou de jusante é inclinado, o empuxo normal à face decompõe-se em parcela horizontal e parcela vertical equivalente ao peso da coluna de fluido apoiada sobre a face.',
        equation: <MathTex display tex="F_V = \gamma \cdot \text{Vol}_{\text{fluido sobre paramento}} = F_R \cdot \cos(\theta)" />,
        variables: (
          <>
            <MathTex tex="F_V" /> = componente vertical hidrostática (<MathTex tex="\text{N/m}" />); <MathTex tex="F_R" /> = força normal ao paramento (<MathTex tex="\text{N/m}" />); <MathTex tex="\theta" /> = ângulo de inclinação do paramento em relação à horizontal.
          </>
        ),
        application:
          'Em paramentos inclinados, auxilia a compressão vertical sobre a base; em paramentos verticais (<MathTex tex="\theta = 90^\circ" />), essa componente é nula.',
        estimatedHeight: 190,
      },
    ];

    if (isArch) {
      barragensBaseConcepts.push({
        number: 6,
        title: 'Efeito de Arco e Transmissão às Ombreiras',
        explanation:
          'Diferentemente das barragens de gravidade, a barragem em arco transfere a maior parte do empuxo hidrostático lateralmente por compressão axial ao longo da curvatura horizontal até os maciços rochosos das ombreiras.',
        equation: <MathTex display tex="N_{\text{arco}} = p_{\text{máx}} \cdot R_{\text{arco}} \quad | \quad \sigma_{\text{arco}} = \frac{N_{\text{arco}}}{B_{\text{base}}}" />,
        variables: (
          <>
            <MathTex tex="N_{\text{arco}}" /> = esforço normal de compressão no arco (<MathTex tex="\text{N/m}" />); <MathTex tex="R_{\text{arco}}" /> = raio de curvatura (<MathTex tex="\text{m}" />); <MathTex tex="\sigma_{\text{arco}}" /> = tensão média de compressão (<MathTex tex="\text{Pa}" />); <MathTex tex="B_{\text{base}}" /> = espessura na base (<MathTex tex="\text{m}" />).
          </>
        ),
        application:
          'Explica por que seções em arco podem ser esbeltas mantendo elevada capacidade resistente, substituindo os critérios 2D convencionais de deslizamento e tombamento.',
        estimatedHeight: 195,
      });
      return barragensBaseConcepts;
    }

    return [
      ...barragensBaseConcepts,
      {
        number: 6,
        title: 'Subpressão na Base',
        explanation:
          'A água pode percolar sob a fundação por fissuras ou poros do maciço, gerando uma pressão ascendente (subpressão) que alivia o peso efetivo na base e reduz a resistência ao atrito e ao tombamento.',
        equation: <MathTex display tex="U = \frac{1}{2} \cdot \gamma \cdot (h_{\text{mont}} + h_{\text{jus}}) \cdot B" />,
        variables: (
          <>
            <MathTex tex="U" /> = força de subpressão por metro linear (<MathTex tex="\text{N/m}" />); <MathTex tex="h_{\text{mont}}, h_{\text{jus}}" /> = cargas hidráulicas a montante e jusante (<MathTex tex="\text{m}" />); <MathTex tex="B" /> = largura da base (<MathTex tex="\text{m}" />).
          </>
        ),
        application: (
          <>
            Quando há drenos ou fundação impermeável, adota-se <MathTex tex="U = 0" />, critério explicitado na simulação atual; em bases permeáveis sem drenagem, <MathTex tex="U" /> reduz <MathTex tex="\Sigma F_V" />.
          </>
        ),
        estimatedHeight: 195,
      },
      {
        number: 7,
        title: 'Segurança ao Deslizamento',
        explanation:
          'Avalia se a resistência por atrito na interface barragem-fundação supera o empuxo horizontal líquido, impedindo o escorregamento translacional da estrutura ao longo da base.',
        equation: <MathTex display tex="FS_{\text{desl}} = \frac{\mu \cdot \Sigma F_V}{|F_{H,\text{líq}}|} \ge 1{,}50" />,
        variables: (
          <>
            <MathTex tex="FS_{\text{desl}}" /> = fator de segurança ao deslizamento; <MathTex tex="\mu" /> = coeficiente de atrito na base; <MathTex tex="\Sigma F_V = W + F_V - U" /> = resultante vertical efetiva (<MathTex tex="\text{N/m}" />); <MathTex tex="F_{H,\text{líq}}" /> = empuxo horizontal líquido (<MathTex tex="\text{N/m}" />).
          </>
        ),
        application:
          'Compara diretamente a resistência disponível na fundação com o empuxo do reservatório simulado frente ao limite mínimo usual de projeto.',
        estimatedHeight: 190,
      },
      {
        number: 8,
        title: 'Segurança ao Tombamento',
        explanation:
          'Verifica a estabilidade rotacional da barragem em torno do pé de jusante, comparando os momentos restauradores do peso próprio e da componente vertical hidrostática com o momento tombante do empuxo horizontal.',
        equation: <MathTex display tex="FS_{\text{tomb}} = \frac{M_{\text{est}}}{M_{\text{tomb}}} \ge 1{,}50" />,
        variables: (
          <>
            <MathTex tex="FS_{\text{tomb}}" /> = fator de segurança ao tombamento; <MathTex tex="M_{\text{est}}" /> = soma dos momentos estabilizadores em relação ao pé de jusante (<MathTex tex="\text{N}\cdot\text{m/m}" />); <MathTex tex="M_{\text{tomb}}" /> = momento tombante (<MathTex tex="\text{N}\cdot\text{m/m}" />).
          </>
        ),
        application:
          'Assegura margem contra rotação e controla a excentricidade da resultante na base, evitando tensões de tração excessivas no contato com a fundação.',
        estimatedHeight: 195,
      },
    ];
  };

  const rootRef = React.useRef(null);
  const measurePassesRef = React.useRef(0);
  const [measuredMetrics, setMeasuredMetrics] = React.useState(null);

  const memorialSteps = buildMemorialSteps();
  const theoryConcepts = buildTheoryConcepts();

  const contentPages = paginarConteudoContinuo({
    memorialSteps,
    theoryConcepts,
    measuredHeights: measuredMetrics?.heights || {},
    pageBudget: measuredMetrics?.pageBudget || 932,
  });

  const currentSignature = signatureOfPages(contentPages);

  React.useLayoutEffect(() => {
    if (typeof window === 'undefined' || !rootRef.current) return undefined;

    let cancelled = false;

    const recalibrateFromDom = () => {
      if (cancelled || !rootRef.current || measurePassesRef.current >= 4) return;
      const rootEl = rootRef.current;

      const mainEl = rootEl.querySelector('[data-measure-main="true"]');
      let pageBudget = 932;
      if (mainEl) {
        const cs = window.getComputedStyle(mainEl);
        const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
        const innerH = mainEl.getBoundingClientRect().height - padY;
        if (innerH > 400) {
          pageBudget = Math.floor(innerH - 14);
        }
      }

      const heights = {};
      rootEl.querySelectorAll('[data-measure-id]').forEach((el) => {
        const key = el.getAttribute('data-measure-id');
        if (key) {
          heights[key] = Math.ceil(el.getBoundingClientRect().height);
        }
      });

      const memHeader = rootEl.querySelector('[data-measure-header="memorial"]');
      if (memHeader) {
        heights['header-memorial'] = Math.ceil(memHeader.getBoundingClientRect().height) + 8;
      }
      const theoryHeader = rootEl.querySelector('[data-measure-header="theory"]');
      if (theoryHeader) {
        heights['header-theory'] = Math.ceil(theoryHeader.getBoundingClientRect().height) + 8;
      }

      const nextPages = paginarConteudoContinuo({
        memorialSteps,
        theoryConcepts,
        measuredHeights: heights,
        pageBudget,
      });

      if (signatureOfPages(nextPages) !== currentSignature) {
        measurePassesRef.current += 1;
        setMeasuredMetrics({ heights, pageBudget });
      }
    };

    recalibrateFromDom();

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) {
          requestAnimationFrame(recalibrateFromDom);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [currentSignature]);

  return (
    <div id="relatorio-eureka" ref={rootRef} className="flex flex-col gap-[16px]">
      <style>{`
        .eureka-math .katex {
          line-height: 1.25;
          color: inherit;
        }
        .eureka-math-inline .katex {
          font-size: 1.07em;
        }
        .eureka-math-display .katex {
          font-size: 1.14em;
        }
        .eureka-math .katex-display {
          margin: 0;
        }
        .eureka-math .katex .frac-line {
          min-height: 1px;
          border-bottom-width: max(1px, 0.055em) !important;
        }
      `}</style>

      {/* ── PÁGINA 1: VISÃO GERAL DA SIMULAÇÃO ── */}
      <div
        className="pdf-page mx-auto flex flex-col overflow-hidden font-sans text-[#27446f]"
        style={{
          width: '794px',
          height: '1123px',
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #f8fbff 0%, #f5faff 58%, #edf7ff 100%)',
        }}
      >
        <ReportHeader
          subtitle="MATERIAL DE ESTUDO — Hidrostática e Empuxo"
          dataText={dataText}
          documentKindText="Material gerado automaticamente"
        />

        <main className="flex flex-1 flex-col px-[26px] pb-[10px] pt-[12px]">
          <InfoGeralCard />

          <section className="mt-[10px] shrink-0">
            <h2 className="m-0 mb-[4px] text-[15.5px] font-black uppercase text-[#1057cc]">
              1. DESCRIÇÃO DO PROBLEMA
            </h2>
            <p className="m-0 text-[11.8px] font-medium leading-[1.5] text-[#3b557c]">
              {renderDescricaoProblema(simulacao, dados, enunciado)}
            </p>
          </section>

          <div className="mt-[10px] grid min-h-[270px] h-auto shrink-0 grid-cols-[1.06fr_1.04fr] items-stretch gap-[14px]">
            <Card className="flex flex-col p-[11px]">
              <SectionTitle icon={Cuboid}>Visualização da Simulação</SectionTitle>
              <SimulationImageBox
                src={imagemSimulacao}
                alt="Visualização da simulação"
                heightClass="flex-1 min-h-[212px]"
              />
            </Card>

            <Card className="flex flex-col p-[11px]" allowOverflow>
              <SectionTitle icon={ListChecks}>Dados da Simulação</SectionTitle>
              {useTwoColumnDataGrid ? (
                <div className="grid grid-cols-2 gap-[5px]">
                  {dataRows.map((row, index) => (
                    <CompactDataTile
                      key={`m-p1-${index}`}
                      label={renderDataRowLabelEureka(row.label, index)}
                      value={formatarUnidadeTexto(row.value)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-[3px]">
                  {dataRows.map((row, index) => (
                    <DataRow
                      key={`m-p1-${index}`}
                      label={renderDataRowLabelEureka(row.label, index)}
                      value={formatarUnidadeTexto(row.value)}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="mt-[10px] grid flex-1 grid-cols-2 items-stretch gap-[14px]">
            <Card className="flex flex-col p-[11px]">
              <SectionTitle icon={Zap} number="2">
                Equações e Conceitos Aplicados
              </SectionTitle>

              <div className="flex flex-1 flex-col justify-center space-y-[5px]">
                {dados.tipo === 'corpos-imersos' && (
                  <>
                    <FormulaRow label={<>Peso Real (<MathTex tex="P" />):</>}>
                      <MathTex tex="P = \rho_o \cdot g \cdot V_{\text{total}}" />
                    </FormulaRow>
                    <FormulaRow label={<>Empuxo (<MathTex tex="E" />):</>}>
                      <MathTex tex="E = \rho_f \cdot g \cdot V_{\text{sub}}" />
                    </FormulaRow>
                    <FormulaRow label={<>Peso Aparente (<MathTex tex="P_{\text{ap}}" />):</>}>
                      <MathTex tex="P_{\text{ap}} = \max(0,\; P - E)" />
                    </FormulaRow>
                  </>
                )}
                {dados.tipo === 'comportas' && (
                  <>
                    <FormulaRow label="Pressão no CG:">
                      <MathTex tex="p_{\text{cg}} = \gamma \cdot h_{\text{cg}}" />
                    </FormulaRow>
                    <FormulaRow label="Força Resultante:">
                      <MathTex tex="F_R = \gamma \cdot h_{\text{cg}} \cdot A" />
                    </FormulaRow>
                    <FormulaRow label="Centro de Pressão:">
                      <MathTex tex="Y_{\text{CP}} = Y_{\text{CG}} + \frac{I_{xx}}{A \cdot Y_{\text{CG}}}" />
                    </FormulaRow>
                  </>
                )}
                {dados.tipo === 'barragens' && (
                  <>
                    <FormulaRow label={<>Peso Próprio (<MathTex tex="W" />):</>}>
                      <MathTex tex="W = \gamma_{\text{mat}} \cdot A_{\text{seção}} \cdot 1\text{ m}" />
                    </FormulaRow>
                    <FormulaRow label={<>Empuxo Horiz. (<MathTex tex="F_H" />):</>}>
                      <MathTex tex="F_H = \frac{1}{2} \cdot \gamma \cdot h^2" />
                    </FormulaRow>
                    {dados.analyzedResults?.stabilityData?.isArchDam ? (
                      <FormulaRow label="Efeito de Arco:">
                        <MathTex tex="N_{\text{arco}} = p_{\text{máx}} \cdot R_{\text{arco}}" />
                      </FormulaRow>
                    ) : (
                      <FormulaRow label={<>Segurança (<MathTex tex="FS" />):</>}>
                        <MathTex tex="FS_{\text{desl}} = \frac{\mu \Sigma F_V}{|F_H|} \;\;|\;\; FS_{\text{tomb}} = \frac{M_{\text{est}}}{M_{\text{tomb}}}" />
                      </FormulaRow>
                    )}
                  </>
                )}
              </div>
            </Card>

            <Card className="flex flex-col p-[11px]">
              <SectionTitle icon={BarChart3} number="3">
                Resultados Obtidos
              </SectionTitle>

              <div className="flex flex-1 flex-col justify-center space-y-[4px]">
                {dados.tipo === 'corpos-imersos' && (
                  <>
                    <ResultRow
                      label={<>Peso Real (<MathTex tex="P" />):</>}
                      value={<MathTex tex={`${texNum(fmtBr(pesoNGlobal))}\\text{ N}`} />}
                      tone="red"
                    />
                    <ResultRow
                      label={<>Empuxo (<MathTex tex="E" />):</>}
                      value={<MathTex tex={`${texNum(fmtBr(empuxoNGlobal))}\\text{ N}`} />}
                      tone="green"
                    />
                    <ResultRow
                      label={<>Peso Aparente (<MathTex tex="P_{\text{ap}}" />):</>}
                      value={<MathTex tex={`${texNum(fmtBr(dados.pesoAparenteNum))}\\text{ N}`} />}
                      tone="blue"
                    />
                    <div className="flex min-h-[36px] items-center justify-between gap-[8px] rounded-[8px] bg-[#fbf7ff] px-[10px] py-[4px]">
                      <span className="text-[10.5px] font-medium leading-tight text-[#6d82a7]">
                        Condição:
                      </span>
                      <div className="flex items-center gap-[8px]">
                        <span
                          className="flex items-center justify-center rounded-full px-[12px] py-[3px] text-[10px] font-black leading-none"
                          style={{ background: statusColor.bg, color: statusColor.color }}
                        >
                          {statusLabel}
                        </span>
                        <span className="text-[10.5px] font-bold leading-none text-[#4f6587]">
                          (<MathTex tex={relCondTex} />)
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {dados.tipo === 'comportas' && (
                  <>
                    <ResultRow
                      label={<>Força Resultante (<MathTex tex="F_R" />):</>}
                      value={
                        dados.analyzedResults
                          ? <MathTex tex={`${texNum(fmtBr(Math.abs(dados.analyzedResults.forceData.FR_net) / 1000))}\\text{ kN}`} />
                          : <MathTex tex="0{,}00\text{ kN}" />
                      }
                      tone="green"
                    />
                    <ResultRow
                      label={<>Posição (<MathTex tex="s_{\text{cp}}" />):</>}
                      value={
                        dados.analyzedResults
                          ? <MathTex tex={`${texNum(fmtBr(dados.analyzedResults.forceData.s_cp_net))}\\text{ m}`} />
                          : <MathTex tex="0{,}00\text{ m}" />
                      }
                      tone="blue"
                    />
                    <ResultRow
                      label={<>Força no Tirante (<MathTex tex="F_{\text{tirante}}" />):</>}
                      value={
                        dados.analyzedResults?.equilibrium
                          ? <MathTex tex={`${texNum(fmtBr(Math.abs(dados.analyzedResults.equilibrium.F_tie) / 1000))}\\text{ kN}`} />
                          : '-'
                      }
                      tone="red"
                    />
                  </>
                )}
                {dados.tipo === 'barragens' && (() => {
                  const arDam = dados.analyzedResults;
                  const stDam = arDam?.stabilityData;
                  const fdDam = arDam?.forceData;
                  const niDam = arDam?.normalizedInputs || {};
                  const isDamKgf = niDam.unitSystem === 'TECNICO_KGF';
                  const damG = niDam.gravity || 9.81;
                  const fmtDamF = (valN) => (isDamKgf ? fmtBr(valN / damG, 1, 1) : fmtBr(valN / 1000, 2, 2));
                  const unitDamFTex = isDamKgf ? '\\text{kgf/m}' : '\\text{kN/m}';

                  return (
                    <>
                      <ResultRow
                        label={<>Força Resultante (<MathTex tex="F_R" />):</>}
                        value={
                          fdDam
                            ? <MathTex tex={`${texNum(fmtDamF(Math.abs(fdDam.FR_net)))}\\;${unitDamFTex}`} />
                            : <MathTex tex={`0{,}00\\;${unitDamFTex}`} />
                        }
                        tone="green"
                      />
                      <ResultRow
                        label={<>Posição (<MathTex tex="y_{\text{cp}}" />):</>}
                        value={
                          fdDam
                            ? <MathTex tex={`${texNum(fmtBr(fdDam.y_cp_net))}\\text{ m}`} />
                            : <MathTex tex="0{,}00\text{ m}" />
                        }
                        tone="blue"
                      />
                      <ResultRow
                        label={<>Peso Próprio (<MathTex tex="W" />):</>}
                        value={
                          stDam
                            ? <MathTex tex={`${texNum(fmtDamF(stDam.weight))}\\;${unitDamFTex}`} />
                            : <MathTex tex={`0{,}00\\;${unitDamFTex}`} />
                        }
                        tone="blue"
                      />

                      {stDam?.isArchDam ? (
                        <>
                          <ResultRow
                            label={<>Esforço no Arco (<MathTex tex="N_{\text{arco}}" />):</>}
                            value={<MathTex tex={`${texNum(fmtDamF(stDam.archThrust || 0))}\\;${unitDamFTex}`} />}
                            tone="blue"
                          />
                          <ResultRow
                            label={<>Tensão Média Base (<MathTex tex="\sigma_{\text{arco}}" />):</>}
                            value={<MathTex tex={`${texNum(fmtBr((stDam.archStressBase || 0) / 1e6))}\\text{ MPa}`} />}
                            tone="green"
                          />
                          <div className="mt-[2px] rounded-[8px] border border-[#d6e5f8] bg-[#f8fbff] px-[9px] py-[6px]">
                            <div className="flex items-center gap-[5px]">
                              <ShieldCheck size={12} strokeWidth={2.5} className="shrink-0 text-[#1f6fff]" />
                              <span className="text-[9px] font-black uppercase tracking-[0.55px] text-[#1e3e72]">
                                Verificações de Estabilidade
                              </span>
                            </div>
                            <p className="m-0 mt-[3px] text-[8.8px] font-medium leading-[1.35] text-[#4a638b]">
                              Verificações 2D de deslizamento e tombamento não se aplicam a barragens em arco (transferência por compressão às ombreiras).
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="mt-[2px] rounded-[9px] border border-[#d6e5f8] bg-[#f8fbff] p-[7px]">
                          <div className="mb-[5px] flex items-center justify-between gap-[6px]">
                            <div className="flex items-center gap-[5px]">
                              <ShieldCheck size={12} strokeWidth={2.5} className="shrink-0 text-[#1f6fff]" />
                              <span className="text-[9.2px] font-black uppercase tracking-[0.55px] text-[#1e3e72]">
                                Verificações de Estabilidade
                              </span>
                            </div>
                          </div>

                          <div className="space-y-[4.5px]">
                            <StabilityVerificationRow
                              label={<>Fator de Segurança ao Deslizamento (<MathTex tex="FS_{\text{desl}}" />)</>}
                              fsValue={stDam?.fs_desl}
                              hasValue={Boolean(stDam)}
                              minCriterion={1.5}
                              criterionTex="FS \ge 1{,}50"
                            />
                            <StabilityVerificationRow
                              label={<>Fator de Segurança ao Tombamento (<MathTex tex="FS_{\text{tomb}}" />)</>}
                              fsValue={stDam?.fs_tomb}
                              hasValue={Boolean(stDam)}
                              minCriterion={1.5}
                              criterionTex="FS \ge 1{,}50"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </Card>
          </div>

          <Card className="mt-[10px] shrink-0 px-[12px] py-[9px]">
            <SectionTitle icon={ShieldCheck} number="4">
              Análise Qualitativa
            </SectionTitle>
            <div className="flex min-h-[36px] items-center justify-center rounded-[8px] bg-[#f8fbff] px-[12px] py-[7px] text-center text-[10.5px] font-medium leading-[1.45] text-[#3b557c]">
              {analiseQualitativa()}
            </div>
          </Card>
        </main>

        <ReportFooter heightClass="h-[54px]" />
      </div>

      {/* ── PÁGINAS 2+: MEMORIAL DE CÁLCULO E RESUMO TEÓRICO (FLUXO CONTÍNUO SEM QUEBRA FORÇADA) ── */}
      {contentPages.map((pageData, pageIndex) => {
        const hasMem = Boolean(pageData.memorial);
        const hasTheory = Boolean(pageData.theory);

        let headerSubtitle = 'MATERIAL DE ESTUDO — Resumo Teórico';
        if (hasMem && hasTheory) {
          headerSubtitle = pageData.memorial.isContinuation
            ? 'MATERIAL DE ESTUDO — Memorial (Continuação) e Resumo Teórico'
            : 'MATERIAL DE ESTUDO — Memorial de Cálculo e Resumo Teórico';
        } else if (hasMem) {
          headerSubtitle = pageData.memorial.isContinuation
            ? 'MATERIAL DE ESTUDO — Memorial de Cálculo (Continuação)'
            : 'MATERIAL DE ESTUDO — Memorial de Cálculo';
        } else if (hasTheory) {
          headerSubtitle = pageData.theory.isContinuation
            ? 'MATERIAL DE ESTUDO — Resumo Teórico (Continuação)'
            : 'MATERIAL DE ESTUDO — Resumo Teórico';
        }

        const moduloSubtitulo =
          dados.tipo === 'corpos-imersos'
            ? 'Corpos Imersos (Princípio de Arquimedes)'
            : dados.tipo === 'comportas'
              ? 'Pressão em Comportas Planas'
              : 'Estabilidade de Barragens';

        return (
          <div
            key={`content-page-${pageIndex}`}
            className="pdf-page mx-auto flex flex-col overflow-hidden font-sans text-[#27446f]"
            style={{
              width: '794px',
              height: '1123px',
              boxSizing: 'border-box',
              background: 'linear-gradient(180deg, #f8fbff 0%, #f5faff 58%, #edf7ff 100%)',
            }}
          >
            <ReportHeader
              subtitle={headerSubtitle}
              dataText={dataText}
              documentKindText="Material gerado automaticamente"
            />

            <main
              data-measure-main="true"
              className="flex flex-1 flex-col px-[26px] pb-[10px] pt-[12px]"
            >
              {hasMem && (
                <section className="flex shrink-0 flex-col">
                  <div
                    data-measure-header="memorial"
                    className="mb-[8px] flex shrink-0 items-center justify-between border-b-2 border-[#1f6fff] pb-[6px]"
                  >
                    <div className="flex items-center gap-[9px]">
                      <span className="flex h-[24px] w-[24px] items-center justify-center rounded-[7px] bg-[#1f6fff] text-white">
                        <Calculator size={14} strokeWidth={2.5} />
                      </span>
                      <div>
                        <h2 className="m-0 text-[14.5px] font-black uppercase tracking-[0.6px] text-[#1057cc]">
                          {pageData.memorial.isContinuation
                            ? 'MEMORIAL DE CÁLCULO (CONTINUAÇÃO)'
                            : 'MEMORIAL DE CÁLCULO'}
                        </h2>
                        <p className="m-0 text-[9.8px] font-semibold text-[#5b759b]">
                          Desenvolvimento técnico e numérico — {dados.geometriaNome}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-[6px] border border-[#d6e5f8] bg-white px-[10px] py-[3.5px] text-[9.5px] font-bold text-[#3f5b87]">
                      {dados.tipo === 'barragens' ? (
                        <>Base: <MathTex tex="1{,}00\text{ m}" /> linear | <MathTex tex="g = 9{,}81\text{ m/s}^2" /></>
                      ) : (
                        <MathTex tex="g = 9{,}81\text{ m/s}^2" />
                      )}
                    </span>
                  </div>

                  {pageData.memorial.showUnanalyzedNotice ? (
                    <Card className="flex shrink-0 items-center justify-center p-[18px]">
                      <div
                        data-measure-id="memorial-unanalyzed"
                        className="max-w-[580px] rounded-[10px] border border-[#dce8f6] bg-[#fbfdff] p-[16px] text-center text-[11.5px] font-medium leading-[1.55] text-[#4a638b]"
                      >
                        Esta simulação ainda não teve a análise executada. Clique em{' '}
                        <strong className="font-black text-[#2563eb]">ANALISAR</strong> no laboratório e exporte novamente o Material de Estudo para gerar o memorial completo com todos os cálculos e verificações.
                      </div>
                    </Card>
                  ) : (
                    <Card className="flex shrink-0 flex-col px-[18px] py-[4px]">
                      {pageData.memorial.steps.map((step, idx) => (
                        <MemorialStepBlock
                          key={`step-${step.number}`}
                          step={step}
                          measureId={`memorial-step-${step.number}`}
                          isLast={idx === pageData.memorial.steps.length - 1}
                        />
                      ))}
                    </Card>
                  )}
                </section>
              )}

              {hasTheory && (
                <section className={`flex shrink-0 flex-col ${hasMem ? 'mt-[10px]' : ''}`}>
                  <div
                    data-measure-header="theory"
                    className="mb-[8px] flex shrink-0 items-center justify-between border-b-2 border-[#1f6fff] pb-[6px]"
                  >
                    <div className="flex items-center gap-[9px]">
                      <span className="flex h-[24px] w-[24px] items-center justify-center rounded-[7px] bg-[#1f6fff] text-white">
                        <BookOpen size={14} strokeWidth={2.5} />
                      </span>
                      <div>
                        <h2 className="m-0 text-[14px] font-black uppercase tracking-[0.5px] text-[#1057cc]">
                          {pageData.theory.isContinuation
                            ? 'RESUMO TEÓRICO (CONTINUAÇÃO)'
                            : 'RESUMO TEÓRICO — FUNDAMENTOS DE HIDROSTÁTICA E EMPUXO'}
                        </h2>
                        <p className="m-0 text-[9.8px] font-semibold text-[#5b759b]">
                          Síntese conceitual aplicada — {moduloSubtitulo}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-[8px]">
                    {pageData.theory.concepts.map((concept) => (
                      <TheoryConceptCard
                        key={`theory-${concept.number}`}
                        concept={concept}
                        measureId={`theory-card-${concept.number}`}
                      />
                    ))}
                  </div>
                </section>
              )}
            </main>

            <ReportFooter heightClass="h-[54px]" />
          </div>
        );
      })}
    </div>
  );
};