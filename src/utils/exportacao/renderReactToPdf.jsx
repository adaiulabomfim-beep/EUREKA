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

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

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
