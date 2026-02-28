import { GateShape } from '../types';

export function calculateGateGeometry(
  gateShape: GateShape,
  gateWidth: number,
  gateHeight: number,
  gateSin: number,
  wet_length: number,
  isFullyWet: boolean
) {
  let area = 0;
  let I_xx = 0;
  let y_cg_local = 0; // Distância do topo da comporta até o CG no eixo inclinado

  if (isFullyWet) {
    if (gateShape === GateShape.CIRCULAR) {
      // Círculo Completo (Diâmetro = gateHeight)
      const R = gateHeight / 2;
      area = Math.PI * Math.pow(R, 2);
      I_xx = (Math.PI * Math.pow(R, 4)) / 4;
      y_cg_local = R / gateSin; // Meio do círculo (convertido para inclinado)
    } else if (gateShape === GateShape.SEMI_CIRCULAR) {
      // Semicírculo (Raio = gateHeight, Borda reta em cima)
      const R = gateHeight;
      area = (Math.PI * Math.pow(R, 2)) / 2;
      // I_xx em relação ao centróide
      // I_base = pi*R^4/8. I_cg = I_base - A*d^2. d = 4R/3pi
      const I_base = (Math.PI * Math.pow(R, 4)) / 8;
      const dist_cg = (4 * R) / (3 * Math.PI);
      I_xx = I_base - (area * Math.pow(dist_cg, 2));
      y_cg_local = dist_cg / gateSin;
    } else {
      // Retangular
      area = gateWidth * gateHeight;
      I_xx = (gateWidth * Math.pow(gateHeight, 3)) / 12;
      y_cg_local = (gateHeight / 2) / gateSin;
    }
  } else {
    // Simplificação para parcialmente submerso (trata como retângulo equivalente)
    area = gateWidth * (wet_length * gateSin); // Aproximação retangular da área molhada
    I_xx = (gateWidth * Math.pow(wet_length * gateSin, 3)) / 12; // Aproximação
    y_cg_local = (wet_length / 2); // Meio da parte molhada no eixo inclinado já relativo ao inicio molhado
  }

  return { area, I_xx, y_cg_local };
}
