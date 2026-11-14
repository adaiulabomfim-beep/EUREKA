import React from 'react';
import { ResultsPanel, ResultsCard } from '../../../../interface/PainelResultados';
import {
  Calculator,
  ArrowDown,
  MoveVertical,
  RotateCw,
  Maximize,
  Droplets,
  Compass,
  DoorOpen,
  DoorClosed,
  Waves,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Gauge,
} from 'lucide-react';
import {
  EstadoOperacionalComporta,
  PosicaoDobradica,
  SistemaUnidades,
} from '../dominio/tipos';
import {
  CondicaoOperacionalResultado,
  ResultadoSimulacaoComporta,
} from '../dominio/resultado';

interface PainelResultadosProps {
  analyzedResults: ResultadoSimulacaoComporta | null;
  liveOperacao?: CondicaoOperacionalResultado;
  showDetails: boolean;
  setShowDetails: (val: boolean) => void;
  hingePosition: PosicaoDobradica;
  hasTieRod: boolean;
  hasSmoothWallSupport?: boolean;
  hasSmoothFloorSupport?: boolean;
  hasVerticalWallHingeA?: boolean;
}

const SectionLabel: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="pt-2 first:pt-0 pb-1 border-b border-slate-100 dark:border-slate-800">
    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
      {title}
    </div>
    {subtitle && (
      <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
        {subtitle}
      </div>
    )}
  </div>
);

