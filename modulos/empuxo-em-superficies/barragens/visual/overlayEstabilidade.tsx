import React from 'react';
import { ResultadoEstabilidadeBarragem, SistemaUnidadesBarragem } from '../dominio/tipos';

type Pt = { x: number; y: number };

export interface OpcoesOverlayEstabilidade {
  stability?: ResultadoEstabilidadeBarragem | null;
  isAnalyzed: boolean;
  unitSystem?: SistemaUnidadesBarragem;
  gravity?: number;
  /** Projeta um ponto do mundo (x, y) para a tela. */
  project: (p: { x: number; y: number; z: number }) => Pt;
  /** Coordenada x (mundo) do pé de montante na base. */
  xToeWorld: number;
  svgW: number;
  showVectors?: boolean;
  /** Componente horizontal líquida do empuxo hidrostático (N/m). */
  forceH?: number;
  /** Exibe forças totais na largura b quando verdadeiro. */
  showTriangularMode?: boolean;
}

/**
 * Overlay gráfico de estabilidade: CG, peso próprio (W), braço x_CG, subpressão (U)
 * e vetor resultante (R) atuante na base da barragem.
 */
export function renderizarEstabilidade2D(opts: OpcoesOverlayEstabilidade): React.ReactNode[] {
  const { stability, isAnalyzed, unitSystem, gravity = 9.81, project, xToeWorld, showTriangularMode } = opts;
  if (!isAnalyzed || !stability || !stability.stabilityApplicable) return [];

  const bLong = stability.damWidth ?? 1;
  const useTotalWidth = Boolean(showTriangularMode || bLong > 1.001);

  const fmtF = (nPerMeter: number) => {
    if (useTotalWidth) {
      const totalN = nPerMeter * bLong;
      return unitSystem === 'TECNICO_KGF'
        ? `${(totalN / gravity).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kgf`
        : `${(totalN / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kN`;
    }
    return unitSystem === 'TECNICO_KGF'
      ? `${(nPerMeter / gravity).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kgf/m`
      : `${(nPerMeter / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kN/m`;
  };

  const nodes: React.ReactNode[] = [];

  const cg = project({ x: xToeWorld + stability.x_cg, y: stability.y_cg, z: 0 });
  const footBase = project({ x: xToeWorld + stability.x_cg, y: 0, z: 0 });
  const toe = project({ x: xToeWorld, y: 0, z: 0 });
  const heel = project({ x: xToeWorld + stability.actualBaseWidth, y: 0, z: 0 });

  if (opts.showVectors !== false) {
    // Peso próprio: seta vertical para baixo a partir do CG
    const comprimento = Math.max(34, Math.min(70, (footBase.y - cg.y) * 0.8));
    const tip = { x: cg.x, y: cg.y + comprimento };
    const rotuloW = `W = ${fmtF(stability.weight)}`;
    const wBox = rotuloW.length * 6.4 + 14;
    nodes.push(
      <g key="peso-proprio" pointerEvents="none">
        <line x1={cg.x} y1={cg.y} x2={tip.x} y2={tip.y - 7} stroke="#b91c1c" strokeWidth="3" strokeLinecap="round" />
        <polygon
          points={`${tip.x},${tip.y} ${tip.x - 6},${tip.y - 11} ${tip.x + 6},${tip.y - 11}`}
          fill="#b91c1c"
        />
        <rect
          x={cg.x - wBox / 2}
          y={tip.y + 3}
          width={wBox}
          height={17}
          rx={4}
          fill="white"
          stroke="#b91c1c"
          strokeWidth="1"
          opacity="0.95"
        />
        <text
          x={cg.x}
          y={tip.y + 12}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11"
          fontWeight="800"
          fill="#991b1b"
        >
          {rotuloW}
        </text>
      </g>
    );
  }

  // Marcador do centro de gravidade (⊕)
  nodes.push(
    <g key="cg-marker" pointerEvents="none">
      <circle cx={cg.x} cy={cg.y} r={6} fill="white" stroke="#0f172a" strokeWidth="1.5" />
      <path d={`M ${cg.x - 6} ${cg.y} H ${cg.x + 6} M ${cg.x} ${cg.y - 6} V ${cg.y + 6}`} stroke="#0f172a" strokeWidth="1.2" />
      <text
        x={cg.x + 9}
        y={cg.y - 8}
        fontSize="10"
        fontWeight="800"
        fill="#0f172a"
        stroke="white"
        strokeWidth="2.5"
        paintOrder="stroke"
      >
        CG
      </text>
    </g>
  );

  // Diagrama de Subpressão (Percolação sob a fundação BC) quando ativa
  const sub = stability.analisePontoC?.subpressao;
  if (opts.showVectors !== false && sub && sub.ativa && sub.U_por_metro > 1e-3) {
    const maxDiagH = 34;
    const pMaxRef = Math.max(sub.p_B, sub.p_C, 1);
    const hB = (sub.p_B / pMaxRef) * maxDiagH;
    const hC = (sub.p_C / pMaxRef) * maxDiagH;
    const baseY = toe.y;

    const polyPoints = `${toe.x},${baseY} ${heel.x},${baseY} ${heel.x},${baseY + hC} ${toe.x},${baseY + hB}`;
    const numArrows = 7;
    const upliftArrows: React.ReactNode[] = [];
    for (let i = 0; i < numArrows; i++) {
      const t = i / (numArrows - 1);
      const ax = toe.x + t * (heel.x - toe.x);
      const ah = hB + t * (hC - hB);
      if (ah >= 6) {
        upliftArrows.push(
          <g key={`up-arr-${i}`}>
            <line
              x1={ax}
              y1={baseY + ah}
              x2={ax}
              y2={baseY + 4}
              stroke="#9333ea"
              strokeWidth="1.4"
              opacity="0.85"
            />
            <polygon
              points={`${ax},${baseY + 1} ${ax - 3},${baseY + 6} ${ax + 3},${baseY + 6}`}
              fill="#9333ea"
              opacity="0.9"
            />
          </g>
        );
      }
    }

    const pU = project({ x: xToeWorld + sub.x_U, y: 0, z: 0 });
    const uVecLen = 44;
    const rotuloU = `U = ${fmtF(sub.U_por_metro)}`;
    const uBoxW = Math.max(76, rotuloU.length * 6.4 + 14);

    nodes.push(
      <g key="subpressao-base" pointerEvents="none">
        <polygon
          points={polyPoints}
          fill="rgba(147, 51, 234, 0.16)"
          stroke="#9333ea"
          strokeWidth="1.4"
          strokeDasharray="4 2"
        />
        {upliftArrows}
        {/* Vetor Resultante de Subpressão U apontando verticalmente para cima */}
        <line
          x1={pU.x}
          y1={baseY + uVecLen}
          x2={pU.x}
          y2={baseY + 6}
          stroke="#7e22ce"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <polygon
          points={`${pU.x},${baseY} ${pU.x - 6},${baseY + 11} ${pU.x + 6},${baseY + 11}`}
          fill="#7e22ce"
        />
        <rect
          x={pU.x - uBoxW / 2}
          y={baseY + uVecLen + 2}
          width={uBoxW}
          height={18}
          rx={5}
          fill="white"
          stroke="#7e22ce"
          strokeWidth="1.2"
          opacity="0.96"
        />
        <text
          x={pU.x}
          y={baseY + uVecLen + 11}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="10.5"
          fontWeight="800"
          fill="#6b21a8"
        >
          {rotuloU}
        </text>
      </g>
    );
  }

  // Braço x_CG medido a partir do pé de montante
  const yArm = toe.y + (sub && sub.ativa ? 92 : 76);
  const xLabel = useTotalWidth
    ? `x_CG = ${stability.x_cg.toFixed(1)} m (b_W,C = ${stability.lever_arm_weight.toFixed(1)} m)`
    : `x_CG = ${stability.x_cg.toFixed(2)} m`;
  const xBox = xLabel.length * 6.2 + 12;
  nodes.push(
    <g key="braco-xcg" pointerEvents="none" stroke="#7c3aed" fill="none" strokeWidth="1.4" opacity="0.95">
      <line x1={cg.x} y1={cg.y} x2={footBase.x} y2={footBase.y} strokeDasharray="4 3" opacity="0.7" />
      <line x1={footBase.x} y1={footBase.y} x2={footBase.x} y2={yArm} strokeDasharray="3 3" opacity="0.5" />
      <line x1={toe.x} y1={toe.y} x2={toe.x} y2={yArm} strokeDasharray="3 3" opacity="0.5" />
      <line x1={toe.x} y1={yArm} x2={footBase.x} y2={yArm} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
      <rect
        x={(toe.x + footBase.x) / 2 - xBox / 2}
        y={yArm - 9}
        width={xBox}
        height={18}
        rx={3}
        fill="white"
        stroke="none"
      />
      <text
        x={(toe.x + footBase.x) / 2}
        y={yArm}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="800"
        fill="#6d28d9"
        stroke="none"
      >
        {xLabel}
      </text>
    </g>
  );

  // Vetor Resultante (R) aplicado na base da barragem no ponto efetivamente calculado
  const fV = stability.total_vertical_force;
  const fH = opts.forceH !== undefined && Number.isFinite(opts.forceH) ? opts.forceH : 0;
  const R = Math.hypot(fH, fV);

  if (
    opts.showVectors !== false &&
    !useTotalWidth &&
    Number.isFinite(R) &&
    R > 1e-3 &&
    Number.isFinite(fV) &&
    fV > 1e-3 &&
    Number.isFinite(stability.actualBaseWidth) &&
    stability.actualBaseWidth > 0 &&
    Number.isFinite(stability.e)
  ) {
    // Posição x da resultante na base medida a partir do pé de montante:
    const xRFromToeUpRaw =
      fH >= 0
        ? stability.actualBaseWidth / 2 + stability.e
        : stability.actualBaseWidth / 2 - stability.e;
    const xRFromToeUp = Math.max(0, Math.min(stability.actualBaseWidth, xRFromToeUpRaw));

    const pBaseR = project({ x: xToeWorld + xRFromToeUp, y: 0, z: 0 });

    const ux = fH / R;
    const uy = fV / R;
    const compR = 33;
    const pTip = {
      x: pBaseR.x + ux * compR,
      y: pBaseR.y + uy * compR,
    };

    const rotuloR = `R = ${fmtF(R)}`;
    const pillW = Math.max(68, rotuloR.length * 6.1 + 14);
    const pillH = 19;
    const labelSide = pBaseR.x >= footBase.x ? 1 : -1;
    const anchorX = labelSide > 0 ? Math.max(pBaseR.x, pTip.x) : Math.min(pBaseR.x, pTip.x);
    const pillCx = anchorX + labelSide * (pillW / 2 + 8);
    const pillCy = pBaseR.y + 18;

    nodes.push(
      <g key="vetor-resultante-base" pointerEvents="none">
        <line
          x1={pBaseR.x}
          y1={pBaseR.y}
          x2={pTip.x}
          y2={pTip.y}
          stroke="#dc2626"
          strokeWidth="3.2"
          markerEnd="url(#arrow-red)"
          strokeLinecap="round"
        />
        <circle
          cx={pBaseR.x}
          cy={pBaseR.y}
          r={4}
          fill="#dc2626"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
        <g transform={`translate(${pillCx}, ${pillCy})`}>
          <rect
            x={-pillW / 2}
            y={-pillH / 2}
            width={pillW}
            height={pillH}
            rx={pillH / 2}
            fill="#ffffff"
            opacity="0.94"
            stroke="#fecaca"
            strokeWidth="1.2"
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#dc2626"
            fontSize="10"
            fontWeight="800"
            stroke="none"
          >
            {rotuloR}
          </text>
        </g>
      </g>
    );
  }

  return nodes;
}
