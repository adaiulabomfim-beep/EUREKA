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
}

const FS_MIN = 1.5;

const corFS = (fs: number) => (fs >= FS_MIN ? '#16a34a' : fs >= 1 ? '#f59e0b' : '#dc2626');

const BarraFS: React.FC<{ y: number; rotulo: string; fs: number }> = ({ y, rotulo, fs }) => {
  const largura = 196;
  const escala = Math.max(3, fs * 1.15);
  const preenchido = Math.max(0, Math.min(1, fs / escala)) * largura;
  const xMin = (FS_MIN / escala) * largura;
  const cor = corFS(fs);
  return (
    <g transform={`translate(12, ${y})`}>
      <text x={0} y={0} fontSize="10" fontWeight="700" fill="#475569" stroke="none">
        {rotulo}
      </text>
      <text x={largura} y={0} textAnchor="end" fontSize="11" fontWeight="800" fill={cor} stroke="none">
        FS = {Number.isFinite(fs) ? fs.toFixed(2) : '∞'}
      </text>
      <rect x={0} y={5} width={largura} height={8} rx={4} fill="#e2e8f0" stroke="none" />
      <rect x={0} y={5} width={preenchido} height={8} rx={4} fill={cor} stroke="none" />
      <line x1={xMin} y1={2} x2={xMin} y2={16} stroke="#334155" strokeWidth="1.2" strokeDasharray="2 2" />
      <text x={xMin} y={25} textAnchor="middle" fontSize="8" fill="#64748b" stroke="none">
        mín. {FS_MIN.toFixed(1)}
      </text>
    </g>
  );
};

/**
 * Overlay gráfico de estabilidade: CG, peso próprio (W), braço x_CG e painel de FS
 * (tombamento e deslizamento). Retorna lista de nós SVG em coordenadas de tela.
 */
export function renderizarEstabilidade2D(opts: OpcoesOverlayEstabilidade): React.ReactNode[] {
  const { stability, isAnalyzed, unitSystem, gravity = 9.81, project, xToeWorld, svgW } = opts;
  if (!isAnalyzed || !stability || !stability.stabilityApplicable) return [];

  const fmtF = (n: number) =>
    unitSystem === 'TECNICO_KGF'
      ? `${(n / gravity).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kgf/m`
      : `${(n / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kN/m`;

  const nodes: React.ReactNode[] = [];

  const cg = project({ x: xToeWorld + stability.x_cg, y: stability.y_cg, z: 0 });
  const footBase = project({ x: xToeWorld + stability.x_cg, y: 0, z: 0 });
  const toe = project({ x: xToeWorld, y: 0, z: 0 });

  if (opts.showVectors !== false) {
    // Peso próprio: seta vertical para baixo a partir do CG
    const comprimento = Math.max(34, Math.min(70, (footBase.y - cg.y) * 0.8));
    const tip = { x: cg.x, y: cg.y + comprimento };
    const rotuloW = `W = ${fmtF(stability.weight)}`;
    const wBox = rotuloW.length * 6.4 + 12;
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

  // Braço x_CG medido a partir do pé de montante
  const yArm = toe.y + 76;
  const xLabel = `x_CG = ${stability.x_cg.toFixed(2)} m`;
  const xBox = xLabel.length * 6.4 + 10;
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

  // Painel de fatores de segurança (canto superior direito)
  const larg = 220;
  const alt = 126;
  nodes.push(
    <g key="painel-fs" transform={`translate(${svgW - larg - 12}, 12)`} pointerEvents="none">
      <rect x={0} y={0} width={larg} height={alt} rx={10} fill="white" opacity="0.92" stroke="#cbd5e1" strokeWidth="1" />
      <text x={12} y={16} fontSize="9" fontWeight="900" fill="#64748b" letterSpacing="1.2" stroke="none">
        ESTABILIDADE
      </text>
      <BarraFS y={36} rotulo="Tombamento" fs={stability.fs_tomb} />
      <BarraFS y={78} rotulo="Deslizamento" fs={stability.fs_desl} />
      <text x={12} y={112} fontSize="9.5" fontWeight="700" fill="#475569" stroke="none">
        W = {fmtF(stability.weight)}  ·  ΣV = {fmtF(stability.total_vertical_force)}
      </text>
    </g>
  );

  return nodes;
}
