import { capturarImagemSimulacao } from './capturarImagemSimulacao';
import { RelatorioVisualEureka } from '../../components/relatorios/RelatorioVisualEureka';
import { renderReactToPdf } from './renderReactToPdf';

export const gerarPDFEstudoVisual = async (simulacao) => {
  const now = new Date();
  const dataText = now.toLocaleDateString('pt-BR') + ' - ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const filename = `Relatorio_Estudo_EUREKA_${now.getTime()}.pdf`;

  let imagemBase64 = null;
  try {
    imagemBase64 = await capturarImagemSimulacao('areaSimulacao');
  } catch (e) {
    console.warn("Erro ao capturar imagem da simulação:", e);
  }

  await renderReactToPdf(
    RelatorioVisualEureka, 
    { simulacao, imagemSimulacao: imagemBase64, dataText }, 
    filename
  );
};
