import { ConfiguracaoSimulacaoComporta } from '../dominio/configuracao';
import {
  ComportamentoHidraulicoResultado,
  CondicaoOperacionalResultado,
  ResultadoSimulacaoComporta,
} from '../dominio/resultado';
import {
  EstadoOperacionalComporta,
  FormaComporta,
  ModoPosicionamentoComporta,
  PosicaoDobradica,
} from '../dominio/tipos';
import { calculateNetForce, getGateYBarTotal } from './hidrostatica';
import { calcularMomentos, resolverProfundidadeEquilibrioRbZero } from './momentos';

export function resolverGrauAberturaPercent(
  comporta: ConfiguracaoSimulacaoComporta['comporta']
): number {
  if (!comporta.ativa) {
    return 100;
  }
  if (typeof comporta.aberturaPercent === 'number' && Number.isFinite(comporta.aberturaPercent)) {
    return Math.max(0, Math.min(100, Math.round(comporta.aberturaPercent)));
  }
  return 0;
}

function calcularAreaLivreAbertura(
  forma: FormaComporta,
  altura: number,
  areaTotal: number,
  fracaoAbertura: number
): number {
  if (fracaoAbertura <= 0) return 0;
  if (fracaoAbertura >= 1) return areaTotal;

  if (forma === FormaComporta.CIRCULAR) {
    const r = altura / 2;
    const d = Math.max(0, Math.min(2 * r, fracaoAbertura * altura));
    if (r <= 1e-6) return 0;
    const ratio = Math.max(-1, Math.min(1, d / (2 * r)));
    const areaSobreposicao =
      2 * r * r * Math.acos(ratio) - (d / 2) * Math.sqrt(Math.max(0, 4 * r * r - d * d));
    return Math.max(0, Math.min(areaTotal, areaTotal - areaSobreposicao));
  }

  if (forma === FormaComporta.SEMI_CIRCULAR) {
    const r = altura;
    const d = Math.max(0, Math.min(r, fracaoAbertura * r));
    if (r <= 1e-6) return 0;
    const ratio = Math.max(-1, Math.min(1, d / r));
    const areaDescoberta = d * Math.sqrt(Math.max(0, r * r - d * d)) + r * r * Math.asin(ratio);
    return Math.max(0, Math.min(areaTotal, areaDescoberta));
  }

  return Math.max(0, Math.min(areaTotal, fracaoAbertura * areaTotal));
}

