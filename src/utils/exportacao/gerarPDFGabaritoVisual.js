import { jsPDF } from 'jspdf';
import { PDF_THEME } from './pdfTheme';
import { drawGradientHeader, drawCard, drawSectionTitle, drawInfoRow, drawFooter, drawFormField, drawFormText, drawRichText, drawDataBoxRow, drawFormulaBox, drawResultBox, drawConditionBox, hexToRgb } from './pdfComponents';
import { montarEnunciado } from './montarEnunciado';
import { capturarImagemSimulacao } from './capturarImagemSimulacao';
import { formatarDadosSimulacao, obterDimensoesLimpas } from './formatarDadosSimulacao';
import { forcarDownloadPDF } from './forcarDownloadPDF';
import { capturarLogoEureka } from './capturarLogoEureka';
import { loadPdfIcons, pdfIcons } from './pdfIcons';

export const gerarPDFGabaritoVisual = async (simulacao, instituicao = '', disciplina = '', professor = '', aluno = '') => {
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

    // Adicionar selo de GABARITO
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.roundedRect(pageWidth - margin - 30, 5, 30, 6, 2, 2, 'F');
    doc.setFont(PDF_THEME.fonts.main, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('GABARITO', pageWidth - margin - 15, 9, { align: 'center' });

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

    // 6. Fórmulas e 7. Resultados
    drawCard(doc, margin, currentY, colWidth, 55, 'FÓRMULAS UTILIZADAS', 'zap', true);
    drawCard(doc, margin + colWidth + 5, currentY, colWidth, 55, 'RESULTADOS OBTIDOS', 'barChart', true);
    
    let formY = currentY + 12;
    const boxW = colWidth - 8;
    const formBoxH = 12;
    const formSpace = formBoxH + 2;
    
    drawFormulaBox(doc, margin + 4, formY, boxW, formBoxH, 'Peso (P):', 'P = po \u00B7 g \u00B7 Vtotal');
    formY += formSpace;
    
    drawFormulaBox(doc, margin + 4, formY, boxW, formBoxH, 'Empuxo (E):', 'E = pf \u00B7 g \u00B7 Vsubmerso');
    formY += formSpace;
    
    drawFormulaBox(doc, margin + 4, formY, boxW, formBoxH, 'Peso Aparente (Pap):', 'Pap = P - E');
    
    // Resultados
    let resY = currentY + 12;
    const resBoxH = 9;
    const resSpace = resBoxH + 1.5;
    const resX = margin + colWidth + 9;
    
    drawResultBox(doc, resX, resY, boxW, resBoxH, 'Peso Real (P):', dados.pesoFmt, '#EF4444');
    resY += resSpace;
    
    drawResultBox(doc, resX, resY, boxW, resBoxH, 'Empuxo (E):', dados.empuxoFmt, '#10B981');
    resY += resSpace;
    
    drawResultBox(doc, resX, resY, boxW, resBoxH, 'Peso Aparente (Pap):', dados.pesoAparenteFmt, '#3B82F6');
    resY += resSpace;
    
    // Condição
    const isEquilibrio = dados.statusFisico.includes('EQUILÍBRIO');
    const isAfunda = dados.statusFisico.includes('AFUNDAR');
    let cond = isAfunda ? 'AFUNDA' : (isEquilibrio ? 'EQUILÍBRIO' : 'FLUTUA');
    let subTxt = isAfunda ? '(P > E)' : (isEquilibrio ? '(P = E)' : '(P < E)');
    
    drawConditionBox(doc, resX, resY, boxW, 12, cond, subTxt);
    
    currentY += 60;

    // 8. Análise Qualitativa
    drawCard(doc, margin, currentY, pageWidth - 2 * margin, 30, 'ANÁLISE QUALITATIVA', 'shieldCheck');
    
    doc.setFont(PDF_THEME.fonts.main, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(hexToRgb(PDF_THEME.colors.textMain).r, hexToRgb(PDF_THEME.colors.textMain).g, hexToRgb(PDF_THEME.colors.textMain).b);
    
    let textAnalise = "";
    if (isAfunda) {
        textAnalise = "Como o peso do corpo (P) é maior que o empuxo máximo (E), a força resultante é dirigida para baixo. Assim, o corpo tenderá a AFUNDAR no fluido.";
    } else if (isEquilibrio) {
        textAnalise = "Como o peso do corpo e o empuxo possuem mesmo módulo (P = E), o corpo permanece em EQUILÍBRIO no fluido.";
    } else {
        textAnalise = "Como o empuxo máximo é maior que o peso do corpo, a força resultante aponta para cima inicialmente. Assim, o corpo tenderá a FLUTUAR, deslocando apenas o volume necessário para que P = E.";
    }
    
    const splitAnalise = doc.splitTextToSize(textAnalise, pageWidth - 2 * margin - 10);
    doc.text(splitAnalise, margin + 5, currentY + 12);

    // 9. Rodapé
    drawFooter(doc, dataHoraText);

    forcarDownloadPDF(doc, `Gabarito_EUREKA_${now.getTime()}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar PDF de gabarito:", error);
    alert("Houve um erro ao gerar o PDF. Verifique o console.");
  }
};
