import { ObjectShape } from '../dominio/tipos';
import { calculateHeight, calculateVolume, calculateVolumeFromBottom } from './volume';

/**
 * Solver hidrostático genérico para corpos imersos.
 *
 * Convenções (todas em SI dentro deste módulo):
 *  - z: altura medida a partir do FUNDO do tanque (m), crescendo para cima.
 *  - Camada B (inferior) ocupa [0, depthB_m]; camada A (superior) ocupa [depthB_m, depthB_m + depthA_m].
 *
 * Diferente da versão anterior, NÃO assume seção transversal constante: o volume
 * submerso é sempre obtido pela geometria real (calota esférica, prisma, cilindro),
 * e a posição de equilíbrio é obtida numericamente (bisseção em E(z) − W = 0).
 */

export interface Corpo {
  shape: ObjectShape;
  dim1_m: number;
  dim2_m: number;
  H_m: number;
  volume: number; // m³
}

export interface Camadas {
  rhoA: number;
  rhoB: number;
  depthA_m: number;
  depthB_m: number; // 0 quando há apenas um fluido
  enableTwoFluids: boolean;
  tankArea_m2: number;
  gravity: number;
}

export interface SubmersaoCorpo {
  h_in_A: number; // m
  h_in_B: number; // m
  vol_A: number; // m³
  vol_B: number; // m³
  E: number; // N
}

export interface EstadoSubmersao {
  corpos: SubmersaoCorpo[];
  deltaH: number; // elevação da superfície livre (m)
  zSuperficie: number; // m
  zInterface: number; // m
  E_total: number; // N
}

export const criarCorpo = (shape: ObjectShape, dim1_m: number, dim2_m: number): Corpo => ({
  shape,
  dim1_m,
  dim2_m,
  H_m: calculateHeight(shape, dim1_m, dim2_m),
  volume: calculateVolume(shape, dim1_m, dim2_m),
});

/**
 * Calcula a submersão de um conjunto de corpos dadas as cotas de suas bases (m, a partir do fundo).
 */
export function calcularSubmersao(corpos: Corpo[], zBases: number[], c: Camadas): EstadoSubmersao {
  const depthB = c.enableTwoFluids ? Math.max(0, c.depthB_m) : 0;
  const depthA = Math.max(0, c.depthA_m);
  const area = c.tankArea_m2 > 0 ? c.tankArea_m2 : Infinity;

  const zInterface = depthB;
  const zSuperficie = depthA + depthB;

  let somaV = 0;
  const resultado: SubmersaoCorpo[] = corpos.map((corpo, i) => {
    const zb = zBases[i];
    const zt = zb + corpo.H_m;

    // Interseção com a camada A [zInterface, zSuperficie] e com a camada B [0, zInterface]
    const h_in_A = Math.max(0, Math.min(zt, zSuperficie) - Math.max(zb, zInterface));
    const h_in_B = c.enableTwoFluids ? Math.max(0, Math.min(zt, zInterface) - Math.max(zb, 0)) : 0;
    const h_sub = h_in_A + h_in_B;

    const vol_total = calculateVolumeFromBottom(corpo.shape, corpo.dim1_m, h_sub, corpo.dim2_m);
    const vol_B = calculateVolumeFromBottom(corpo.shape, corpo.dim1_m, h_in_B, corpo.dim2_m);
    const vol_A = Math.max(0, vol_total - vol_B);

    somaV += vol_total;

    return {
      h_in_A,
      h_in_B,
      vol_A,
      vol_B,
      E: (c.rhoA * vol_A + (c.enableTwoFluids ? c.rhoB * vol_B : 0)) * c.gravity,
    };
  });

  const deltaH = somaV / area;

  return {
    corpos: resultado,
    deltaH,
    zSuperficie,
    zInterface,
    E_total: resultado.reduce((s, r) => s + r.E, 0),
  };
}