export const PainelResultados: React.FC<PainelResultadosProps> = ({
  analyzedResults,
  liveOperacao,
  showDetails,
  setShowDetails,
  hingePosition,
  hasTieRod,
  hasSmoothWallSupport = false,
  hasSmoothFloorSupport = false,
  hasVerticalWallHingeA = false,
}) => {
  const isFloorSupport = Boolean(hasSmoothFloorSupport || analyzedResults?.equilibrium?.apoioFundoAtivo);
  const isCentralAxis = Boolean(
    hingePosition === PosicaoDobradica.CENTER || analyzedResults?.equilibrium?.eixoCentralAtivo
  );
  const isVerticalWallHingeA = Boolean(
    hasVerticalWallHingeA || analyzedResults?.equilibrium?.articulacaoParedeVerticalA
  );
  const isKgf = analyzedResults?.sistemaUnidades === SistemaUnidades.TECNICO_KGF;
  const g = 9.81;

  const operacao = analyzedResults?.operacao ?? liveOperacao;
  const hidraulica = analyzedResults?.hidraulica;

  const estado = operacao?.estado ?? EstadoOperacionalComporta.FECHADA;
  const isFechada = estado === EstadoOperacionalComporta.FECHADA;
  const isParcial = estado === EstadoOperacionalComporta.PARCIALMENTE_ABERTA;
  const isAberta = estado === EstadoOperacionalComporta.ABERTA;

  const opHighlightTheme = isFechada ? 'blue' : isParcial ? 'amber' : 'green';
  const OpIcon = isFechada ? DoorClosed : DoorOpen;

  let forceVal = '???';
  let forceUnit = '';
  let forceSec = '';

  if (analyzedResults) {
    const F_N = Math.abs(analyzedResults.forceData.FR_net);
    if (isKgf) {
      forceVal = Math.round(F_N / g).toLocaleString('pt-BR');
      forceUnit = 'kgf';
      forceSec = `${(F_N / 1000).toFixed(2)} kN`;
    } else {
      forceVal = (F_N / 1000).toFixed(2);
      forceUnit = 'kN';
      forceSec = `${Math.round(F_N / g).toLocaleString('pt-BR')} kgf`;
    }
    if (isAberta) {
      forceSec = `${forceSec} | Ref. seção fechada`;
    } else if (isParcial) {
      forceSec = `${forceSec} | Ref. nominal da seção`;
    }
  } else {
    forceSec = 'Clique em Analisar para calcular';
  }

  return (
    <div id="tour-resultados" data-tour="painel-resultados" className="lg:col-span-3 flex flex-col gap-4 h-[600px] lg:h-full lg:max-h-full min-h-0 overflow-hidden">
      <ResultsPanel
        footerButton={{
          label: showDetails ? 'Ocultar Memorial' : 'Memorial',
          onClick: () => setShowDetails(!showDetails),
          icon: Calculator,
          disabled: !analyzedResults,
        }}
      >
        <>
          {/* 1. CONDIÇÃO OPERACIONAL DA COMPORTA */}
          <SectionLabel title="Condição Operacional da Comporta" />

          <ResultsCard
            highlight
            highlightTheme={opHighlightTheme}
            title="Estado da Comporta"
            value={operacao?.estadoLabel ?? 'Fechada'}
            leftIcon={OpIcon}
            secondaryValue={
              operacao
                ? `Abertura: ${operacao.grauAberturaPercent}% | Altura livre: ${operacao.alturaLivreVertical.toFixed(2)} m`
                : 'Abertura: 0% | Altura livre: 0.00 m'
            }
          />

          {operacao && (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold uppercase text-[9px] tracking-wider text-slate-400 dark:text-slate-400">
                  Passagem de água
                </span>
                <span
                  className={`font-bold text-right ${
                    isFechada
                      ? 'text-blue-700 dark:text-blue-300'
                      : isParcial
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {operacao.condicaoPassagem}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-bold uppercase text-[9px] tracking-wider text-slate-400 dark:text-slate-400">
                  Sentido do escoamento
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 text-right">
                  {operacao.passagemAgua && <ArrowRight className="w-3 h-3 text-cyan-600 shrink-0" />}
                  {operacao.sentidoEscoamento}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                {analyzedResults
                  ? operacao.interpretacaoAutomatica
                  : 'Estado operacional selecionado. Clique em Analisar para atualizar os cálculos e o diagnóstico hidráulico.'}
              </div>
            </div>
          )}

          {/* DESTAQUE PARA PROBLEMA 2.61 / APOIO EM FUNDO LISO (R_B = 0) */}
          {isFloorSupport && (
            <ResultsCard
              highlight
              highlightTheme={
                !analyzedResults
                  ? 'blue'
                  : Math.abs(analyzedResults.equilibrium?.R_B ?? 0) < 1e-2
                  ? 'green'
                  : 'amber'
              }
              title="Profundidade da Água para R_B = 0 (h)"
              value={
                analyzedResults?.equilibrium?.h_jusante_eq !== undefined
                  ? `${analyzedResults.equilibrium.h_jusante_eq.toFixed(3).replace('.', ',')} m`
                  : '???'
              }
              leftIcon={Waves}
              secondaryValue={
                analyzedResults
                  ? Math.abs(analyzedResults.equilibrium?.R_B ?? 0) < 1e-2
                    ? 'Condição limite atingida: R_B = 0 (perda de contato em B)'
                    : `Nível atual: ${(analyzedResults.hidraulica?.nivelJusanteEfetivo ?? 0).toFixed(3).replace('.', ',')} m | R_B ≠ 0`
                  : 'Clique em Analisar para determinar h'
              }
            />
          )}

          {/* 2. RESULTADOS HIDROSTÁTICOS */}
          <SectionLabel
            title={
              isCentralAxis
                ? 'A. Força Hidrostática'
                : isVerticalWallHingeA
                ? 'A. Propriedades Geométricas'
                : 'A. Resultados Hidrostáticos'
            }
            subtitle={
              isCentralAxis
                ? 'Item (a): Módulo e ponto de aplicação da força resultante na comporta circular'
                : isVerticalWallHingeA
                ? 'Área, centroide, pressão média e momento de inércia da comporta plana inclinada'
                : analyzedResults && !isFechada
                ? isAberta
                  ? 'Valores de referência da seção fechada (comporta aberta no momento)'
                  : `Referência hidrostática nominal (${100 - (operacao?.grauAberturaPercent ?? 0)}% da seção obstruída)`
                : undefined
            }
          />

          {isVerticalWallHingeA ? (
            <>
              <ResultsCard
                title="Área da Comporta (A)"
                value={
                  analyzedResults
                    ? analyzedResults.forceData.up.area.toFixed(2).replace('.', ',')
                    : '???'
                }
                unit={analyzedResults ? 'm²' : ''}
                secondaryValue="A = w · L"
                theme="slate"
                leftIcon={Maximize}
              />

              <ResultsCard
                title={<>Profundidade do Centroide (h<sub>c</sub>)</>}
                value={
                  analyzedResults?.forceData?.up?.h_cg !== undefined
                    ? analyzedResults.forceData.up.h_cg.toFixed(2).replace('.', ',')
                    : '???'
                }
                unit={analyzedResults ? 'm' : ''}
                secondaryValue={
                  analyzedResults?.forceData?.up?.Y_CG !== undefined
                    ? `y_c (inclinado) = ${analyzedResults.forceData.up.Y_CG.toFixed(2).replace('.', ',')} m | h_c = D + (L/2)·sen(θ)`
                    : 'h_c = D + (L/2)·sen(θ)'
                }
                theme="slate"
                leftIcon={MoveVertical}
              />

              <ResultsCard
                title={<>Pressão no Centroide (p<sub>c</sub>)</>}
                value={
                  analyzedResults?.forceData?.up?.p_cg !== undefined
                    ? isKgf
                      ? Math.round(analyzedResults.forceData.up.p_cg / g).toLocaleString('pt-BR')
                      : (analyzedResults.forceData.up.p_cg / 1000).toFixed(2).replace('.', ',')
                    : '???'
                }
                unit={analyzedResults ? (isKgf ? 'kgf/m²' : 'kPa') : ''}
                secondaryValue="p_c = γ · h_c (pressão atmosférica se anula nas duas faces)"
                theme="blue"
                leftIcon={Gauge}
              />

              <ResultsCard
                title={<>Momento de Inércia (I<sub>G</sub>)</>}
                value={
                  analyzedResults?.forceData?.up?.Ixx !== undefined
                    ? analyzedResults.forceData.up.Ixx.toFixed(4).replace('.', ',')
                    : '???'
                }
                unit={analyzedResults ? 'm⁴' : ''}
                secondaryValue="I_G = w · L³ / 12"
                theme="slate"
                leftIcon={Calculator}
              />

              <SectionLabel
                title="B. Força Hidrostática e Centro de Pressão"
                subtitle="Módulo da força resultante F_R e localização exata do CP"
              />

              <ResultsCard
                highlight
                highlightTheme="blue"
                title="Força Hidrostática Resultante (F_R)"
                value={isKgf ? forceVal : forceVal.replace('.', ',')}
                unit={forceUnit}
                secondaryValue={
                  analyzedResults
                    ? `${forceSec} | F_R = γ · h_c · A (perpendicular à comporta)`
                    : forceSec
                }
                badge={analyzedResults ? 'RESULTANTE' : undefined}
                leftIcon={Droplets}
              />

              <ResultsCard
                title={<>Profundidade Vertical do CP (h<sub>CP</sub>)</>}
                value={
                  analyzedResults?.forceData?.up?.h_cp !== undefined
                    ? analyzedResults.forceData.up.h_cp.toFixed(3).replace('.', ',')
                    : '???'
                }
                unit={analyzedResults ? 'm' : ''}
                secondaryValue={
                  analyzedResults?.forceData?.up?.h_cp !== undefined
                    ? `h_CP = h_c + (I_G · sen²θ)/(h_c · A) > h_c (${analyzedResults.forceData.up.h_cg.toFixed(2).replace('.', ',')} m)`
                    : 'Profundidade vertical do centro de pressão'
                }
                theme="cyan"
                leftIcon={MoveVertical}
              />

              <ResultsCard
                title={<>Distância Inclinada do CP à Superfície Livre (y<sub>CP</sub>)</>}
                value={
                  analyzedResults?.forceData?.up?.Y_CP !== undefined
                    ? analyzedResults.forceData.up.Y_CP.toFixed(3).replace('.', ',')
                    : '???'
                }
                unit={analyzedResults ? 'm' : ''}
                secondaryValue={
                  analyzedResults?.forceData?.up?.Y_CP !== undefined
                    ? `y_CP = h_CP / sen(θ) = y_c + Δy > y_c (${analyzedResults.forceData.up.Y_CG.toFixed(2).replace('.', ',')} m)`
                    : 'Medida ao longo do plano inclinado a partir da superfície livre'
                }
                theme="cyan"
                leftIcon={Compass}
              />

              <ResultsCard
                title={<>Distância entre CG e CP (Δy = y<sub>CP</sub> − y<sub>c</sub>)</>}
                value={
                  analyzedResults?.forceData?.up?.delta_y !== undefined
                    ? analyzedResults.forceData.up.delta_y.toFixed(3).replace('.', ',')
                    : '???'
                }
                unit={analyzedResults ? 'm' : ''}
                secondaryValue={
                  analyzedResults?.forceData?.up?.delta_y !== undefined
                    ? `${(analyzedResults.forceData.up.delta_y * 100).toFixed(2).replace('.', ',')} cm abaixo do centroide (I_G / (y_c · A))`
                    : 'Excentricidade entre o centroide e o centro de pressão'
                }
                theme="purple"
                leftIcon={MoveVertical}
              />

              <ResultsCard
                title={<>Distância entre Articulação A e CP (y<sub>CP,A</sub>)</>}
                value={
                  analyzedResults?.forceData?.up?.s_cp !== undefined
                    ? analyzedResults.forceData.up.s_cp.toFixed(3).replace('.', ',')
                    : '???'
                }
                unit={analyzedResults ? 'm' : ''}
                secondaryValue={
                  analyzedResults?.forceData?.up?.s_cp !== undefined
                    ? `y_CP,A = L/2 + Δy = ${(analyzedResults.forceData.up.s_cg ?? 2).toFixed(3).replace('.', ',')} + ${(analyzedResults.forceData.up.delta_y ?? 0).toFixed(3).replace('.', ',')} m a partir de A`
                    : 'Posição do CP medida ao longo da comporta a partir de A'
                }
                theme="amber"
                leftIcon={Compass}
              />
            </>
          ) : isCentralAxis ? (
            <>
              <ResultsCard
                highlight
                highlightTheme="blue"
                title="Força Hidrostática Resultante (F_R)"
                value={forceVal}
                unit={forceUnit}
                secondaryValue={forceSec}
                badge="ITEM (a)"
                leftIcon={Droplets}
              />

              <ResultsCard
                title="Área da Comporta Circular (A)"
                value={analyzedResults ? analyzedResults.forceData.up.area.toFixed(4) : '???'}
                unit={analyzedResults ? 'm²' : ''}
                secondaryValue="A = π·D² / 4 = π·R²"
                theme="slate"
                leftIcon={Maximize}
              />

              <ResultsCard
                title={<>Profundidade do Centroide / Eixo (h<sub>c</sub>)</>}
                value={analyzedResults?.forceData?.up?.h_cg !== undefined ? analyzedResults.forceData.up.h_cg.toFixed(2) : '???'}
                unit={analyzedResults ? 'm' : ''}
                secondaryValue={
                  analyzedResults?.forceData?.up?.Y_CG !== undefined
                    ? `y_c (inclinado) = ${analyzedResults.forceData.up.Y_CG.toFixed(4)} m`
                    : 'Profundidade vertical do eixo horizontal'
                }
                theme="slate"
                leftIcon={MoveVertical}
              />

              <ResultsCard
                title={<>Pressão no Centroide (p<sub>c</sub>)</>}
                value={
                  analyzedResults?.forceData?.up?.p_cg !== undefined
                    ? isKgf
                      ? Math.round(analyzedResults.forceData.up.p_cg / g).toLocaleString('pt-BR')
                      : (analyzedResults.forceData.up.p_cg / 1000).toFixed(2)
                    : '???'
                }
                unit={analyzedResults ? (isKgf ? 'kgf/m²' : 'kPa') : ''}
                secondaryValue="p_c = γ · h_c"
                theme="blue"
                leftIcon={Gauge}
              />

              <ResultsCard
                title={<>Profundidade do Centro de Pressão (h<sub>CP</sub>)</>}
                value={analyzedResults?.forceData?.up?.h_cp !== undefined ? analyzedResults.forceData.up.h_cp.toFixed(3) : '???'}
                unit={analyzedResults ? 'm' : ''}
                badge={analyzedResults ? 'ITEM (a)' : undefined}
                secondaryValue={
                  analyzedResults?.forceData?.up?.h_cp !== undefined
                    ? `Δh = +${(analyzedResults.forceData.up.h_cp - analyzedResults.forceData.up.h_cg).toFixed(3)} m abaixo do eixo`
                    : 'Profundidade vertical do ponto de aplicação'
                }
                theme="cyan"
                leftIcon={MoveVertical}
              />

              <ResultsCard
                title={<>Posição Inclinada do Centro de Pressão (y<sub>CP</sub>)</>}
                value={analyzedResults?.forceData?.up?.Y_CP !== undefined ? analyzedResults.forceData.up.Y_CP.toFixed(4) : '???'}
                unit={analyzedResults ? 'm' : ''}
                secondaryValue={
                  analyzedResults?.forceData?.up?.delta_y !== undefined
                    ? `Abaixo do eixo ao longo do plano: e = ${analyzedResults.forceData.up.delta_y.toFixed(4)} m (${(analyzedResults.forceData.up.delta_y * 100).toFixed(2)} cm)`
                    : 'Distância inclinada da superfície livre ao CP'
                }
                theme="cyan"
                leftIcon={Compass}
              />

              <SectionLabel
                title="B. Momento de Abertura"
                subtitle="Item (b): Momento aplicado no eixo horizontal para abrir a comporta"
              />

              <ResultsCard
                highlight
                highlightTheme="purple"
                title="Momento Necessário para Abertura (M)"
                value={
                  !analyzedResults
                    ? '???'
                    : isAberta
                    ? 'N/A'
                    : (
                        Math.abs(
                          analyzedResults.equilibrium.M_abertura_eixo ?? analyzedResults.equilibrium.M_hinge
                        ) / (isKgf ? g : 1000)
                      ).toFixed(2)
                }
                unit={analyzedResults && !isAberta ? (isKgf ? 'kgf·m' : 'kN·m') : ''}
                badge={analyzedResults && !isAberta ? 'ITEM (b)' : undefined}
                secondaryValue={
                  !analyzedResults
                    ? 'Clique em Analisar para calcular M = F_R · e'
                    : `M = F_R · e | ${analyzedResults.equilibrium.sentidoMomentoAbertura ?? 'Sentido horário (oposto ao momento hidrostático)'}`
                }
                leftIcon={RotateCw}
              />

              <ResultsCard
                title="Excentricidade em Relação ao Eixo (e)"
                value={
                  analyzedResults
                    ? (
                        analyzedResults.equilibrium.excentricidadeEixo ??
                        analyzedResults.forceData.up.delta_y ??
                        0
                      ).toFixed(4)
                    : '???'
                }
                unit={analyzedResults ? 'm' : ''}
                secondaryValue={
                  analyzedResults
                    ? `${(
                        (analyzedResults.equilibrium.excentricidadeEixo ??
                          analyzedResults.forceData.up.delta_y ??
                          0) * 100
                      ).toFixed(2)} cm ao longo da comporta (y_CP − y_c = I_G / (y_c · A))`
                    : 'Braço de alavanca entre o CG (eixo) e o CP'
                }
                theme="purple"
                leftIcon={MoveVertical}
              />

              <ResultsCard
                title="Momento Hidrostático Resistente (M_hid)"
                value={
                  !analyzedResults
                    ? '???'
                    : (
                        Math.abs(
                          analyzedResults.equilibrium.M_hidrostatico_eixo ?? analyzedResults.equilibrium.M_hinge
                        ) / (isKgf ? g : 1000)
                      ).toFixed(2)
                }
                unit={analyzedResults ? (isKgf ? 'kgf·m' : 'kN·m') : ''}
                secondaryValue={
                  analyzedResults
                    ? analyzedResults.equilibrium.sentidoMomentoHidrostatico ??
                      'Sentido anti-horário em relação ao eixo central'
                    : 'Momento exercido pela força hidrostática sobre o eixo'
                }
                theme="amber"
                leftIcon={RotateCw}
              />
            </>
          ) : isFloorSupport ? (
            <>
              <ResultsCard
                title={<>Empuxo na Face Esquerda — Glicerina (F<sub>g</sub>)</>}
                value={
                  analyzedResults
                    ? isKgf
                      ? Math.round(analyzedResults.forceData.up.FR / g).toLocaleString('pt-BR')
                      : (analyzedResults.forceData.up.FR / 1000).toFixed(2)
                    : '???'
                }
                unit={analyzedResults ? (isKgf ? 'kgf' : 'kN') : ''}
                secondaryValue={
                  analyzedResults
                    ? `Y_CP,g = ${(analyzedResults.forceData.up.Y_CP ?? 0).toFixed(3)} m | s_CP,g = ${(analyzedResults.forceData.up.s_cp ?? 0).toFixed(3)} m`
                    : 'Clique em Analisar para calcular'
                }
                theme="purple"
                leftIcon={Droplets}
              />

              <ResultsCard
                title={<>Empuxo na Face Direita — Água (F<sub>a</sub>)</>}
                value={
                  analyzedResults
                    ? isKgf
                      ? Math.round(analyzedResults.forceData.down.FR / g).toLocaleString('pt-BR')
                      : (analyzedResults.forceData.down.FR / 1000).toFixed(2)
                    : '???'
                }
                unit={analyzedResults ? (isKgf ? 'kgf' : 'kN') : ''}
                secondaryValue={
                  analyzedResults
                    ? `Y_CP,a = ${(analyzedResults.forceData.down.Y_CP ?? 0).toFixed(3)} m | s_CP,a = ${(analyzedResults.forceData.down.s_cp ?? 0).toFixed(3)} m`
                    : 'Clique em Analisar para calcular'
                }
                theme="cyan"
                leftIcon={Waves}
              />

              <ResultsCard
                title={<>Peso Próprio da Comporta (W)</>}
                value={
                  analyzedResults
                    ? isKgf
                      ? Math.round((analyzedResults.equilibrium.W_peso ?? 0) / g).toLocaleString('pt-BR')
                      : ((analyzedResults.equilibrium.W_peso ?? 0) / 1000).toFixed(3)
                    : '???'
                }
                unit={analyzedResults ? (isKgf ? 'kgf' : 'kN') : ''}
                secondaryValue={
                  analyzedResults
                    ? `m = ${Math.round((analyzedResults.equilibrium.W_peso ?? 0) / g)} kg | Aplicado no CG (L/2)`
                    : 'Peso próprio homogêneo no CG'
                }
                theme="amber"
                leftIcon={ArrowDown}
              />
            </>
          ) : (
            <ResultsCard
              title="Força Hidrostática Resultante"
              value={forceVal}
              unit={forceUnit}
              secondaryValue={forceSec}
              badge={analyzedResults && isAberta ? 'REF.' : undefined}
              theme="blue"
              leftIcon={Droplets}
            />
          )}

          {!isCentralAxis && !isVerticalWallHingeA && (
            <>
              <ResultsCard
                title={<>Distância Inclinada (y<sub>CG</sub>)</>}
                value={analyzedResults?.forceData?.up?.Y_CG !== undefined ? analyzedResults.forceData.up.Y_CG.toFixed(2) : '???'}
                unit={analyzedResults ? 'm' : ''}
                theme="cyan"
                leftIcon={Compass}
                secondaryValue={isFloorSupport ? 'Glicerina: da superfície livre ao CG' : "Da linha d'água ao Centróide (CG)"}
              />

              <ResultsCard
                title={<>Distância Inclinada (y<sub>CP</sub>)</>}
                value={analyzedResults?.forceData?.up?.Y_CP !== undefined ? analyzedResults.forceData.up.Y_CP.toFixed(2) : '???'}
                unit={analyzedResults ? 'm' : ''}
                theme="cyan"
                leftIcon={MoveVertical}
                secondaryValue={isFloorSupport ? 'Glicerina: da superfície livre ao CP' : "Da linha d'água ao Centro de Pressão"}
              />

              <ResultsCard
                title={<>Profundidade do Centróide (h<sub>CG</sub>)</>}
                value={analyzedResults?.forceData?.up?.h_cg !== undefined ? analyzedResults.forceData.up.h_cg.toFixed(2) : '???'}
                unit={analyzedResults ? 'm' : ''}
                theme="slate"
                leftIcon={MoveVertical}
                secondaryValue="Profundidade vertical da superfície livre"
              />

              <ResultsCard
                title={<>Pressão no Centróide (p<sub>CG</sub>)</>}
                value={
                  analyzedResults?.forceData?.up?.p_cg !== undefined
                    ? isKgf
                      ? Math.round(analyzedResults.forceData.up.p_cg / g).toLocaleString('pt-BR')
                      : (analyzedResults.forceData.up.p_cg / 1000).toFixed(2)
                    : '???'
                }
                unit={analyzedResults ? (isKgf ? 'kgf/m²' : 'kPa') : ''}
                theme="blue"
                leftIcon={Gauge}
                secondaryValue={
                  analyzedResults?.forceData?.up?.p_cg !== undefined
                    ? isKgf
                      ? `${(analyzedResults.forceData.up.p_cg / 1000).toFixed(2)} kPa`
                      : `${(analyzedResults.forceData.up.p_cg).toFixed(1)} Pa`
                    : 'Pressão hidrostática média no CG'
                }
              />

              <ResultsCard
                title={<>Profundidade Vertical (h<sub>CP</sub>)</>}
                value={analyzedResults?.forceData?.up?.h_cp !== undefined ? analyzedResults.forceData.up.h_cp.toFixed(3) : '???'}
                unit={analyzedResults ? 'm' : ''}
                theme="slate"
                leftIcon={MoveVertical}
                secondaryValue={
                  isFloorSupport && analyzedResults?.forceData?.down?.h_cp !== undefined
                    ? `Glicerina: ${analyzedResults.forceData.up.h_cp.toFixed(3)} m | Água: ${analyzedResults.forceData.down.h_cp.toFixed(3)} m`
                    : 'Profundidade vertical do ponto de aplicação'
                }
              />

              {(hingePosition !== PosicaoDobradica.NONE || hasTieRod || hasSmoothWallSupport || isFloorSupport) && (
                <>
                  {isFloorSupport && (
                    <>
                      <SectionLabel
                        title="C. Apoios e Reações de Equilíbrio"
                        subtitle="Articulação fixa em A (topo) e fundo liso em B (base)"
                      />

                      <ResultsCard
                        title={<>Reação Normal no Fundo em B (R<sub>B</sub>)</>}
                        value={
                          !analyzedResults
                            ? '???'
                            : isAberta
                            ? 'N/A'
                            : isKgf
                            ? Math.round((analyzedResults.equilibrium.R_B ?? 0) / g).toLocaleString('pt-BR')
                            : ((analyzedResults.equilibrium.R_B ?? 0) / 1000).toFixed(3)
                        }
                        unit={analyzedResults && !isAberta ? (isKgf ? 'kgf' : 'kN') : ''}
                        badge={
                          analyzedResults && !isAberta
                            ? Math.abs(analyzedResults.equilibrium.R_B ?? 0) < 1e-2
                              ? 'R_B = 0'
                              : (analyzedResults.equilibrium.R_B ?? 0) > 0
                              ? 'APOIO ↑'
                              : 'ABERTURA'
                            : undefined
                        }
                        secondaryValue={
                          !analyzedResults
                            ? 'Fundo liso sem atrito (apenas normal vertical)'
                            : isAberta
                            ? 'Não aplicável com a comporta totalmente aberta'
                            : Math.abs(analyzedResults.equilibrium.R_B ?? 0) < 1e-2
                            ? 'Condição limite: perda iminente de contato em B'
                            : (analyzedResults.equilibrium.R_B ?? 0) > 0
                            ? 'Sentido: ↑ (comporta pressiona o fundo em B)'
                            : 'Sentido invertido (< 0): água superou o limite de equilíbrio'
                        }
                        theme={
                          analyzedResults && Math.abs(analyzedResults.equilibrium.R_B ?? 0) < 1e-2
                            ? 'green'
                            : 'amber'
                        }
                        leftIcon={ArrowUp}
                      />

                      <ResultsCard
                        title={<>Reação Horizontal na Articulação A (A<sub>x</sub>)</>}
                        value={
                          !analyzedResults
                            ? '???'
                            : isAberta
                            ? 'N/A'
                            : isKgf
                            ? Math.round(Math.abs(analyzedResults.equilibrium.Rx_hinge ?? 0) / g).toLocaleString('pt-BR')
                            : (Math.abs(analyzedResults.equilibrium.Rx_hinge ?? 0) / 1000).toFixed(2)
                        }
                        unit={analyzedResults && !isAberta ? (isKgf ? 'kgf' : 'kN') : ''}
                        secondaryValue={
                          !analyzedResults
                            ? 'ΣFx = 0 na articulação A'
                            : isAberta
                            ? 'Não aplicável com a comporta totalmente aberta'
                            : `${(analyzedResults.equilibrium.Rx_hinge ?? 0) >= 0 ? 'Sentido: → (para a direita)' : 'Sentido: ← (para a esquerda)'}`
                        }
                        theme="purple"
                        leftIcon={ArrowRight}
                      />

                      <ResultsCard
                        title={<>Reação Vertical na Articulação A (A<sub>y</sub>)</>}
                        value={
                          !analyzedResults
                            ? '???'
                            : isAberta
                            ? 'N/A'
                            : isKgf
                            ? Math.round(Math.abs(analyzedResults.equilibrium.Ry_hinge ?? 0) / g).toLocaleString('pt-BR')
                            : (Math.abs(analyzedResults.equilibrium.Ry_hinge ?? 0) / 1000).toFixed(2)
                        }
                        unit={analyzedResults && !isAberta ? (isKgf ? 'kgf' : 'kN') : ''}
                        secondaryValue={
                          !analyzedResults
                            ? 'ΣFy = 0 na articulação A'
                            : isAberta
                            ? 'Não aplicável com a comporta totalmente aberta'
                            : `${(analyzedResults.equilibrium.Ry_hinge ?? 0) >= 0 ? 'Sentido: ↑ (para cima)' : 'Sentido: ↓ (para baixo)'}`
                        }
                        theme="purple"
                        leftIcon={ArrowUp}
                      />

                      <ResultsCard
                        title={<>Reação Resultante em A (R<sub>A</sub>)</>}
                        value={
                          !analyzedResults
                            ? '???'
                            : isAberta
                            ? 'N/A'
                            : isKgf
                            ? Math.round((analyzedResults.equilibrium.R_hinge ?? 0) / g).toLocaleString('pt-BR')
                            : ((analyzedResults.equilibrium.R_hinge ?? 0) / 1000).toFixed(2)
                        }
                        unit={analyzedResults && !isAberta ? (isKgf ? 'kgf' : 'kN') : ''}
                        secondaryValue={
                          analyzedResults && !isAberta
                            ? 'Resultante vetorial: √(Ax² + Ay²)'
                            : undefined
                        }
                        theme="slate"
                        leftIcon={Compass}
                      />
                    </>
                  )}

                  {(hasSmoothWallSupport || analyzedResults?.equilibrium?.apoioParedeAtivo) && !isFloorSupport && (
                    <>
                      <SectionLabel
                        title="C. Apoios e Reações de Equilíbrio"
                        subtitle="Parede lisa vertical em A e articulação fixa em B"
                      />

                      <ResultsCard
                        title={<>Reação Horizontal no Apoio A (P)</>}
                        value={
                          !analyzedResults
                            ? '???'
                            : isAberta
                            ? 'N/A'
                            : isKgf
                            ? Math.round(Math.abs(analyzedResults.equilibrium.P_apoio ?? 0) / g).toLocaleString('pt-BR')
                            : (Math.abs(analyzedResults.equilibrium.P_apoio ?? 0) / 1000).toFixed(2)
                        }
                        unit={analyzedResults && !isAberta ? (isKgf ? 'kgf' : 'kN') : ''}
                        secondaryValue={
                          !analyzedResults
                            ? 'Clique em Analisar para calcular'
                            : isAberta
                            ? 'Não aplicável com a comporta totalmente aberta'
                            : `${(analyzedResults.equilibrium.P_apoio ?? 0) >= 0 ? 'Sentido: ← (para a esquerda)' : 'Sentido: → (para a direita)'} | Atrito vertical = 0`
                        }
                        theme="green"
                        leftIcon={ArrowLeft}
                      />

                      <ResultsCard
                        title={<>Reação Horizontal na Articulação B (B<sub>x</sub>)</>}
                        value={
                          !analyzedResults
                            ? '???'
                            : isAberta
                            ? 'N/A'
                            : isKgf
                            ? Math.round(Math.abs(analyzedResults.equilibrium.Rx_hinge ?? 0) / g).toLocaleString('pt-BR')
                            : (Math.abs(analyzedResults.equilibrium.Rx_hinge ?? 0) / 1000).toFixed(2)
                        }
                        unit={analyzedResults && !isAberta ? (isKgf ? 'kgf' : 'kN') : ''}
                        secondaryValue={
                          !analyzedResults
                            ? 'ΣFx = 0 na articulação B'
                            : isAberta
                            ? 'Não aplicável com a comporta totalmente aberta'
                            : `${(analyzedResults.equilibrium.Rx_hinge ?? 0) >= 0 ? 'Sentido: → (para a direita)' : 'Sentido: ← (para a esquerda)'}`
                        }
                        theme="purple"
                        leftIcon={ArrowRight}
                      />

                      <ResultsCard
                        title={<>Reação Vertical na Articulação B (B<sub>y</sub>)</>}
                        value={
                          !analyzedResults
                            ? '???'
                            : isAberta
                            ? 'N/A'
                            : isKgf
                            ? Math.round(Math.abs(analyzedResults.equilibrium.Ry_hinge ?? 0) / g).toLocaleString('pt-BR')
                            : (Math.abs(analyzedResults.equilibrium.Ry_hinge ?? 0) / 1000).toFixed(2)
                        }
                        unit={analyzedResults && !isAberta ? (isKgf ? 'kgf' : 'kN') : ''}
                        secondaryValue={
                          !analyzedResults
                            ? 'ΣFy = 0 na articulação B'
                            : isAberta
                            ? 'Não aplicável com a comporta totalmente aberta'
                            : `${(analyzedResults.equilibrium.Ry_hinge ?? 0) >= 0 ? 'Sentido: ↑ (para cima)' : 'Sentido: ↓ (para baixo)'}`
                        }
                        theme="purple"
                        leftIcon={ArrowUp}
                      />

                      <ResultsCard
                        title={<>Reação Resultante em B (R<sub>B</sub>)</>}
                        value={
                          !analyzedResults
                            ? '???'
                            : isAberta
                            ? 'N/A'
                            : isKgf
                            ? Math.round((analyzedResults.equilibrium.R_hinge ?? 0) / g).toLocaleString('pt-BR')
                            : ((analyzedResults.equilibrium.R_hinge ?? 0) / 1000).toFixed(2)
                        }
                        unit={analyzedResults && !isAberta ? (isKgf ? 'kgf' : 'kN') : ''}
                        secondaryValue={
                          analyzedResults && !isAberta
                            ? 'Resultante vetorial: √(Bx² + By²)'
                            : undefined
                        }
                        theme="slate"
                        leftIcon={Compass}
                      />
                    </>
                  )}

                  {hingePosition !== PosicaoDobradica.NONE &&
                    !hasSmoothWallSupport &&
                    !analyzedResults?.equilibrium?.apoioParedeAtivo &&
                    !isFloorSupport && (
                    <ResultsCard
                      title="Momento no Apoio"
                      value={
                        !analyzedResults
                          ? '???'
                          : isAberta
                          ? 'N/A'
                          : (Math.abs(analyzedResults.equilibrium.M_hinge) / (isKgf ? g : 1000)).toFixed(2)
                      }
                      unit={analyzedResults && !isAberta ? (isKgf ? 'kgf·m' : 'kN·m') : ''}
                      secondaryValue={
                        analyzedResults && isAberta
                          ? 'Não aplicável com a comporta totalmente aberta'
                          : undefined
                      }
                      theme="purple"
                      leftIcon={RotateCw}
                    />
                  )}
                  {hasTieRod && (
                    <ResultsCard
                      title="Força no Tirante"
                      value={
                        !analyzedResults
                          ? '???'
                          : isAberta
                          ? 'N/A'
                          : (Math.abs(analyzedResults.equilibrium.F_tie) / (isKgf ? g : 1000)).toFixed(2)
                      }
                      unit={analyzedResults && !isAberta ? (isKgf ? 'kgf' : 'kN') : ''}
                      secondaryValue={
                        analyzedResults && isAberta
                          ? 'Não aplicável com a comporta totalmente aberta'
                          : undefined
                      }
                      theme="amber"
                      leftIcon={ArrowDown}
                    />
                  )}
                </>
              )}

              <ResultsCard
                title="Área Molhada (Seção)"
                value={analyzedResults ? analyzedResults.forceData.up.area.toFixed(4) : '???'}
                unit={analyzedResults ? 'm²' : ''}
                secondaryValue={
                  analyzedResults && isParcial && operacao
                    ? `Bloqueada: ${operacao.areaBloqueada.toFixed(4)} m² | Livre: ${operacao.areaAberturaLivre.toFixed(4)} m²`
                    : undefined
                }
                theme="slate"
                leftIcon={Maximize}
              />
            </>
          )}

          {/* 3. COMPORTAMENTO HIDRÁULICO */}
          <SectionLabel
            title={
              isCentralAxis || isVerticalWallHingeA
                ? 'C. Comportamento Hidráulico'
                : 'B. Comportamento Hidráulico'
            }
            subtitle="Parâmetros de abertura, passagem e desnível"
          />

          <ResultsCard
            title="Altura Livre da Abertura"
            value={analyzedResults && hidraulica ? hidraulica.alturaAbertura.toFixed(2) : '???'}
            unit={analyzedResults ? 'm' : ''}
            secondaryValue={
              analyzedResults && hidraulica && operacao
                ? `Ao longo do plano: ${hidraulica.alturaAberturaInclinada.toFixed(2)} m | Grau: ${operacao.grauAberturaPercent}%`
                : 'Clique em Analisar para calcular'
            }
            theme={isFechada ? 'slate' : isParcial ? 'amber' : 'green'}
            leftIcon={MoveVertical}
          />

          <ResultsCard
            title="Área Livre de Passagem"
            value={analyzedResults && hidraulica ? hidraulica.areaLivrePassagem.toFixed(4) : '???'}
            unit={analyzedResults ? 'm²' : ''}
            secondaryValue={
              analyzedResults && operacao
                ? isFechada
                  ? 'Seção vedada pela comporta'
                  : `${operacao.grauAberturaPercent}% da abertura disponível`
                : undefined
            }
            theme={isFechada ? 'slate' : 'cyan'}
            leftIcon={Maximize}
          />

          <ResultsCard
            title="Diferença de Nível (Δh)"
            value={analyzedResults && hidraulica ? hidraulica.diferencaNivel.toFixed(2) : '???'}
            unit={analyzedResults ? 'm' : ''}
            secondaryValue={
              analyzedResults && hidraulica
                ? `Montante: ${hidraulica.nivelMontante.toFixed(2)} m | Jusante: ${hidraulica.nivelJusanteEfetivo.toFixed(2)} m`
                : undefined
            }
            theme="blue"
            leftIcon={Waves}
          />

          {analyzedResults && hidraulica && (
            <ResultsCard
              title="Regime de Escoamento"
              value={hidraulica.regimeQualitativo}
              secondaryValue={hidraulica.descricaoHidraulica}
              theme={isFechada ? 'slate' : isParcial ? 'amber' : 'green'}
              leftIcon={Gauge}
            />
          )}
        </>
      </ResultsPanel>
    </div>
  );
};
