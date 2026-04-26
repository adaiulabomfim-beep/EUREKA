import { jsPDF } from 'jspdf';
import { PDF_THEME } from './pdfTheme';
import { drawGradientHeader, drawCard, drawSectionTitle, drawInfoRow, drawFooter, drawFormField, drawFormText, drawRichText, drawDataBoxRow, hexToRgb } from './pdfComponents';
import { montarEnunciado } from './montarEnunciado';
import { capturarImagemSimulacao } from './capturarImagemSimulacao';
import { formatarDadosSimulacao, obterDimensoesLimpas } from './formatarDadosSimulacao';
import { forcarDownloadPDF } from './forcarDownloadPDF';
import { capturarLogoEureka } from './capturarLogoEureka';
import { loadPdfIcons, pdfIcons } from './pdfIcons';

export const gerarPDFProvaVisual = async (simulacao, instituicao = '', disciplina = '', professor = '', aluno = '') => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const { pageWidth, margin } = PDF_THEME.layout;
    
    // Fundo da página
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(0, 0, pageWidth, 297, 'F');
    
    const now = new Date();
    const dataFormatada = now.toLocaleDateString('pt-BR');
    const dataHoraText = `${dataFormatada} - ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    // 1. Capturar imagens e carregar ícones dinamicamente EM PARALELO
    let logoImageBase64 = null;
    let imagemBase64 = null;
    try {
      const results = await Promise.all([
        capturarLogoEureka(),
        loadPdfIcons(),
        capturarImagemSimulacao('areaSimulacao').catch(() => null)
      ]);
      logoImageBase64 = results[0];
      imagemBase64 = results[2];
    } catch(e) {
      console.warn("Erro ao gerar recursos visuais:", e);
    }

    // 2. Cabeçalho
    drawGradientHeader(doc, dataHoraText, logoImageBase64);
    
    // Adicionar selo de PROVA
    doc.setFillColor(239, 68, 68); // Red-500
    doc.roundedRect(pageWidth - margin - 40, 5, 40, 6, 2, 2, 'F');
    doc.setFont(PDF_THEME.fonts.main, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('FOLHA DE RESPOSTAS', pageWidth - margin - 20, 9, { align: 'center' });

    let currentY = 45;

    // 2. Informações Gerais
    drawCard(doc, margin, currentY, pageWidth - 2 * margin, 29, 'INFORMAÇÕES GERAIS', 'user', true);
    
    // Informações da linha 1
    const infoY1 = currentY + 15;
    drawFormField(doc, 'Instituição:', instituicao, margin + 5, infoY1, 65);
    drawFormField(doc, 'Disciplina:', disciplina, margin + 75, infoY1, 50);
    drawFormField(doc, 'Professor(a):', professor, margin + 130, infoY1, 45);

    // Informações da linha 2
    const infoY2 = currentY + 24;
    drawFormField(doc, 'Aluno(a):', aluno, margin + 5, infoY2, 120);
    drawFormText(doc, 'Data:', dataFormatada.replace(/\//g, ' / '), margin + 130, infoY2);

    currentY += 36;

    // 3. Descrição do Problema
    drawSectionTitle(doc, '1', 'DESCRIÇÃO DO PROBLEMA', margin, currentY, null); // Sem ícone
    currentY += 8;
    
    const enunciado = montarEnunciado(simulacao);
    currentY = drawRichText(doc, enunciado, margin, currentY, pageWidth - 2 * margin, 5, 10);
    currentY += 10;

    // Layout de 2 Colunas para Visualização e Dados
    const colWidth = (pageWidth - 2 * margin - 5) / 2; // Mantido para uso nas fórmulas
    const availableWidth = pageWidth - 2 * margin - 5;
    const colWidthVis = availableWidth * 0.58;
    const colWidthDad = availableWidth * 0.42;
    
    // 4. Visualização da Simulação
    drawCard(doc, margin, currentY, colWidthVis, 75, 'VISUALIZAÇÃO DA SIMULAÇÃO', 'box');
    
    if (imagemBase64) {
      const imgX = margin + 2;
      const imgY = currentY + 11;
      const imgW = colWidthVis - 4;
      const imgH = 61; // Um pouco menor para caber melhor na borda interna
      doc.addImage(imagemBase64, 'JPEG', imgX, imgY, imgW, imgH);
      
      // Borda sutil na imagem (slate-200)
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.roundedRect(imgX, imgY, imgW, imgH, 2, 2, 'S');
    }

    // 5. Dados da Simulação
    const dados = formatarDadosSimulacao(simulacao);
    const dimensoes = obterDimensoesLimpas(simulacao);
    drawCard(doc, margin + colWidthVis + 5, currentY, colWidthDad, 75, 'DADOS DA SIMULAÇÃO', 'list');
    
    let infoY = currentY + 11;
    const rowHeight = 7.2;
    const boxMarginX = margin + colWidthVis + 9;
    const boxWidth = colWidthDad - 8;
    const spaceY = rowHeight + 1.6;
    
    drawDataBoxRow(doc, boxMarginX, infoY, boxWidth, rowHeight, 'Geometria do Objeto:', dados.geometriaNome);
    infoY += spaceY;
    
    dimensoes.forEach(dim => {
        drawDataBoxRow(doc, boxMarginX, infoY, boxWidth, rowHeight, dim.label + ':', dim.value);
        infoY += spaceY;
    });
    
    drawDataBoxRow(doc, boxMarginX, infoY, boxWidth, rowHeight, 'Densidade do Objeto (po):', dados.densidadeObjetoFmt);
    infoY += spaceY;
    
    drawDataBoxRow(doc, boxMarginX, infoY, boxWidth, rowHeight, 'Densidade do Fluido (pf):', dados.densidadeFluidoFmt);
    infoY += spaceY;
    
    drawDataBoxRow(doc, boxMarginX, infoY, boxWidth, rowHeight, 'Gravidade (g):', '9,81 m/s²');
    infoY += spaceY;
    
    // Tentar calcular Altura Submersa se aplicável (Cubo/Cilindro) e não estiver salvo
    let altSubmersa = 'N/A';
    if (simulacao.alturaSubmersa != null) {
        altSubmersa = `${Number(simulacao.alturaSubmersa).toLocaleString('pt-BR', {minimumFractionDigits:2})} m`;
    } else {
        const hTotalStr = dimensoes.find(d => d.label.includes('Aresta') || d.label.includes('Altura'))?.value;
        if (hTotalStr) {
            const hTotal = parseFloat(hTotalStr.replace(',', '.'));
            const objDes = parseFloat(simulacao.densidadeObjeto) || 0;
            const fluidoDes = parseFloat(simulacao.densidadeFluido) || 0;
            if (objDes < fluidoDes && fluidoDes > 0) {
                const frac = objDes / fluidoDes;
                altSubmersa = `${(hTotal * frac).toLocaleString('pt-BR', {minimumFractionDigits:2})} m`;
            } else {
                altSubmersa = `${hTotal.toLocaleString('pt-BR', {minimumFractionDigits:2})} m`;
            }
        }
    }
    
    drawDataBoxRow(doc, boxMarginX, infoY, boxWidth, rowHeight, 'Altura Submersa (h):', altSubmersa);
    infoY += spaceY;
    
    drawDataBoxRow(doc, boxMarginX, infoY, boxWidth, rowHeight, 'Volume Submerso:', `${Number(simulacao.volumeDeslocado || 0).toLocaleString('pt-BR', {minimumFractionDigits:4})} m³`);

    currentY += 85;

    // Espaço para Cálculos na Prova
    drawSectionTitle(doc, '2', 'CÁLCULOS E RESULTADOS', margin, currentY, 'zap');
    currentY += 5;
    
    drawCard(doc, margin, currentY, pageWidth - 2 * margin, 80);
    
    doc.setFont(PDF_THEME.fonts.main, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(hexToRgb(PDF_THEME.colors.textLight).r, hexToRgb(PDF_THEME.colors.textLight).g, hexToRgb(PDF_THEME.colors.textLight).b);
    doc.text('Utilize este espaço para desenvolver seus cálculos.', margin + 5, currentY + 7);
    
    // Linhas para o aluno preencher
    const linhasResultadosY = currentY + 55;
    doc.text('Peso Real (P): _____________________', margin + 5, linhasResultadosY);
    doc.text('Empuxo (E): ______________________', margin + 70, linhasResultadosY);
    doc.text('Peso Aparente: ____________________', margin + 135, linhasResultadosY);
    doc.text('Condição (Afunda/Flutua/Equilíbrio): _________________________', margin + 5, linhasResultadosY + 15);

    // 9. Rodapé
    drawFooter(doc, dataHoraText);

    forcarDownloadPDF(doc, `Avaliacao_EUREKA_${now.getTime()}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar PDF de prova:", error);
    alert("Houve um erro ao gerar o PDF. Verifique o console.");
  }
};
