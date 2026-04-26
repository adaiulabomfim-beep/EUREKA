import { PDF_THEME } from './pdfTheme';
import { pdfIcons } from './pdfIcons';

// Função auxiliar para converter Hex em RGB
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Desenhar fundo em degradê
export const drawGradientHeader = (doc, dataText, logoImageBase64) => {
  const { pageWidth, headerHeight } = PDF_THEME.layout;
  
  // 1. Fundo Degradê Azul para Ciano
  const startColor = hexToRgb('#2563EB'); // blue-600
  const endColor = hexToRgb('#06B6D4'); // cyan-500
  const steps = 150;
  for (let i = 0; i <= pageWidth; i += pageWidth / steps) {
    const ratio = i / pageWidth;
    const r = Math.round(startColor.r + ratio * (endColor.r - startColor.r));
    const g = Math.round(startColor.g + ratio * (endColor.g - startColor.g));
    const b = Math.round(startColor.b + ratio * (endColor.b - startColor.b));
    doc.setFillColor(r, g, b);
    doc.rect(i, 0, pageWidth / steps + 0.5, headerHeight, 'F');
  }

  // 2. Caixa "Glassmorphism" para o ícone Waves (Aumentada para alinhar com texto duplo)
  const boxX = PDF_THEME.layout.margin;
  const boxY = 6; 
  const boxSize = 18; // Tamanho maior para englobar logo + subtítulo
  doc.setFillColor(255, 255, 255);
  doc.setGState(new doc.GState({ opacity: 0.15 }));
  doc.roundedRect(boxX, boxY, boxSize, boxSize, 3.5, 3.5, 'F');
  doc.setGState(new doc.GState({ opacity: 0.3 }));
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.roundedRect(boxX, boxY, boxSize, boxSize, 3.5, 3.5, 'S');
  doc.setGState(new doc.GState({ opacity: 1.0 })); // reset
  
  if (pdfIcons.wavesWhite) {
    // Ícone centralizado na caixa maior
    doc.addImage(pdfIcons.wavesWhite, 'PNG', boxX + 3.5, boxY + 3.5, 11, 11);
  }
  
  // 3. Desenhar Logo EUREKA
  const textLeftX = boxX + boxSize + 4;
  if (logoImageBase64) {
    // Logo começando próximo ao topo da caixa
    doc.addImage(logoImageBase64, 'PNG', textLeftX - 1, boxY + 1.5, 46, 11.5);
  }

  // 4. Subtítulo (Alinhado com o EUREKA e na base da caixa)
  doc.setTextColor(255, 255, 255);
  doc.setFont(PDF_THEME.fonts.main, 'bold');
  doc.setFontSize(8.5);
  // Alinhado com textLeftX (embaixo do E), posicionado um pouco acima da base da caixa
  doc.text('Laboratório Virtual de Hidrostática e Empuxo', textLeftX + 0.5, boxY + boxSize - 2);

  // 5. Informações à direita (Alinhadas à esquerda em um bloco)
  const rightSectionX = pageWidth - PDF_THEME.layout.margin - 75; // Ponto de partida do bloco direito
  doc.setFontSize(8.5);
  
  // Linha 1 (Data)
  doc.setFont(PDF_THEME.fonts.main, 'normal');
  const dataFullText = `Data da Simulação: ${dataText}`;
  if (pdfIcons.calendarWhite) {
    doc.addImage(pdfIcons.calendarWhite, 'PNG', rightSectionX, 10, 3.5, 3.5);
  }
  doc.text(dataFullText, rightSectionX + 5, 13);
  
  // Linha 2 e 3 (Relatório)
  if (pdfIcons.fileTextWhite) {
    doc.addImage(pdfIcons.fileTextWhite, 'PNG', rightSectionX, 16.5, 3.5, 3.5);
  }
  doc.text('Relatório gerado automaticamente', rightSectionX + 5, 19.5);
  
  doc.text('pelo sistema ', rightSectionX + 5, 23.5);
  const offset = doc.getTextWidth('pelo sistema ');
  
  doc.setFont(PDF_THEME.fonts.main, 'bold');
  doc.text('EUREKA', rightSectionX + 5 + offset, 23.5);
};

