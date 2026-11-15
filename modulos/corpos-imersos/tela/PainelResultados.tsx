import React from 'react';
import { ArrowDown, ArrowUp, EyeOff, Ruler, Calculator, Weight, Droplets, Scale, CheckCircle2, Box, Gauge } from 'lucide-react';
import { ResultsPanel, ResultsCard, Var } from '../../../interface/PainelResultados';

interface PainelResultadosProps {
  physics: any;
  isSimulating: boolean;
  enableTwoFluids: boolean;
  forceText: string;
  showCalculations: boolean;
  onToggleCalculations: () => void;
  specialResult?: {
    title: React.ReactNode;
    value: React.ReactNode;
    unit?: React.ReactNode;
    description?: React.ReactNode;
  } | null;
}

export const PainelResultados: React.FC<PainelResultadosProps> = ({
  physics,
  isSimulating,
  enableTwoFluids,
  forceText,
  showCalculations,
  onToggleCalculations,
  specialResult,
}) => {
  const getStatusHighlight = (status: string, simulating: boolean): string => {
    if (!simulating) return 'slate';
    if (status.includes('AFUNDADO')) return 'red';
    if (status.includes('NEUTRO') || status.includes('SUSPENSO')) return 'amber';
    if (status.includes('INTERFACE')) return 'blue';
    if (status.includes('FLUTUANDO')) return 'green';
    return 'purple';
  };

  const isInverseMode = Boolean(physics?.inverseSpecificWeightMode);
  const isValidInverse = Boolean(physics?.inverseValid);
  const isFloatingMode = Boolean(physics?.floatingEquilibriumMode);
  const isValidFloating = Boolean(physics?.floatingValid);
  const isInterfaceMode = Boolean(physics?.interfaceEquilibriumMode);
  const isValidInterface = Boolean(physics?.interfaceValid);
  const isAnchoredBuoyMode = Boolean(physics?.anchoredBuoyMode);
  const isValidAnchoredBuoy = Boolean(physics?.anchoredBuoyValid);

  return (
    <div id="tour-resultados" data-tour="painel-resultados" className="lg:col-span-3 flex flex-col gap-3 h-[600px] lg:h-full lg:max-h-full min-h-0 overflow-hidden">
      <ResultsPanel
        footerButton={{
          label: showCalculations ? 'Ocultar Memorial' : 'Memorial',
          onClick: onToggleCalculations,
          icon: Calculator,
          disabled: !isSimulating,
        }}
      >
        {isAnchoredBuoyMode ? (
          <>
            <ResultsCard
              title="Tração no Cabo (T)"
              value={
                isSimulating
                  ? isValidAnchoredBuoy
                    ? `${(physics.cordTension / 1000).toFixed(2).replace('.', ',')} kN`
                    : 'INVÁLIDO'
                  : '?'
              }
              highlight={true}
              leftIcon={Scale}
              highlightTheme={isSimulating ? (physics.isCableInTension ? 'purple' : 'amber') : 'slate'}
              secondaryValue={
                isSimulating
                  ? physics.isCableInTension
                    ? `Resultado Principal | T = E − W = ${(physics.buoyancyForce / 1000).toFixed(2).replace('.', ',')} − ${physics.buoyWeightKN.toFixed(2).replace('.', ',')} = ${(physics.cordTension / 1000).toFixed(2).replace('.', ',')} kN (${physics.cordTension.toFixed(1).replace('.', ',')} N)`
                    : 'W ≥ E: o peso iguala ou supera o empuxo (cabo frouxo, T = 0)'
                  : 'Clique em ANALISAR para determinar a força de tração no cabo'
              }
            />

            {isSimulating && physics.isCableInTension && (
              <div className="p-2.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/70 text-[10px] text-blue-900 dark:text-blue-200 leading-relaxed">
                <span className="font-bold block mb-0.5 text-blue-700 dark:text-blue-300">Por que o cabo traciona a boia?</span>
                O empuxo (<span className="font-bold">E = {(physics.buoyancyForce / 1000).toFixed(2).replace('.', ',')} kN</span>) é superior ao peso próprio da boia (<span className="font-bold">W = {physics.buoyWeightKN.toFixed(2).replace('.', ',')} kN</span>), sendo necessária a atuação da força de tração (<span className="font-bold">T = {(physics.cordTension / 1000).toFixed(2).replace('.', ',')} kN</span>) exercida pelo cabo para impedir que a boia suba até a superfície.
              </div>
            )}

            <ResultsCard
              title="Empuxo (E)"
              value={
                isSimulating
                  ? `${(physics.buoyancyForce / 1000).toFixed(2).replace('.', ',')} kN`
                  : '?'
              }
              leftIcon={Droplets}
              icon={isSimulating ? ArrowUp : EyeOff}
              theme="green"
              secondaryValue={
                isSimulating
                  ? <>E = <Var base="γ" sub="mar" /> · V = {physics.buoyancyForce.toFixed(1).replace('.', ',')} N</>
                  : 'Aguardando análise'
              }
            />

            <ResultsCard
              title="Peso Próprio da Boia (W)"
              value={`${physics.buoyWeightKN.toFixed(2).replace('.', ',')} kN`}
              leftIcon={Weight}
              icon={ArrowDown}
              theme="red"
              secondaryValue={`W = ${physics.objectWeight.toFixed(0)} N${isSimulating ? ` (m = ${physics.objectMass.toFixed(1).replace('.', ',')} kg)` : ''}`}
            />

            <ResultsCard
              title={<>Volume Total e Submerso (V = <Var base="V" sub="sub" />)</>}
              value={
                isSimulating
                  ? `${physics.volume.toFixed(4).replace('.', ',')} m³`
                  : '?'
              }
              leftIcon={Box}
              theme="cyan"
              badge="100% Submersa"
              secondaryValue={
                isSimulating
                  ? `V = π·D³/6 = ${(physics.volume * 1000).toFixed(1).replace('.', ',')} L (Totalmente submersa)`
                  : 'Aguardando análise'
              }
            />

            <ResultsCard
              title="Diâmetro da Boia (D)"
              value={`${physics.buoyDiameterM.toFixed(2).replace('.', ',')} m`}
              leftIcon={Ruler}
              theme="slate"
              badge={`R = ${physics.buoyRadiusM.toFixed(2).replace('.', ',')} m`}
              secondaryValue={`Diâmetro = ${physics.buoyDiameterCm.toFixed(0)} cm | Raio = ${physics.buoyRadiusCm.toFixed(0)} cm`}
            />

            <ResultsCard
              title={<>Peso Específico do Fluido (<Var base="γ" sub="mar" />)</>}
              value={
                isSimulating
                  ? `${(physics.fluidSpecificWeight / 1000).toFixed(2).replace('.', ',')} kN/m³`
                  : '?'
              }
              leftIcon={Gauge}
              theme="blue"
              secondaryValue={
                isSimulating
                  ? `Água do Mar (γ = ${(physics.fluidSpecificWeight / 1000).toFixed(2).replace('.', ',')} kN/m³ = ${physics.fluidSpecificWeight.toFixed(1).replace('.', ',')} N/m³ | ρ ≈ ${physics.rhoA.toFixed(1).replace('.', ',')} kg/m³)`
                  : 'Aguardando análise'
              }
            />
          </>
        ) : isInterfaceMode ? (
          <>
            <ResultsCard
              title="Razão entre Alturas (a / b)"
              value={
                isSimulating
                  ? isValidInterface
                    ? physics.ratioAtoB.toFixed(3).replace('.', ',')
                    : 'INVÁLIDO'
                  : '?'
              }
              highlight={true}
              leftIcon={Scale}
              highlightTheme={isSimulating ? (isValidInterface ? 'purple' : 'red') : 'slate'}
              secondaryValue={
                isSimulating
                  ? isValidInterface
                    ? <>Resultado Principal | a/b = (<Var base="d" sub="m" /> − <Var base="d" sub="s" />)/(<Var base="d" sub="s" /> − <Var base="d" sub="a" />) = {physics.numeratorDiff.toFixed(2).replace('.', ',')}/{physics.denominatorDiff.toFixed(2).replace('.', ',')} = {physics.ratioAtoB.toFixed(4).replace('.', ',')}</>
                    : <>Requer <Var base="d" sub="a" /> &lt; <Var base="d" sub="s" /> &lt; <Var base="d" sub="m" /> para equilíbrio na interface</>
                  : 'Clique em ANALISAR para calcular a razão a/b'
              }
            />

            <ResultsCard
              title="Alturas Submersas (a e b)"
              value={
                isSimulating
                  ? `a = ${(physics.fractionA * 100).toFixed(1).replace('.', ',')}% | b = ${(physics.fractionB * 100).toFixed(1).replace('.', ',')}%`
                  : '?'
              }
              leftIcon={Ruler}
              theme="cyan"
              badge={isSimulating ? 'a + b = H' : undefined}
              secondaryValue={
                isSimulating
                  ? `Ilustrativo (H = ${physics.illustrativeHeightCm} cm): a = ${physics.heightA_cm.toFixed(2).replace('.', ',')} cm (Água) | b = ${physics.heightB_cm.toFixed(2).replace('.', ',')} cm (Mercúrio)`
                  : 'Aguardando análise'
              }
            />

            <ResultsCard
              title={<>Peso Específico do Aço (<Var base="γ" sub="s" />)</>}
              value={isSimulating ? `${physics.bodySpecificWeight.toFixed(1).replace('.', ',')}` : '?'}
              unit={isSimulating ? 'N/m³' : undefined}
              leftIcon={Gauge}
              theme="amber"
              badge={isSimulating ? <><Var base="d" sub="s" /> = {physics.bodyRelativeDensity.toFixed(2).replace('.', ',')}</> : undefined}
              secondaryValue={
                isSimulating
                  ? (
                    <>
                      <span><Var base="ρ" sub="s" /> = {physics.objectDensity.toFixed(0)} kg/m³</span>
                      <span>{(physics.bodySpecificWeight / 1000).toFixed(2).replace('.', ',')} kN/m³</span>
                    </>
                  )
                  : 'Aguardando análise'
              }
            />

            <ResultsCard
              title={<>Pesos Específicos (<Var base="γ" sub="a" /> e <Var base="γ" sub="m" />)</>}
              value={
                isSimulating
                  ? <><Var base="γ" sub="a" /> = {physics.upperFluidSpecificWeight.toFixed(0)} | <Var base="γ" sub="m" /> = {physics.lowerFluidSpecificWeight.toFixed(1).replace('.', ',')}</>
                  : '?'
              }
              unit={isSimulating ? 'N/m³' : undefined}
              leftIcon={Droplets}
              theme="blue"
              secondaryValue={
                isSimulating
                  ? (
                    <>
                      <span>Água: <Var base="d" sub="a" /> = {physics.upperFluidRelativeDensity.toFixed(2).replace('.', ',')}</span>
                      <span>Mercúrio: <Var base="d" sub="m" /> = {physics.lowerFluidRelativeDensity.toFixed(2).replace('.', ',')}</span>
                    </>
                  )
                  : 'Aguardando análise'
              }
            />

            <ResultsCard
              title={<>Empuxo da Água (<Var base="E" sub="água" />) e do Mercúrio (<Var base="E" sub="merc" />)</>}
              value={
                isSimulating
                  ? <><Var base="E" sub="a" /> = {(physics.E_A / 1000).toFixed(2).replace('.', ',')} kN | <Var base="E" sub="m" /> = {(physics.E_B / 1000).toFixed(2).replace('.', ',')} kN</>
                  : '?'
              }
              leftIcon={Droplets}
              icon={isSimulating ? ArrowUp : EyeOff}
              theme="green"
              secondaryValue={
                isSimulating
                  ? (
                    <>
                      <span><Var base="E" sub="água" /> = {physics.E_A.toFixed(1).replace('.', ',')} N ({((physics.E_A / physics.buoyancyForce) * 100).toFixed(1).replace('.', ',')}%)</span>
                      <span><Var base="E" sub="mercúrio" /> = {physics.E_B.toFixed(1).replace('.', ',')} N ({((physics.E_B / physics.buoyancyForce) * 100).toFixed(1).replace('.', ',')}%)</span>
                    </>
                  )
                  : 'Aguardando análise'
              }
            />

            <ResultsCard
              title={
                isSimulating ? (
                  <>Equilíbrio Vertical (P = <Var base="E" sub="água" /> + <Var base="E" sub="mercúrio" />)</>
                ) : (
                  <>Condição de Equilíbrio Vertical</>
                )
              }
              value={
                isSimulating
                  ? `P = ${(physics.objectWeight / 1000).toFixed(2).replace('.', ',')} kN`
                  : '?'
              }
              leftIcon={CheckCircle2}
              theme="red"
              badge={isSimulating ? <>Σ<Var base="F" sub="y" /> = 0</> : undefined}
              secondaryValue={
                isSimulating
                  ? <>P = {physics.objectWeight.toFixed(1).replace('.', ',')} N = <Var base="E" sub="água" /> + <Var base="E" sub="mercúrio" /> = {physics.buoyancyForce.toFixed(1).replace('.', ',')} N</>
                  : 'Aguardando análise'
              }
            />
          </>
        ) : isFloatingMode ? (
          <>
            <ResultsCard
              title="Peso da Lata (P)"
              value={
                isSimulating
                  ? isValidFloating
                    ? `${physics.objectWeight.toFixed(2).replace('.', ',')} N`
                    : 'DADOS INVÁLIDOS'
                  : 'PRONTO (?)'
              }
              highlight={true}
              leftIcon={Weight}
              highlightTheme={isSimulating ? (isValidFloating ? 'purple' : 'red') : 'slate'}
              secondaryValue={
                isSimulating
                  ? isValidFloating
                    ? `Resultado Principal | P = E = ${physics.objectWeight.toFixed(3).replace('.', ',')} N (m ≈ ${(physics.objectMass * 1000).toFixed(1).replace('.', ',')} g)`
                    : 'Verifique as dimensões informadas'
                  : 'Execute a análise para determinar o peso P'
              }
            />

            <ResultsCard
              title="Empuxo (E)"
              value={isSimulating ? physics.buoyancyForce.toFixed(2).replace('.', ',') : '?'}
              unit={isSimulating ? 'N' : ''}
              secondaryValue={
                isSimulating
                  ? <>E = <Var base="γ" sub="água" /> · <Var base="V" sub="sub" /> = {physics.buoyancyForce.toFixed(3).replace('.', ',')} N</>
                  : <>Princípio de Arquimedes (E = γ · <Var base="V" sub="sub" />)</>
              }
              leftIcon={Droplets}
              icon={isSimulating ? ArrowUp : EyeOff}
              theme="green"
            />

            <ResultsCard
              title="Condição de Equilíbrio (P = E)"
              value={isSimulating ? 'P = E (Flutuando)' : 'Equilíbrio Estático'}
              leftIcon={CheckCircle2}
              theme="blue"
              badge={<>Σ<Var base="F" sub="y" /> = 0</>}
              secondaryValue={
                isSimulating
                  ? `${physics.objectWeight.toFixed(2).replace('.', ',')} N = ${physics.buoyancyForce.toFixed(2).replace('.', ',')} N | Sem reação de fundo`
                  : 'Flutuação livre: Peso próprio equilibra o Empuxo'
              }
            />

            <ResultsCard
              title={<>Volume Submerso (<Var base="V" sub="sub" />)</>}
              value={isSimulating ? physics.vol_deslocado.toFixed(6).replace('.', ',') : '?'}
              unit={isSimulating ? 'm³' : ''}
              leftIcon={Box}
              theme="cyan"
              badge={<><Var base="h" sub="sub" /> = {physics.submergedHeightCm.toFixed(1).replace('.', ',')} cm</>}
              secondaryValue={
                isSimulating
                  ? `${(physics.vol_deslocado * 1e6).toFixed(2).replace('.', ',')} cm³ (${(physics.vol_deslocado * 1000).toFixed(3).replace('.', ',')} L) | A = ${(physics.baseArea * 1e4).toFixed(2).replace('.', ',')} cm²`
                  : <><Var base="V" sub="sub" /> = A · <Var base="h" sub="sub" /></>
              }
            />

            <ResultsCard
              title={<>Volume Total (<Var base="V" sub="total" />) e Emerso (<Var base="V" sub="em" />)</>}
              value={isSimulating ? physics.volume.toFixed(6).replace('.', ',') : '?'}
              unit={isSimulating ? 'm³' : ''}
              leftIcon={Box}
              theme="amber"
              badge={`H = ${physics.totalHeightCm.toFixed(1).replace('.', ',')} cm`}
              secondaryValue={
                isSimulating
                  ? (
                    <>
                      <span><Var base="V" sub="total" /> = {(physics.volume * 1e6).toFixed(2).replace('.', ',')} cm³</span>
                      <span><Var base="V" sub="em" /> = {physics.vol_emerso.toFixed(6).replace('.', ',')} m³ ({(physics.vol_emerso * 1e6).toFixed(2).replace('.', ',')} cm³)</span>
                    </>
                  )
                  : <><Var base="h" sub="em" /> = {physics.emergedHeightCm.toFixed(1).replace('.', ',')} cm acima da superfície livre</>
              }
            />

            <ResultsCard
              title={<>Fração Submersa (<Var base="h" sub="sub" /> / H)</>}
              value={isSimulating ? `${physics.submergedPercentage.toFixed(2).replace('.', ',')}%` : '?'}
              leftIcon={Ruler}
              theme="purple"
              secondaryValue={
                isSimulating
                  ? (
                    <>
                      <span><Var base="h" sub="sub" /> = {physics.submergedHeightCm.toFixed(1).replace('.', ',')} cm</span>
                      <span><Var base="h" sub="em" /> = {physics.emergedHeightCm.toFixed(1).replace('.', ',')} cm</span>
                      <span><Var base="ρ" sub="eq" /> ≈ {physics.equivalentDensity.toFixed(1).replace('.', ',')} kg/m³</span>
                    </>
                  )
                  : `Razão submersa: ${physics.submergedHeightCm.toFixed(1).replace('.', ',')} cm / ${physics.totalHeightCm.toFixed(1).replace('.', ',')} cm`
              }
            />
          </>
        ) : isInverseMode ? (
          <>
            <ResultsCard
              title={<>Peso Específico Médio (<Var base="γ" sub="c" />)</>}
              value={
                isSimulating
                  ? isValidInverse
                    ? `${Math.round(physics.objectSpecificWeight).toLocaleString('pt-BR')} N/m³`
                    : 'DADOS INVÁLIDOS'
                  : 'PRONTO (?)'
              }
              highlight={true}
              leftIcon={Gauge}
              highlightTheme={isSimulating ? (isValidInverse ? 'purple' : 'red') : 'slate'}
              secondaryValue={
                isSimulating
                  ? isValidInverse
                    ? `Resultado Principal | ${(physics.objectSpecificWeight / 1000).toFixed(3).replace('.', ',')} kN/m³`
                    : 'Peso real deve superar o peso aparente'
                  : <>Execute a análise para determinar <Var base="γ" sub="c" /></>
              }
            />

            <ResultsCard
              title="Peso Real no Ar (P)"
              value={physics.objectWeight.toFixed(1).replace('.', ',')}
              unit="N"
              secondaryValue={`${(physics.objectWeight / 1000).toFixed(3).replace('.', ',')} kN | Dado do ensaio`}
              leftIcon={Weight}
              icon={ArrowDown}
              theme="red"
            />

            <ResultsCard
              title={<>Peso Aparente na Água (<Var base="P" sub="ap" />)</>}
              value={physics.apparentWeight.toFixed(1).replace('.', ',')}
              unit="N"
              secondaryValue={`${(physics.apparentWeight / 1000).toFixed(3).replace('.', ',')} kN | Resultante`}
              leftIcon={Scale}
              theme="blue"
              badge="DINAMÔMETRO"
            />

            <ResultsCard
              title="Empuxo (E)"
              value={isSimulating ? physics.buoyancyForce.toFixed(1).replace('.', ',') : '?'}
              unit={isSimulating ? 'N' : ''}
              secondaryValue={
                isSimulating
                  ? (
                    <>
                      <span>{(physics.buoyancyForce / 1000).toFixed(3).replace('.', ',')} kN</span>
                      <span>E = P − <Var base="P" sub="ap" /></span>
                    </>
                  )
                  : <>E = P − <Var base="P" sub="ap" /></>
              }
              leftIcon={Droplets}
              icon={isSimulating ? ArrowUp : EyeOff}
              theme="green"
            />

            <ResultsCard
              title={<>Volume Deslocado (<Var base="V" sub="desl" />)</>}
              value={isSimulating ? physics.vol_deslocado.toFixed(5).replace('.', ',') : '?'}
              unit={isSimulating ? 'm³' : ''}
              leftIcon={Box}
              theme="amber"
              badge={<>V = E / <Var base="γ" sub="f" /></>}
              secondaryValue={
                isSimulating
                  ? `${(physics.vol_deslocado * 1000).toFixed(2).replace('.', ',')} L | Corpo totalmente imerso`
                  : 'Princípio de Arquimedes'
              }
            />

            <ResultsCard
              title={<>Densidade do Material (<Var base="ρ" sub="c" />)</>}
              value={isSimulating ? Math.round(physics.objectDensity).toLocaleString('pt-BR') : '?'}
              unit={isSimulating ? 'kg/m³' : ''}
              leftIcon={CheckCircle2}
              theme="cyan"
              secondaryValue={
                isSimulating
                  ? (
                    <>
                      <span><Var base="ρ" sub="c" /> = <Var base="γ" sub="c" /> / g</span>
                      <span>{physics.status}</span>
                    </>
                  )
                  : 'Informação complementar (g = 9,81 m/s²)'
              }
            />
          </>
        ) : (
          <>
            <ResultsCard
              title="Peso Real (P)"
              value={(physics.objectWeight / 1000).toFixed(2)}
              unit="kN"
              secondaryValue={`${physics.objectWeight.toFixed(1)} N`}
              leftIcon={Weight}
              icon={ArrowDown}
              theme="red"
            />

            <ResultsCard
              title="Empuxo Total (E)"
              value={isSimulating ? (physics.buoyancyForce / 1000).toFixed(2) : '???'}
              unit={isSimulating ? 'kN' : ''}
              secondaryValue={isSimulating ? `${physics.buoyancyForce.toFixed(1)} N` : undefined}
              leftIcon={Droplets}
              icon={isSimulating ? ArrowUp : EyeOff}
              theme="green"
            />

            <ResultsCard
              title={<>Peso Aparente (<Var base="P" sub="ap" />)</>}
              value={isSimulating ? (physics.apparentWeight / 1000).toFixed(2) : '?'}
              unit={isSimulating ? 'kN' : ''}
              secondaryValue={
                isSimulating
                  ? physics.apparentWeight > 0
                    ? `${physics.apparentWeight.toFixed(1)} N`
                    : '0.0 N (Flutuando / Suspenso)'
                  : undefined
              }
              leftIcon={Scale}
              theme="blue"
              badge="DINAMÔMETRO"
            />

            <ResultsCard
              title="Estado do Objeto"
              value={isSimulating ? physics.status : 'PRONTO'}
              highlight={true}
              leftIcon={CheckCircle2}
              highlightTheme={getStatusHighlight(physics.status, isSimulating)}
              secondaryValue={
                isSimulating
                  ? physics.isShallowTank
                    ? 'Apoiado no fundo (lâmina líquida insuficiente)'
                    : physics.equivalentDensity
                    ? `Densidade Eq.: ${physics.equivalentDensity.toFixed(1)} kg/m³`
                    : undefined
                  : undefined
              }
            />

            <ResultsCard
              title={<>Altura Submersa (<Var base="H" sub="sub" />)</>}
              value={isSimulating ? physics.h_sub_actual.toFixed(2) : '?'}
              unit={isSimulating ? 'cm' : ''}
              leftIcon={Droplets}
              icon={Ruler}
              theme="cyan"
              secondaryValue={
                isSimulating
                  ? enableTwoFluids
                    ? `${(physics.h_sub_actual / 100).toFixed(4)} m | A: ${physics.h_in_A.toFixed(2)} cm | B: ${physics.h_in_B.toFixed(2)} cm`
                    : `Equivalente: ${(physics.h_sub_actual / 100).toFixed(4)} m`
                  : undefined
              }
            />

            <ResultsCard
              title={<>Volume Deslocado (<Var base="V" sub="desl" />)</>}
              value={isSimulating ? physics.vol_deslocado.toFixed(4) : '?'}
              unit={isSimulating ? 'm³' : ''}
              leftIcon={Box}
              theme="amber"
              badge={<><Var base="V" sub="desl" /> = <Var base="V" sub="sub" /></>}
              secondaryValue={
                isSimulating
                  ? `${(physics.vol_deslocado * 1000).toFixed(2)} L | Δh: ${physics.deltaH_cm.toFixed(2)} cm`
                  : 'Elevação do Nível (Δh): ? cm'
              }
            />

            {specialResult && (
              <ResultsCard
                title={specialResult.title}
                value={specialResult.value}
                unit={specialResult.unit}
                theme="purple"
                badge="INCÓGNITA"
                secondaryValue={specialResult.description}
              />
            )}
          </>
        )}
      </ResultsPanel>
    </div>
  );
};
