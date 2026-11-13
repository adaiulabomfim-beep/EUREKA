import React from 'react';
import {
  Construction,
  Calculator,
  RotateCw,
  MoveVertical,
  Maximize,
  AlertCircle,
  Droplets,
  MoveRight,
  ShieldCheck,
} from 'lucide-react';
import { ResultadoSimulacaoBarragem, SistemaUnidadesBarragem } from '../dominio/tipos';
import { ResultsPanel, ResultsCard } from '../../../../interface/PainelResultados';

interface PainelResultadosProps {
  analyzedResults: ResultadoSimulacaoBarragem | null;
  showDetails: boolean;
  setShowDetails: (val: boolean) => void;
  unitSystem?: SistemaUnidadesBarragem;
  gravity?: number;
}

export const PainelResultados: React.FC<PainelResultadosProps> = ({
  analyzedResults,
  showDetails,
  setShowDetails,
  unitSystem = 'SI',
  gravity = 9.81,
}) => {
  const st = analyzedResults?.stabilityData;
  const fd = analyzedResults?.forceData;
  const isArch = !!st?.isArchDam;
  const isKgf = unitSystem === 'TECNICO_KGF';

  const formatForceVal = (valN: number, decimalsSI = 2, decimalsKgf = 1) =>
    isKgf ? (valN / gravity).toFixed(decimalsKgf) : (valN / 1000).toFixed(decimalsSI);

  const forceUnit = isKgf ? 'kgf/m' : 'kN/m';

  const formatPressureVal = (valPa: number) =>
    isKgf ? (valPa / gravity).toFixed(0) : (valPa / 1000).toFixed(2);

  const pressureUnit = isKgf ? 'kgf/m²' : 'kPa';

  const hasDownWater = !!fd && fd.down && fd.down.FR > 1e-3;
  const mud = fd?.up?.mudLayer;

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
          <ResultsCard
            title={hasDownWater ? 'Resultante Líquida (Net)' : 'Força Hidrostática Resultante'}
            value={fd ? formatForceVal(Math.abs(fd.FR_net)) : '???'}
            unit={fd ? forceUnit : ''}
            theme="blue"
            leftIcon={Droplets}
            secondaryValue={
              fd
                ? mud
                  ? `P' (água) = ${formatForceVal(mud.F_water)} | P'' (lama) = ${formatForceVal(mud.F_mud)} ${forceUnit}`
                  : `FH = ${formatForceVal(fd.FH_net, 1, 0)} | FV = ${formatForceVal(fd.FV_net, 1, 0)} ${forceUnit}`
                : undefined
            }
          />

          {hasDownWater && fd && (
            <ResultsCard
              title="Empuxos Individuais (Faces)"
              value={formatForceVal(fd.up.FR)}
              unit={forceUnit}
              theme="cyan"
              leftIcon={Droplets}
              secondaryValue={`Montante: ${formatForceVal(fd.up.FR)} | Jusante: ${formatForceVal(fd.down.FR)} ${forceUnit}`}
            />
          )}

          <ResultsCard
            title="Centro de Pressão (CP)"
            value={fd ? fd.y_cp_net.toFixed(2) : '?'}
            unit={fd ? 'm' : ''}
            theme="cyan"
            leftIcon={MoveVertical}
            secondaryValue={
              fd
                ? hasDownWater
                  ? `Mont: y=${fd.up.y_cp.toFixed(2)}m (h=${fd.up.h_cp.toFixed(2)}m) | Jus: s=${fd.down.s_cp.toFixed(2)}m (y=${fd.down.y_cp.toFixed(2)}m)`
                  : mud
                  ? `P' a ${mud.y_cp_water.toFixed(2)}m | P'' a ${mud.y_cp_mud.toFixed(2)}m | Total y=${fd.up.y_cp.toFixed(2)}m`
                  : 'Altura vertical da resultante a partir do fundo'
                : undefined
            }
          />

          <ResultsCard
            title="Pressão Máxima (Pé)"
            value={fd ? formatPressureVal(fd.p_max_up) : '?'}
            unit={fd ? pressureUnit : ''}
            theme="blue"
            leftIcon={AlertCircle}
            secondaryValue={
              mud
                ? `Interface = ${formatPressureVal(mud.p_interface)} ${pressureUnit}`
                : undefined
            }
          />

          <ResultsCard
            title="Área Molhada (Montante)"
            value={fd ? (fd.up?.area?.toFixed(2) || '0.00') : '?'}
            unit={fd ? 'm²/m' : ''}
            theme="slate"
            leftIcon={Maximize}
          />

          <ResultsCard
            title="Peso Próprio"
            value={st ? formatForceVal(st.weight) : '???'}
            unit={st ? forceUnit : ''}
            theme="slate"
            leftIcon={Construction}
          />

          {isArch ? (
            <>
              <ResultsCard
                title="Esforço no Arco (p·R)"
                value={st?.archThrust !== undefined ? formatForceVal(st.archThrust, 1, 0) : '?'}
                unit={st ? forceUnit : ''}
                theme="blue"
                leftIcon={ShieldCheck}
                secondaryValue={
                  st?.archStressBase !== undefined
                    ? `σ base ≈ ${(st.archStressBase / 1e6).toFixed(2)} MPa`
                    : undefined
                }
              />
              <ResultsCard
                title="Estabilidade por Gravidade"
                value="N/A"
                unit=""
                theme="slate"
                leftIcon={RotateCw}
                secondaryValue="Resistência por efeito de arco às ombreiras"
              />
            </>
          ) : (
            <>
              <ResultsCard
                title="FS Tombamento"
                value={st ? st.fs_tomb.toFixed(2) : '?'}
                unit=""
                theme={st ? (st.fs_tomb >= 2 ? "green" : st.fs_tomb >= 1.5 ? "amber" : "red") : "slate"}
                leftIcon={RotateCw}
              />

              <ResultsCard
                title="FS Deslizamento"
                value={st ? st.fs_desl.toFixed(2) : '?'}
                unit=""
                theme={st ? (st.fs_desl >= 1.5 ? "green" : st.fs_desl >= 1.0 ? "amber" : "red") : "slate"}
                leftIcon={MoveRight}
              />
            </>
          )}
        </>
      </ResultsPanel>
    </div>
  );
};