export function simularComportas(config: ConfiguracaoSimulacaoComporta): ResultadoSimulacaoComporta {
  const { fluidoMontante, fluidoJusante, comporta } = config;
  const angulo = comporta.angulo || 90;
  const sinTheta = Math.sin((angulo * Math.PI) / 180);
  const ybarTotal = getGateYBarTotal(comporta.forma, comporta.altura);

  // 1. Determina h_topo e Y_CG conforme o Modo de Posicionamento:
  let h_top_up = comporta.profundidadeTopo;
  let directY_CG_up: number | undefined = undefined;

  if (comporta.modoPosicionamento === ModoPosicionamentoComporta.Y_CG_DIRETO && comporta.y_cg_direto !== undefined) {
    directY_CG_up = comporta.y_cg_direto;
    const h_CG = directY_CG_up * sinTheta;
    h_top_up = h_CG - ybarTotal * sinTheta;
  }

  const y_top = fluidoMontante.nivel - h_top_up;
  const y_bot = Math.max(0, y_top - comporta.altura * sinTheta);

  // Gammas independentes por lado
  const gammaUp = fluidoMontante.pesoEspecifico ?? (fluidoMontante.densidade * fluidoMontante.gravidade);
  const gammaDown = fluidoJusante.pesoEspecifico ?? (fluidoJusante.densidade * fluidoJusante.gravidade);

  const isFloorSupport = Boolean(
    comporta.apoioFundoLiso && comporta.posicaoDobradica === PosicaoDobradica.TOP
  );
  const grauAberturaInicial = resolverGrauAberturaPercent(comporta);

  let h_jusante_eq: number | undefined = undefined;
  if (isFloorSupport && fluidoJusante.ativo) {
    h_jusante_eq = resolverProfundidadeEquilibrioRbZero(
      config,
      h_top_up,
      gammaUp,
      gammaDown,
      directY_CG_up
    );
  }

  // Jusante: se inativo, desconsidera explicitamente
  let hasDownstream = Boolean(fluidoJusante.ativo && fluidoJusante.nivel > 0);
  let nivelJusante = hasDownstream ? fluidoJusante.nivel : 0;

  if (
    isFloorSupport &&
    comporta.resolverProfundidadeRbZero &&
    fluidoJusante.ativo &&
    h_jusante_eq !== undefined &&
    grauAberturaInicial < 100
  ) {
    hasDownstream = h_jusante_eq > 0;
    nivelJusante = y_bot + h_jusante_eq;
  }

  const h_top_down = hasDownstream ? (nivelJusante - y_top) : -1e6;

  // Cálculos hidrostáticos validados da seção
  const forceData = calculateNetForce(
    comporta.altura,
    comporta.largura,
    angulo,
    h_top_up,
    h_top_down,
    gammaUp,
    gammaDown,
    comporta.forma,
    directY_CG_up,
    hasDownstream
  );

  // 2. Condição operacional da comporta e comportamento hidráulico
  const grauAberturaPercent = resolverGrauAberturaPercent(comporta);
  const fracaoAbertura = grauAberturaPercent / 100;

  const estado: EstadoOperacionalComporta =
    grauAberturaPercent <= 0
      ? EstadoOperacionalComporta.FECHADA
      : grauAberturaPercent >= 100
      ? EstadoOperacionalComporta.ABERTA
      : EstadoOperacionalComporta.PARCIALMENTE_ABERTA;

  const estadoLabel =
    estado === EstadoOperacionalComporta.FECHADA
      ? 'Fechada'
      : estado === EstadoOperacionalComporta.PARCIALMENTE_ABERTA
      ? 'Parcialmente aberta'
      : 'Aberta';

  const alturaAberturaInclinada = fracaoAbertura * comporta.altura;
  const alturaLivreVertical = alturaAberturaInclinada * sinTheta;
  const areaTotal = forceData.up.area;
  const areaAberturaLivre = calcularAreaLivreAbertura(
    comporta.forma,
    comporta.altura,
    areaTotal,
    fracaoAbertura
  );
  const areaBloqueada = Math.max(0, areaTotal - areaAberturaLivre);

  const nivelMontante = fluidoMontante.nivel;
  const diferencaNivel = nivelMontante - nivelJusante;
  const temAguaNaAbertura = nivelMontante > 0 && (h_top_up + comporta.altura * sinTheta) > 1e-4;
  const passagemAgua = estado !== EstadoOperacionalComporta.FECHADA && temAguaNaAbertura && Math.abs(diferencaNivel) > 1e-4;

  let sentidoEscoamento = 'Sem escoamento (comporta fechada)';
  if (estado !== EstadoOperacionalComporta.FECHADA) {
    if (!temAguaNaAbertura) {
      sentidoEscoamento = 'Sem escoamento (abertura acima do nível de água)';
    } else if (diferencaNivel > 1e-4) {
      sentidoEscoamento = 'Montante → Jusante';
    } else if (diferencaNivel < -1e-4) {
      sentidoEscoamento = 'Jusante → Montante (desnível reverso)';
    } else {
      sentidoEscoamento = 'Níveis equalizados (sem desnível motriz)';
    }
  }

  const condicaoPassagem =
    estado === EstadoOperacionalComporta.FECHADA
      ? 'Bloqueada (sem passagem de água)'
      : estado === EstadoOperacionalComporta.PARCIALMENTE_ABERTA
      ? passagemAgua
        ? 'Passagem parcial pela seção livre'
        : 'Abertura parcial sem escoamento ativo'
      : passagemAgua
      ? hasDownstream
        ? 'Passagem livre (descarga submersa a jusante)'
        : 'Passagem livre (descarga livre para jusante)'
      : 'Abertura total sem escoamento ativo';

  const interpretacaoAutomatica =
    estado === EstadoOperacionalComporta.FECHADA
      ? 'A comporta encontra-se fechada, impedindo a passagem de água pela abertura. A análise apresenta a distribuição de pressão hidrostática e os esforços atuantes sobre a superfície molhada.'
      : estado === EstadoOperacionalComporta.PARCIALMENTE_ABERTA
      ? 'A comporta encontra-se parcialmente aberta, permitindo a passagem de água pela seção livre disponível. A condição de escoamento depende da abertura e das condições hidráulicas de montante e jusante.'
      : 'A comporta encontra-se aberta, permitindo a passagem de água do reservatório para a região de jusante. A abertura altera a condição de escoamento e deve ser considerada na interpretação do comportamento hidráulico.';

  let regimeQualitativo = 'Estático (bloqueio total)';
  let descricaoHidraulica =
    'A comporta fechada impede a passagem de fluido; não há escoamento através da seção.';

  if (estado === EstadoOperacionalComporta.PARCIALMENTE_ABERTA) {
    if (!temAguaNaAbertura) {
      regimeQualitativo = 'Sem carga hidráulica na abertura';
      descricaoHidraulica =
        'O nível de montante não atinge a abertura livre disponível; não há escoamento pela seção.';
    } else if (diferencaNivel > 1e-4) {
      regimeQualitativo = hasDownstream ? 'Escoamento parcial afogado/submerso' : 'Escoamento parcial sob carga';
      descricaoHidraulica = `Passagem restrita à altura livre de ${alturaLivreVertical.toFixed(2)} m (área livre de ${areaAberturaLivre.toFixed(4)} m²) sob desnível Δh = ${diferencaNivel.toFixed(2)} m. Vazão (Q) e velocidade (v) não são estimadas sem coeficiente de descarga (Cd).`;
    } else if (diferencaNivel < -1e-4) {
      regimeQualitativo = 'Desnível reverso (jusante > montante)';
      descricaoHidraulica = `Nível de jusante supera o de montante em ${Math.abs(diferencaNivel).toFixed(2)} m na abertura parcial.`;
    } else {
      regimeQualitativo = 'Níveis equalizados (Δh = 0,00 m)';
      descricaoHidraulica =
        'Os níveis de montante e jusante encontram-se equalizados, sem gradiente hidráulico para escoamento contínuo.';
    }
  } else if (estado === EstadoOperacionalComporta.ABERTA) {
    if (!temAguaNaAbertura) {
      regimeQualitativo = 'Sem carga hidráulica na abertura';
      descricaoHidraulica =
        'A abertura encontra-se acima da superfície livre de montante; não há escoamento pela seção.';
    } else if (diferencaNivel > 1e-4) {
      regimeQualitativo = hasDownstream ? 'Escoamento livre com nível a jusante' : 'Escoamento livre pela abertura';
      descricaoHidraulica = `Seção totalmente desobstruída (área livre de ${areaAberturaLivre.toFixed(4)} m²) com desnível Δh = ${diferencaNivel.toFixed(2)} m entre montante e jusante. Este módulo adota formulação hidrostática e não estima vazão (Q) nem velocidade (v) sem dados hidráulicos de perda/Cd.`;
    } else if (diferencaNivel < -1e-4) {
      regimeQualitativo = 'Desnível reverso (jusante > montante)';
      descricaoHidraulica = `Nível de jusante supera o de montante em ${Math.abs(diferencaNivel).toFixed(2)} m com a comporta totalmente aberta.`;
    } else {
      regimeQualitativo = 'Níveis equalizados (Δh = 0,00 m)';
      descricaoHidraulica =
        'Montante e jusante estão no mesmo nível; ausência de desnível motriz para descarga.';
    }
  }

  const operacao: CondicaoOperacionalResultado = {
    estado,
    estadoLabel,
    grauAberturaPercent,
    alturaAberturaInclinada,
    alturaLivreVertical,
    areaAberturaLivre,
    areaBloqueada,
    passagemAgua,
    condicaoPassagem,
    sentidoEscoamento,
    interpretacaoAutomatica,
  };

  const hidraulica: ComportamentoHidraulicoResultado = {
    alturaAbertura: alturaLivreVertical,
    alturaAberturaInclinada,
    areaLivrePassagem: areaAberturaLivre,
    diferencaNivel,
    nivelMontante,
    nivelJusanteEfetivo: nivelJusante,
    jusanteAtiva: hasDownstream,
    regimeQualitativo,
    descricaoHidraulica,
    calculaVazao: false,
  };

  const resultados: ResultadoSimulacaoComporta = {
    sistemaUnidades: config.sistemaUnidades,
    modoPosicionamento: comporta.modoPosicionamento,
    gammaUp,
    gammaDown,
    densityUp: fluidoMontante.densidade,
    densityDown: fluidoJusante.densidade,
    h_top_up,
    Y_CG_up: forceData.up.Y_CG || directY_CG_up || 0,
    forceData: {
      ...forceData
    },
    equilibrium: {
      M_hinge: 0,
      F_tie: 0,
      apoioParedeAtivo: Boolean(comporta.apoioParedeLisa),
      apoioFundoAtivo: isFloorSupport,
      articulacaoParedeVerticalA: Boolean(comporta.articulacaoParedeVerticalA),
      resolverProfundidadeRbZero: Boolean(isFloorSupport && comporta.resolverProfundidadeRbZero),
      P_apoio: 0,
      R_B: 0,
      h_jusante_eq,
      Rx_hinge: 0,
      Ry_hinge: 0,
      R_hinge: 0,
    },
    operacao,
    hidraulica,
  };

  const calculatedEq =
    estado === EstadoOperacionalComporta.ABERTA
      ? {
          M_hinge: 0,
          F_tie: 0,
          apoioParedeAtivo: Boolean(comporta.apoioParedeLisa),
          apoioFundoAtivo: isFloorSupport,
          articulacaoParedeVerticalA: Boolean(comporta.articulacaoParedeVerticalA),
          resolverProfundidadeRbZero: Boolean(isFloorSupport && comporta.resolverProfundidadeRbZero),
          P_apoio: 0,
          R_B: 0,
          Rx_hinge: 0,
          Ry_hinge: 0,
          R_hinge: 0,
        }
      : calcularMomentos(config, resultados);

  return {
    ...resultados,
    equilibrium: {
      ...calculatedEq,
      h_jusante_eq,
    },
  };
}
