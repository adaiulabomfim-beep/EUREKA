import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { forcarDownloadPDF } from './forcarDownloadPDF';

export const renderReactToPdf = async (Component, props, filename = 'documento.pdf') => {
  let container = null;
  try {
    container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '794px';
    container.style.zIndex = '-1';
    
    document.body.appendChild(container);
    const root = createRoot(container);

    await new Promise((resolve) => {
      root.render(
        <div id="relatorio-temp-wrapper">
           <Component {...props} />
        </div>
      );
      setTimeout(resolve, 1500); // Aguarda renderização e fontes
    });

    const wrapper = document.getElementById('relatorio-temp-wrapper');
    if (!wrapper) throw new Error("Wrapper não encontrado");

    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const pageHeightPx = 1123;
    const scale = 2;
    const canvasPageHeight = pageHeightPx * scale;
    const canvasPageWidth = canvas.width;
    
    const totalPages = Math.max(1, Math.round((canvas.height / scale) / pageHeightPx));
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasPageWidth;
      pageCanvas.height = canvasPageHeight;
      const ctx = pageCanvas.getContext('2d');
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasPageWidth, canvasPageHeight);
      
      ctx.drawImage(
        canvas,
        0, i * canvasPageHeight, canvasPageWidth, canvasPageHeight,
        0, 0, canvasPageWidth, canvasPageHeight
      );
      
      const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
      pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }
 
    forcarDownloadPDF(pdf, filename);
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    alert('Erro ao gerar relatório visual. Tente novamente.');
  } finally {
    if (container) {
      document.body.removeChild(container);
    }
  }
};
