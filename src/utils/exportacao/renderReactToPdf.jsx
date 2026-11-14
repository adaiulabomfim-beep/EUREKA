import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { capturarImagemSimulacao } from './capturarImagemSimulacao';
import { forcarDownloadPDF } from './forcarDownloadPDF';

const rasterizeEurekaLogosForPdf = (wrapper) => {
  const svgs = wrapper.querySelectorAll('svg[data-eureka-logo="true"]');
  svgs.forEach((svg) => {
    try {
      const textEl = svg.querySelector('text');
      if (!textEl) return;

      const theme = svg.getAttribute('data-theme') || 'colored';
      const rect = svg.getBoundingClientRect();
      const cssH = rect.height || 24;

      let textRight = 0;
      try {
        const bbox = textEl.getBBox();
        textRight = bbox.x + bbox.width;
      } catch {
        textRight = textEl.getComputedTextLength();
      }
      const markX = Math.ceil((textRight || 219) + 5);
      const vbW = markX + 18;
      const vbH = 58;
      const cssW = (vbW / vbH) * cssH;

      const dpr = 4;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(vbW * dpr);
      canvas.height = Math.ceil(vbH * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(dpr, dpr);

      // Texto EUREKA com mesma tipografia, espaçamento e gradiente
      ctx.save();
      ctx.font = '900 54px Inter, sans-serif';
      ctx.textBaseline = 'alphabetic';

      if (theme === 'colored') {
        const grad = ctx.createLinearGradient(0, 0, textRight || markX, 0);
        grad.addColorStop(0, '#3b82f6');
        grad.addColorStop(0.5, '#38bdf8');
        grad.addColorStop(1, '#67e8f9');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.16)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 6;
      } else if (theme === 'solid-blue') {
        ctx.fillStyle = '#3478f6';
      } else {
        ctx.fillStyle = '#ffffff';
      }

      const word = 'EUREKA';
      let canUseCharPos = false;
      try {
        canUseCharPos = typeof textEl.getStartPositionOfChar === 'function' && textEl.getNumberOfChars() === word.length;
      } catch {
        canUseCharPos = false;
      }

      if (canUseCharPos) {
        for (let i = 0; i < word.length; i++) {
          const pos = textEl.getStartPositionOfChar(i);
          ctx.fillText(word[i], pos.x, 48);
        }
      } else {
        ctx.fillText(word, 0, 48);
      }
      ctx.restore();

      // Barra da exclamação alinhada à altura das letras
      ctx.save();
      ctx.fillStyle = theme === 'colored' ? '#3b82f6' : theme === 'solid-blue' ? '#3478f6' : '#ffffff';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(markX, 9, 10, 22, 2);
      } else {
        ctx.rect(markX, 9, 10, 22);
      }
      ctx.fill();
      ctx.restore();

      // Gota da exclamação com base na linha de base tipográfica (34 + 14 = 48)
      ctx.save();
      ctx.translate(markX - 2 + 7, 34 + 7);
      ctx.rotate(Math.PI / 4);
      ctx.translate(-7, -7);

      if (theme === 'colored') {
        const dropGrad = ctx.createLinearGradient(0, 0, 14, 14);
        dropGrad.addColorStop(0, '#38bdf8');
        dropGrad.addColorStop(1, '#67e8f9');
        ctx.fillStyle = dropGrad;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.55)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
      } else if (theme === 'solid-blue') {
        ctx.fillStyle = '#3478f6';
      } else {
        ctx.fillStyle = '#ffffff';
      }

      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(14, 0);
      ctx.lineTo(14, 7);
      ctx.arc(7, 7, 7, 0, 1.5 * Math.PI, false);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/png', 1.0);
      img.alt = 'EUREKA!';
      img.style.height = `${cssH}px`;
      img.style.width = `${cssW}px`;
      img.style.display = 'block';
      svg.parentNode.replaceChild(img, svg);
    } catch {
      // Fallback mantém o SVG original se algo falhar
    }
  });
};

const waitForImagesReady = async (wrapper) => {
  const imgs = Array.from(wrapper.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      if (!img.complete) {
        await new Promise((resolve) => {
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        });
      }
      if (typeof img.decode === 'function') {
        try {
          await img.decode();
        } catch {
          // Segue mesmo se decode falhar para SVG/data URL específico
        }
      }
    })
  );
};

