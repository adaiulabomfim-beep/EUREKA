export const MENSAGEM_BLOQUEIO_ATIVIDADE = {
  titulo: 'Vai colocar as respostas na prova? 😆',
  orientacao: 'Reinicie a simulação antes de exportar a Atividade de Aprendizagem!',
};

export const simulacaoPossuiResultadosAtivos = (simulacao) => {
  if (!simulacao || typeof simulacao !== 'object') return false;

  if (simulacao.tipo === 'corpos-imersos') {
    if (typeof simulacao.isSimulating === 'boolean') {
      return simulacao.isSimulating;
    }
    if (typeof simulacao.isAnalyzed === 'boolean') {
      return simulacao.isAnalyzed;
    }
    return Boolean(
      simulacao.analyzedResults ||
        Number(simulacao.empuxo) > 0 ||
        Number(simulacao.volumeDeslocado) > 0 ||
        Number(simulacao.alturaSubmersa) > 0
    );
  }

  return Boolean(simulacao.isAnalyzed || simulacao.analyzedResults);
};

export const validarExportacaoAtividadeAprendizagem = (simulacao) => {
  if (simulacaoPossuiResultadosAtivos(simulacao)) {
    return {
      permitido: false,
      titulo: MENSAGEM_BLOQUEIO_ATIVIDADE.titulo,
      orientacao: MENSAGEM_BLOQUEIO_ATIVIDADE.orientacao,
    };
  }

  return {
    permitido: true,
    titulo: null,
    orientacao: null,
  };
};
