import { useMemo } from 'react';
import { DamSimulationConfig } from '../types';
import { calculateNetForce } from '../physics/damHydrostatics';

export const useDamSimulation = (config: DamSimulationConfig) => {
  const {
    upstreamLevel,
    downstreamLevel,
    density,
    gravity,
    damHeight,
    inclinationAngle,
  } = config;

  return useMemo(() => {
    const gamma = density * gravity;

    // Altura (coordenada Y) do topo da face molhada medida a partir do fundo:
    // topo = H
    const y_top_face = damHeight;

    // Profundidade vertical do topo da face abaixo do nível livre:
    // h_top = h_agua - y_top_face
    // Se negativo => topo acima do nível livre (sem submersão no topo)
    const h_top_up = upstreamLevel - y_top_face;
    const h_top_down = downstreamLevel - y_top_face;

    // Comprimento da face inclinada
    const faceLength = damHeight / Math.max(0.001, Math.sin(inclinationAngle * Math.PI / 180));

    // Cálculo da força líquida (montante - jusante) e CP ao longo da face (por metro de largura)
    const forceData = calculateNetForce(
      faceLength,
      1, // 1 metro de largura para análise 2D
      inclinationAngle,
      h_top_up,
      h_top_down,
      gamma
    );

    return { forceData };
  }, [
    upstreamLevel,
    downstreamLevel,
    density,
    gravity,
    damHeight,
    inclinationAngle,
  ]);
};
