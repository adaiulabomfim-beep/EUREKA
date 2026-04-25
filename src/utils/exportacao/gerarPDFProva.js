import { jsPDF } from 'jspdf';
import { formatarDadosSimulacao, adicionarCabecalhoAcademico, adicionarImagemSimulacaoNoPDF } from './formatarDadosSimulacao';
import { montarEnunciado } from './montarEnunciado';

export const gerarPDFProva = async (simulacao, elementId = 'areaSimulacao') => {
  const dados = formatarDadosSimulacao(simulacao);
  const pdf = new jsPDF('p', 'mm', 'a4');

  let startY = adicionarCabecalhoAcademico(pdf, 'Lista de Exercícios: Empuxo', true);

  const enunciado = montarEnunciado(dados);
  const splitText = pdf.splitTextToSize(enunciado, 170);
  pdf.text(splitText, 20, startY);
  startY += (splitText.length * 6) + 4;

  const perguntas = [
    "a) O peso do bloco.",
    "b) O empuxo exercido pelo fluido.",
    "c) O peso aparente do bloco.",
    "d) Se o corpo flutua, afunda ou permanece em equilíbrio. Justifique."
  ];

  perguntas.forEach(p => {
    pdf.text(p, 20, startY);
    startY += 8;
  });

  startY += 4;

  pdf.setFont('times', 'bold');
  pdf.text("Dados:", 20, startY);
  pdf.setFont('times', 'normal');
  startY += 6;
  pdf.text(`rho_fluido = ${dados.densidadeFluidoFmt}`, 20, startY); startY += 6;
  if (dados.tipo === 'corpos-imersos') {
      pdf.text(`rho_obj = ${dados.densidadeObjetoFmt}`, 20, startY); startY += 6;
  }
  pdf.text(`g = 9,81 m/s^2`, 20, startY); startY += 8;

  pdf.setFont('times', 'bold');
  pdf.text("Fórmulas úteis:", 20, startY);
  pdf.setFont('times', 'normal');
  startY += 6;
  pdf.text("P = rho_obj * g * V_total", 20, startY); startY += 6;
  pdf.text("E = rho_fluido * g * V_submerso", 20, startY); startY += 6;
  pdf.text("Pap = P - E", 20, startY); startY += 10;

  startY = await adicionarImagemSimulacaoNoPDF(pdf, elementId, startY);

  if (startY > 240) { pdf.addPage(); startY = 20; }
  
  pdf.setFont('times', 'bold');
  pdf.text("Resolução:", 20, startY);
  startY += 6;

  pdf.setDrawColor(180, 200, 230);
  pdf.setLineWidth(0.5);
  pdf.setFillColor(252, 253, 255);
  
  let boxHeight = 280 - startY;
  if (boxHeight < 60) {
      pdf.addPage();
      startY = 20;
      pdf.setFont('times', 'bold');
      pdf.text("Resolução:", 20, startY);
      startY += 6;
      boxHeight = 280 - startY;
  }

  pdf.roundedRect(20, startY, 170, boxHeight, 3, 3, 'FD');

  pdf.save(`Prova_Empuxo_${new Date().getTime()}.pdf`);
};