const fitSimulationImagesProportionally = (wrapper) => {
  const imgs = Array.from(wrapper.querySelectorAll('img[data-simulation-image="true"]'));
  imgs.forEach((img) => {
    const parent = img.parentElement;
    if (!parent) return;

    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    if (!natW || !natH) return;

    // Mede a área máxima disponível do contêiner sem influência da largura intrínseca da imagem
    img.style.display = 'none';
    const parentRect = parent.getBoundingClientRect();
    const styles = window.getComputedStyle(parent);
    const padX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    const padY = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);

    const availW = Math.max(1, parentRect.width - padX);
    const availH = Math.max(1, parentRect.height - padY);

    const scale = Math.min(availW / natW, availH / natH);
    const fittedW = Math.max(1, Math.round(natW * scale));
    const fittedH = Math.max(1, Math.round(natH * scale));

    img.style.width = `${fittedW}px`;
    img.style.height = `${fittedH}px`;
    img.style.maxWidth = 'none';
    img.style.maxHeight = 'none';
    img.style.transform = 'none';
    img.style.objectFit = 'contain';
    img.style.display = 'block';
  });
};

export const renderReactToPdf = async (Component, props, filename = 'documento.pdf') => {
  let container = null;
  let fontFixStyle = null;
  let root = null;
  try {
    container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '794px';
    container.style.zIndex = '-1';

    document.body.appendChild(container);
    root = createRoot(container);

    await new Promise((resolve) => {
      root.render(
        <div id="relatorio-temp-wrapper">
          <Component {...props} />
        </div>
      );
      setTimeout(resolve, 1500);
    });

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const wrapper = document.getElementById('relatorio-temp-wrapper');
    if (!wrapper) throw new Error('Wrapper não encontrado');

    // Rasteriza logos EUREKA com Inter carregada para manter espaçamento exato no PDF
    rasterizeEurekaLogosForPdf(wrapper);

    // Garante carregamento completo e ajuste estritamente proporcional das imagens da cena
    await waitForImagesReady(wrapper);
    fitSimulationImagesProportionally(wrapper);
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Corrige bug clássico do html2canvas + Tailwind (img { display: block } quebra FontMetrics.parseMetrics)
    fontFixStyle = document.createElement('style');
    fontFixStyle.setAttribute('data-html2canvas-font-fix', 'true');
    fontFixStyle.textContent = 'body > div[style*="visibility"] > img { display: inline !important; }';
    document.head.appendChild(fontFixStyle);

    const pageNodes = wrapper.querySelectorAll('.pdf-page');
    const targets = pageNodes.length > 0 ? Array.from(pageNodes) : [wrapper];

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < targets.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      const canvas = await html2canvas(targets[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      const fitRatio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const renderW = canvas.width * fitRatio;
      const renderH = canvas.height * fitRatio;
      const offsetX = (pdfWidth - renderW) / 2;
      const offsetY = (pdfHeight - renderH) / 2;
      pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderW, renderH);
    }

    forcarDownloadPDF(pdf, filename);
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    alert('Erro ao gerar documento PDF. Tente novamente.');
  } finally {
    if (root) {
      root.unmount();
    }
    if (fontFixStyle && fontFixStyle.parentNode) {
      fontFixStyle.parentNode.removeChild(fontFixStyle);
    }
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

export const exportSimulacaoPdf = async ({
  Component,
  simulacao,
  prefixoArquivo,
  extraProps = {},
}) => {
  const now = new Date();
  const dataText =
    now.toLocaleDateString('pt-BR') +
    ' - ' +
    now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dataLocalArquivo = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  const filename = `${prefixoArquivo}_EUREKA_${dataLocalArquivo}.pdf`;

  let imagemBase64 = null;
  try {
    imagemBase64 = await capturarImagemSimulacao('areaSimulacao');
  } catch (e) {
    console.warn('Erro ao capturar imagem da simulação:', e);
  }

  await renderReactToPdf(
    Component,
    { simulacao, imagemSimulacao: imagemBase64, dataText, ...extraProps },
    filename
  );
};
