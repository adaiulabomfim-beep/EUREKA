import { capturarImagemSimulacao } from './capturarImagemSimulacao';
import { RelatorioProvaEureka } from '../../components/relatorios/RelatorioProvaEureka';
import { renderReactToPdf } from './renderReactToPdf';

export const gerarPDFGabaritoVisual = async (simulacao) => {
  const now = new Date();
  const dataText = now.toLocaleDateString('pt-BR') + ' - ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const filename = `Gabarito_EUREKA_${now.getTime()}.pdf`;

  let imagemBase64 = null;
  try {
    imagemBase64 = await capturarImagemSimulacao('areaSimulacao');
  } catch (e) {
    console.warn("Erro ao capturar imagem da simulação:", e);
  }

  await renderReactToPdf(
    RelatorioProvaEureka, 
    { simulacao, imagemSimulacao: imagemBase64, dataText, isGabarito: true }, 
    filename
  );
};
