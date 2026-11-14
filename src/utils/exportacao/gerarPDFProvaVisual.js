import { RelatorioProvaEureka } from '../../components/relatorios/RelatorioProvaEureka';
import { exportSimulacaoPdf } from './renderReactToPdf';
import { validarExportacaoAtividadeAprendizagem } from './validarAtividadeAprendizagem';

export const gerarPDFAtividadeAprendizagem = async (simulacao) => {
  const validacao = validarExportacaoAtividadeAprendizagem(simulacao);
  if (!validacao.permitido) {
    return { exported: false, blocked: true, ...validacao };
  }

  await exportSimulacaoPdf({
    Component: RelatorioProvaEureka,
    simulacao,
    prefixoArquivo: 'Atividade_Aprendizagem',
  });

  return { exported: true, blocked: false };
};
