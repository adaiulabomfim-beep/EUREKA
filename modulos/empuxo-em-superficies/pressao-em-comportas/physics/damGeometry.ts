import { DamType } from '../types';

export interface DamGeometry {
  getWetProperties(yWet: number, width: number): { A_wet: number, ybar: number, Ixx: number };
}

export function getDamGeometry(type: DamType): DamGeometry {
  return {
    getWetProperties: (yWet: number, width: number) => {
      let A_wet = 0;
      let ybar = 0;
      let Ixx = 0;

      switch (type) {
        case DamType.GRAVITY:
        case DamType.ARCH:
          // Simplificação: face retangular
          A_wet = width * yWet;
          ybar = yWet / 2;
          Ixx = (width * Math.pow(yWet, 3)) / 12;
          break;
        case DamType.EMBANKMENT:
          // Simplificação: face trapezoidal (considerando base e topo variáveis)
          // Para o cálculo hidrostático na face, ainda podemos usar a aproximação retangular se a inclinação for constante
          A_wet = width * yWet;
          ybar = yWet / 2;
          Ixx = (width * Math.pow(yWet, 3)) / 12;
          break;
        case DamType.BUTTRESS:
          // Simplificação: face com contrafortes
          A_wet = width * yWet;
          ybar = yWet / 2;
          Ixx = (width * Math.pow(yWet, 3)) / 12;
          break;
      }
      return { A_wet, ybar, Ixx };
    }
  };
}