/** Bisseção para função monotonicamente não crescente: retorna z em [a,b] onde f muda de sinal. */
function bissecao(f: (z: number) => number, a: number, b: number, alvo: (v: number) => boolean): number {
  let lo = a;
  let hi = b;
  for (let i = 0; i < 80; i++) {
    const mid = 0.5 * (lo + hi);
    if (alvo(f(mid))) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

interface SolucaoSistema {
  zBase: number; // cota da base do corpo mais baixo (m)
  tipo: 'FUNDO' | 'FLUTUA' | 'NEUTRO';
}

/**
 * Resolve o equilíbrio vertical de um sistema rígido (um ou mais corpos com espaçamentos fixos).
 * offsets[i] = distância vertical da base do corpo mais baixo até a base do corpo i.
 */
function resolverSistemaRigido(
  corpos: Corpo[],
  offsets: number[],
  W_total: number,
  c: Camadas
): SolucaoSistema {
  const alturaSistema = Math.max(...corpos.map((cp, i) => offsets[i] + cp.H_m));
  const F = (z: number) => calcularSubmersao(corpos, offsets.map(o => z + o), c).E_total - W_total;

  // Tolerância relativa (0,05%) evita classificar corpos leves como equilíbrio neutro por erro numérico
  const tol = Math.max(1e-7, 5e-4 * W_total);
  const zMax = c.depthA_m + (c.enableTwoFluids ? c.depthB_m : 0) + alturaSistema + 1;

  const F0 = F(0);
  if (F0 < -tol) return { zBase: 0, tipo: 'FUNDO' };

  // Faixa onde |F| <= tol (equilíbrio neutro gera um intervalo positivo de cotas)
  const zBaixo = F0 <= tol ? 0 : bissecao(F, 0, zMax, v => v > tol);
  const zAlto = bissecao(F, 0, zMax, v => v >= -tol);

  if (zAlto - zBaixo > 1e-4) {
    return { zBase: 0.5 * (zBaixo + zAlto), tipo: 'NEUTRO' };
  }
  // Bisseção exata para F(z) = 0 dentro de [zBaixo, zAlto]
  const zExato = bissecao(F, 0, zMax, v => v > 0);
  return { zBase: zExato, tipo: 'FLUTUA' };
}

export interface ResultadoEquilibrio {
  z1_eq: number; // cota da base do bloco 1 (m)
  z2_eq: number; // cota da base do bloco 2 (m) — igual a z1_eq se não houver bloco 2
  gap_m: number; // distância entre topo do bloco 2 e base do bloco 1 (m)
  actualCordLength: number; // comprimento efetivo do cabo esticado (cm)
  status: string;
  d_eq: number; // profundidade da base do corpo mais baixo abaixo da superfície livre (cm)
}

export const calcularEquilibrio = (
  corpo1: Corpo,
  W1: number, // peso do bloco 1 + peso extra (N)
  corpo2: Corpo | null,
  W2: number,
  cordLength_m: number,
  c: Camadas,
  rigidRod: boolean = false
): ResultadoEquilibrio => {
  const profundidadeTotal = c.depthA_m + (c.enableTwoFluids ? c.depthB_m : 0);

  let z1 = 0;
  let z2 = 0;
  let gap = 0;
  let tipo: SolucaoSistema['tipo'];

  if (!corpo2) {
    const sol = resolverSistemaRigido([corpo1], [0], W1, c);
    z1 = z2 = sol.zBase;
    tipo = sol.tipo;
  } else {
    // 1ª hipótese: conector esticado/rígido (bloco 2 abaixo do bloco 1)
    gap = Math.max(0, cordLength_m);
    let sol = resolverSistemaRigido([corpo2, corpo1], [0, corpo2.H_m + gap], W1 + W2, c);
    let est = calcularSubmersao([corpo2, corpo1], [sol.zBase, sol.zBase + corpo2.H_m + gap], c);
    const tracao = W2 - est.corpos[0].E; // tração no cabo (N)

    if (!rigidRod && tracao <= 1e-6) {
      // Bloco 2 não traciona o cabo flexível: cabo frouxo (actualCordLength = 0)
      gap = 0;
      sol = resolverSistemaRigido([corpo2, corpo1], [0, corpo2.H_m], W1 + W2, c);
    } else if (!rigidRod && sol.tipo === 'FUNDO') {
      // Bloco 2 no fundo: verificar se o bloco 1 flutua ou afunda
      const zTenso = corpo2.H_m + gap;
      est = calcularSubmersao([corpo2, corpo1], [0, zTenso], c);
      if (est.corpos[1].E < W1 - 1e-6) {
        const F1 = (z: number) => calcularSubmersao([corpo2, corpo1], [0, z], c).corpos[1].E - W1;
        const zApoio = corpo2.H_m;
        const z1Livre = F1(zApoio) < 0 ? zApoio : bissecao(F1, zApoio, zTenso, v => v > 0);
        gap = Math.max(0, z1Livre - corpo2.H_m);
      }
    }

    z2 = sol.zBase;
    z1 = z2 + corpo2.H_m + gap;
    tipo = sol.tipo;
  }

  // Classificação do estado
  const corpos = corpo2 ? [corpo2, corpo1] : [corpo1];
  const bases = corpo2 ? [z2, z1] : [z1];
  const est = calcularSubmersao(corpos, bases, c);
  const zBaseSistema = Math.min(...bases);
  const zTopoSistema = z1 + corpo1.H_m;

  let status: string;
  if (tipo === 'FUNDO') {
    status = 'AFUNDADO';
  } else if (tipo === 'NEUTRO') {
    status = 'SUSPENSO (EQUILÍBRIO NEUTRO)';
  } else if (!c.enableTwoFluids) {
    status = 'FLUTUANDO';
  } else if (zBaseSistema >= est.zInterface - 1e-6) {
    status = 'FLUTUANDO EM A';
  } else if (zTopoSistema <= est.zSuperficie + 1e-6) {
    status = 'SUSPENSO NA INTERFACE';
  } else {
    status = 'FLUTUANDO NA INTERFACE A/B';
  }

  return {
    z1_eq: z1,
    z2_eq: z2,
    gap_m: gap,
    actualCordLength: gap * 100,
    status,
    d_eq: (profundidadeTotal - zBaseSistema) * 100,
  };
};
