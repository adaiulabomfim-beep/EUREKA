export const calculateGravityStability = (
  damHeight: number,
  damBaseWidth: number,
  damCrestWidth: number,
  upstreamLevel: number,
  downstreamLevel: number,
  FR_net: number,
  y_cp_net: number,
  gammaConcrete: number = 24000 // N/m³
) => {
  // Área da seção trapezoidal
  const area = ((damBaseWidth + damCrestWidth) / 2) * damHeight;
  
  // Peso próprio (por metro de largura)
  const weight = area * gammaConcrete;
  
  // Centroide da seção trapezoidal (x_cg)
  // Assumindo que a base está centrada em x=0, a base vai de -damBaseWidth/2 a damBaseWidth/2
  const y_cg = (damHeight / 3) * ((damBaseWidth + 2 * damCrestWidth) / (damBaseWidth + damCrestWidth));
  const x_cg = 0; // Assumindo simetria para o centroide horizontal
  
  // Braço de alavanca do peso em relação ao pé de jusante (x = damBaseWidth/2)
  const arm_weight = (damBaseWidth / 2) - x_cg;
  
  // Momento resistente (em relação ao pé de jusante)
  const moment_resisting = weight * arm_weight;
  
  // Momento de tombamento (em relação ao pé de jusante)
  // FR_net atua a uma altura y_cp_net do fundo.
  // O braço de alavanca é y_cp_net.
  const moment_overturning = FR_net * y_cp_net;
  
  // Fatores de segurança
  const fs_tomb = moment_resisting / Math.max(1e-9, moment_overturning);
  
  // Atrito (mu = 0.7)
  const mu = 0.7;
  const fs_desl = (mu * weight) / Math.max(1e-9, FR_net);
  
  // Resultante na base
  const e = (moment_overturning - moment_resisting) / weight;
  
  return {
    area,
    weight,
    x_cg,
    y_cg,
    moment_resisting,
    moment_overturning,
    fs_tomb,
    fs_desl,
    e
  };
};