export const drawFooter = (doc, dataText = '') => {
  const { pageWidth, pageHeight, footerHeight } = PDF_THEME.layout;
  const startY = pageHeight - footerHeight;
  
  // Fundo do footer (azul bem claro)
  const bg = hexToRgb('#F0F9FF');
  doc.setFillColor(bg.r, bg.g, bg.b);
  doc.rect(0, startY, pageWidth, footerHeight, 'F');

  doc.setTextColor(hexToRgb(PDF_THEME.colors.primary).r, hexToRgb(PDF_THEME.colors.primary).g, hexToRgb(PDF_THEME.colors.primary).b);
  doc.setFont(PDF_THEME.fonts.main, 'bold');
  doc.setFontSize(10);
  
  // Ícone no footer (menor e azul)
  doc.setDrawColor(hexToRgb(PDF_THEME.colors.primary).r, hexToRgb(PDF_THEME.colors.primary).g, hexToRgb(PDF_THEME.colors.primary).b);
  doc.setLineWidth(0.8);
  doc.setLineCap('round');
  const fx = (pageWidth / 2) - 13;
  const fy = startY + 6;
  doc.line(fx, fy - 2, fx + 4, fy - 2);
  doc.line(fx, fy, fx + 4, fy);
  doc.line(fx, fy + 2, fx + 4, fy + 2);
  
  doc.text('EUREKA!', (pageWidth / 2) + 2, startY + 7, { align: 'center' });
  
  doc.setFont(PDF_THEME.fonts.main, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(hexToRgb(PDF_THEME.colors.secondary).r, hexToRgb(PDF_THEME.colors.secondary).g, hexToRgb(PDF_THEME.colors.secondary).b);
  doc.text('Relatório gerado automaticamente pelo sistema EUREKA', pageWidth / 2, startY + 11, { align: 'center' });
  
  if (dataText) {
    doc.setFontSize(6);
    doc.text(`Gerado em: ${dataText}`, pageWidth - PDF_THEME.layout.margin, startY + 9, { align: 'right' });
  }
};

// Desenhar Card
export const drawCard = (doc, x, y, w, h, title = null, iconKey = null, hasDivider = false) => {
  // Sombra simulada
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(x + 1, y + 1, w, h, 3, 3, 'F');

  // Fundo branco
  doc.setFillColor(255, 255, 255);
  // Borda azul clara
  const border = hexToRgb(PDF_THEME.colors.border);
  doc.setDrawColor(border.r, border.g, border.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 3, 3, 'FD');

  if (title) {
    // Cor do título mais escura (slate-700/blue-900) para maior elegância e contraste
    const titleColor = hexToRgb('#1E3A8A'); 
    doc.setTextColor(titleColor.r, titleColor.g, titleColor.b);
    doc.setFont(PDF_THEME.fonts.main, 'bold');
    doc.setFontSize(9);
    
    let textX = x + 5;
    if (iconKey && pdfIcons[iconKey]) {
      doc.addImage(pdfIcons[iconKey], 'PNG', textX, y + 2.8, 3.8, 3.8);
      textX += 5;
    }
    
    doc.text(title, textX, y + 6);

    if (hasDivider) {
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.setLineWidth(0.5);
      doc.line(x + 3, y + 9, x + w - 3, y + 9);
    }
  }
};

// Título de seção
export const drawSectionTitle = (doc, number, title, x, y, iconKey = null) => {
  const titleColor = hexToRgb('#1E3A8A'); // slate-blue escuro
  
  let textX = x;
  if (iconKey && pdfIcons[iconKey]) {
    doc.addImage(pdfIcons[iconKey], 'PNG', textX, y - 3.8, 4.5, 4.5);
    textX += 6;
  }
  
  doc.setTextColor(titleColor.r, titleColor.g, titleColor.b);
  doc.setFont(PDF_THEME.fonts.main, 'bold');
  doc.setFontSize(11);
  
  if (!iconKey && number) {
    doc.text(`${number}. ${title}`, textX, y);
  } else {
    doc.text(title, textX, y);
  }
};

// Campos de Formulário com Linha
export const drawFormField = (doc, label, value, x, y, width) => {
  doc.setFont(PDF_THEME.fonts.main, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(label, x, y);
  
  const labelWidth = doc.getTextWidth(label) + 2;
  
  if (value) {
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont(PDF_THEME.fonts.main, 'bold');
    doc.text(value, x + labelWidth, y);
  }
  
  // Desenhar a linha inferior
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.line(x + labelWidth, y + 1, x + width, y + 1);
};

// Campos de Formulário apenas Texto
export const drawFormText = (doc, label, value, x, y) => {
  doc.setFont(PDF_THEME.fonts.main, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(label, x, y);
  
  const labelWidth = doc.getTextWidth(label) + 2;
  
  if (value) {
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont(PDF_THEME.fonts.main, 'bold');
    doc.text(value, x + labelWidth, y);
  }
};

// Renderizar texto com suporte a negrito markdown (**texto**)
export const drawRichText = (doc, text, x, y, maxWidth, lineHeight = 5, fontSize = 10) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  let currentX = x;
  let currentY = y;
  
  doc.setFontSize(fontSize);
  doc.setFont(PDF_THEME.fonts.main, 'normal');
  const spaceWidth = doc.getTextWidth(' ');

  parts.forEach(part => {
    if (!part) return;

    let textToDraw = part;
    if (part.startsWith('**') && part.endsWith('**')) {
      textToDraw = part.slice(2, -2);
      doc.setFont(PDF_THEME.fonts.main, 'bold');
      doc.setTextColor(30, 41, 59); // slate-800
    } else {
      doc.setFont(PDF_THEME.fonts.main, 'normal');
      doc.setTextColor(71, 85, 105); // slate-600
    }

    const words = textToDraw.split(' ');
    
    words.forEach((word, index) => {
      if (word !== '') {
        const wordWidth = doc.getTextWidth(word);
        
        // Quebra de linha se ultrapassar a largura máxima
        if (currentX + wordWidth > x + maxWidth && currentX > x) {
          currentX = x;
          currentY += lineHeight;
        }
        
        doc.text(word, currentX, currentY);
        currentX += wordWidth;
      }
      
      // Adicionar espaço após a palavra, exceto no último item do split
      if (index < words.length - 1) {
        currentX += spaceWidth;
      }
    });
  });
  
  return currentY;
};

// Linha de dados com pontinhos
export const drawInfoRow = (doc, x, y, w, label, value) => {
  const textMain = hexToRgb(PDF_THEME.colors.textMain);
  
  doc.setFont(PDF_THEME.fonts.main, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(textMain.r, textMain.g, textMain.b);
  doc.text(label, x, y);
  
  const labelWidth = doc.getTextWidth(label);
  
  if (value) {
    doc.setFont(PDF_THEME.fonts.main, 'normal');
    const valueWidth = doc.getTextWidth(value);
    doc.text(value, x + w - valueWidth, y);
    
    // Pontilhado
    const startDot = x + labelWidth + 2;
    const endDot = x + w - valueWidth - 2;
    if (endDot > startDot) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      for (let i = startDot; i < endDot; i += 2) {
        doc.line(i, y, i + 0.5, y);
      }
    }
  }
};

// Linha de dados em formato de "caixa" (box/pill)
export const drawDataBoxRow = (doc, x, y, w, h, label, value) => {
  // Caixa
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'FD');

  // Label
  doc.setFont(PDF_THEME.fonts.main, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(label, x + 3, y + (h / 2) + 1.2); 

  // Valor
  if (value) {
    doc.setFont(PDF_THEME.fonts.main, 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    const labelW = doc.getTextWidth(label);
    const valueX = x + Math.max(w * 0.55, labelW + 6); // Evita sobreposição
    doc.text(value, valueX, y + (h / 2) + 1.2);
  }
};

// Caixa de Fórmula
export const drawFormulaBox = (doc, x, y, w, h, label, formulaText) => {
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  
  doc.setFont(PDF_THEME.fonts.main, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(59, 130, 246); // blue-500
  doc.text(label, x + 3, y + 4.5);
  
  doc.setFont(PDF_THEME.fonts.main, 'italic');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600
  const fWidth = doc.getTextWidth(formulaText);
  doc.text(formulaText, x + (w / 2) - (fWidth / 2), y + h - 3.5);
};

// Caixa de Resultado
export const drawResultBox = (doc, x, y, w, h, label, value, hexColor) => {
  // Fundo branco com borda suave
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  
  // Borda colorida fininha (imitando border-left CSS)
  const c = hexToRgb(hexColor);
  doc.setFillColor(c.r, c.g, c.b);
  // Matemática para tangenciar a curva: 
  // O fundo tem rx=2. Para a pílula de largura 1.5 (rx=0.75) não vazar,
  // ela precisa começar em y + 1.25 e ter altura h - 2.5.
  doc.roundedRect(x, y + 1.25, 1.5, h - 2.5, 0.75, 0.75, 'F');

  doc.setFont(PDF_THEME.fonts.main, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(label, x + 4, y + (h / 2) + 1.2);
  
  doc.setFont(PDF_THEME.fonts.main, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(c.r, c.g, c.b);
  const valW = doc.getTextWidth(value);
  doc.text(value, x + w - valW - 5, y + (h / 2) + 1.2);
};

// Caixa de Condição
export const drawConditionBox = (doc, x, y, w, h, condicao, subText) => {
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  
  doc.setFont(PDF_THEME.fonts.main, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Condição:', x + 5, y + (h / 2)); // Ajustado verticalmente
  
  const isAfunda = condicao === 'AFUNDA';
  const pillBg = isAfunda ? {r:243, g:232, b:255} : (condicao === 'FLUTUA' ? {r:219, g:236, b:254} : {r:226, g:232, b:240});
  const pillText = isAfunda ? {r:147, g:51, b:234} : (condicao === 'FLUTUA' ? {r:37, g:99, b:235} : {r:71, g:85, b:105});
  
  doc.setFont(PDF_THEME.fonts.main, 'bold');
  doc.setFontSize(8.5);
  const textW = doc.getTextWidth(condicao);
  const pillW = textW + 8;
  const pillH = 6;
  const pillCenter = x + w - 25; // Alinhado mais centralmente na metade direita
  const px = pillCenter - pillW / 2;
  const py = y + 2.5;
  
  doc.setFillColor(pillBg.r, pillBg.g, pillBg.b);
  doc.roundedRect(px, py, pillW, pillH, 3, 3, 'F');
  
  doc.setTextColor(pillText.r, pillText.g, pillText.b);
  doc.text(condicao, px + 4, py + 4.2);
  
  if (subText) {
    doc.setFont(PDF_THEME.fonts.main, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    const stW = doc.getTextWidth(subText);
    doc.text(subText, pillCenter - stW / 2, py + pillH + 3.2);
  }
};
