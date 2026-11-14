import { RelatorioVisualEureka } from '../../components/relatorios/RelatorioVisualEureka';
import { exportSimulacaoPdf } from './renderReactToPdf';

export const gerarPDFMaterialEstudo = async (simulacao) => {
  await exportSimulacaoPdf({
    Component: RelatorioVisualEureka,
    simulacao,
    prefixoArquivo: 'Material_de_Estudo',
  });
};
