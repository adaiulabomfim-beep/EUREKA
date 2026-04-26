import { jsPDF } from 'jspdf';
import { formatarDadosSimulacao, adicionarCabecalhoAcademico } from './formatarDadosSimulacao';
import { montarEnunciado } from './montarEnunciado';
import { forcarDownloadPDF } from './forcarDownloadPDF';

export const gerarPDFGabarito = async (simulacao, elementId = 'areaSimulacao') => {
  const dados = formatarDadosSimulacao(simulacao);
  const pdf = new jsPDF('p', 'mm', 'a4');

  let startY = adicionarCabecalhoAcademico(pdf, 'GABARITO: Lista de Exercícios', false);

  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  pdf.text(`Material Exclusivo do Professor`, 20, startY);
  startY += 10;

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

  startY += 10;
  
  pdf.setFont('times', 'bold');
  pdf.text("--- GABARITO FINAL ---", 20, startY);
  pdf.setFont('times', 'normal');
  startY += 10;

  pdf.text(`a) P = ${dados.pesoFmt}`, 20, startY); startY += 8;
  pdf.text(`b) E = ${dados.empuxoFmt}`, 20, startY); startY += 8;
  pdf.text(`c) Pap = ${dados.pesoAparenteFmt}`, 20, startY); startY += 12;
  
  const textAnalise = pdf.splitTextToSize(`d) Conclusão: ${dados.statusFisico}`, 170);
  pdf.text(textAnalise, 20, startY);

  forcarDownloadPDF(pdf, `Gabarito_Empuxo_${new Date().getTime()}.pdf`);
};
