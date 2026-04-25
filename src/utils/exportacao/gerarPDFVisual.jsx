import { jsPDF } from 'jspdf';
import { capturarImagemSimulacao } from './capturarImagemSimulacao';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RelatorioVisualEureka } from '../../components/relatorios/RelatorioVisualEureka';
import html2canvas from 'html2canvas';

export const gerarPDFVisual = async (simulacao, elementId = 'areaSimulacao') => {
  let container = null;
  
  try {
    const imagemBase64 = await capturarImagemSimulacao(elementId);
    const dataText = new Date().toLocaleDateString('pt-BR');

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
           <RelatorioVisualEureka 
             simulacao={simulacao} 
             imagemSimulacao={imagemBase64}
             dataText={dataText}
           />
        </div>
      );
      
      // Allow time for the component to mount and render fully
      setTimeout(resolve, 500);
    });

    const wrapper = document.getElementById('relatorio-temp-wrapper');
    if (!wrapper) throw new Error("Wrapper não encontrado");

    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#F3F8FF',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // In case the rendered height is slightly larger than 1 page
    if (pdfHeight > pdf.internal.pageSize.getHeight()) {
       // Since the design is built precisely for 1123px (A4 size at 96 DPI), 
       // it should ideally fit perfectly, but keeping this safe.
    }

    pdf.save(`Relatorio_Visual_EUREKA_${new Date().getTime()}.pdf`);
    
  } catch (err) {
    console.error("Erro ao gerar PDF visual:", err);
    alert('Erro ao gerar relatório visual. Tente novamente.');
  } finally {
    if (container) {
      document.body.removeChild(container);
    }
  }
};
