import html2canvas from 'html2canvas';

const isEmptyBackgroundPixel = (r, g, b, a) => {
  if (a < 10) return true;
  const minC = Math.min(r, g, b);
  const maxC = Math.max(r, g, b);
  // Ignora fundo branco (#ffffff), fundo 3D (#f8fafc/#f1f5f9) e linhas-guia de baixa opacidade (0.12)
  return minC >= 220 && maxC - minC <= 10;
};

const autoTrimCanvas = (sourceCanvas) => {
  const { width: w, height: h } = sourceCanvas;
  if (!w || !h) return sourceCanvas;

  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  const { data } = ctx.getImageData(0, 0, w, h);

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  const step = 2;
  for (let y = 0; y < h; y += step) {
    const rowOffset = y * w * 4;
    for (let x = 0; x < w; x += step) {
      const idx = rowOffset + x * 4;
      if (!isEmptyBackgroundPixel(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return sourceCanvas;
  }

  const contentW = maxX - minX + step;
  const contentH = maxY - minY + step;

  // Fallback de segurança caso a área detectada seja irrisória
  if (contentW < w * 0.08 || contentH < h * 0.08) {
    return sourceCanvas;
  }

  // Margem de respiro proporcional para não cortar setas, pontas de cotas ou legendas
  const pad = Math.max(18, Math.round(Math.max(contentW, contentH) * 0.03));

  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropRight = Math.min(w, maxX + step + pad);
  const cropBottom = Math.min(h, maxY + step + pad);
  const cropW = Math.max(1, cropRight - cropX);
  const cropH = Math.max(1, cropBottom - cropY);

  // Só recorta se houver redução real de áreas vazias
  if (cropW >= w * 0.96 && cropH >= h * 0.96) {
    return sourceCanvas;
  }

  const trimmed = document.createElement('canvas');
  trimmed.width = cropW;
  trimmed.height = cropH;
  const trimmedCtx = trimmed.getContext('2d');
  if (!trimmedCtx) return sourceCanvas;

  trimmedCtx.fillStyle = '#ffffff';
  trimmedCtx.fillRect(0, 0, cropW, cropH);
  trimmedCtx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return trimmed;
};

const hideUiChromeForCapture = (clonedEl) => {
  // Remove bordas/sombras externas do card para não interferir na detecção de conteúdo
  clonedEl.style.border = 'none';
  clonedEl.style.boxShadow = 'none';
  clonedEl.style.borderRadius = '0';
  clonedEl.style.background = '#ffffff';

  // Oculta faixas decorativas, halos de fundo e barra de dica de navegação 3D
  clonedEl.querySelectorAll('div').forEach((div) => {
    const cls = typeof div.className === 'string' ? div.className : '';
    if (
      (cls.includes('top-0') && cls.includes('h-1.5')) ||
      (cls.includes('bottom-0') && cls.includes('h-24'))
    ) {
      div.style.display = 'none';
    }
    if (cls.includes('pointer-events-none') && cls.includes('inset-0') && div.querySelector('[class*="blur-"]')) {
      div.style.display = 'none';
    }
    if (cls.includes('pointer-events-none') && cls.includes('rounded-full') && div.textContent?.includes('Girar')) {
      div.style.display = 'none';
    }
    if (cls.includes('border-blue-100/70') && cls.includes('rounded-2xl')) {
      div.style.border = 'none';
      div.style.boxShadow = 'none';
      div.style.background = '#ffffff';
    }
  });

  // Oculta elementos marcados explicitamente para não aparecerem no PDF (ex.: painel flutuante de estabilidade e controles)
  clonedEl.querySelectorAll('[data-pdf-hide="true"]').forEach((el) => {
    el.style.display = 'none';
  });

  // Oculta botões flutuantes e barras de controle (3D ON, VETORES, Analisar, Velocidade, Resetar)
  clonedEl.querySelectorAll('[data-tour="botao-acao"]').forEach((el) => {
    el.style.display = 'none';
  });

  clonedEl.querySelectorAll('button').forEach((btn) => {
    const pillBar = btn.closest('.rounded-full.shadow-lg, .backdrop-blur-sm.rounded-full');
    if (pillBar && clonedEl.contains(pillBar)) {
      pillBar.style.display = 'none';
    } else {
      btn.style.display = 'none';
    }
  });
};

export const capturarImagemSimulacao = async (elementId) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Elemento com ID '${elementId}' não encontrado.`);
    }

    const liveSvgs = Array.from(element.querySelectorAll('svg'));
    const liveSvgSizes = liveSvgs.map((svg) => {
      const rect = svg.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

    const liveCanvases = Array.from(element.querySelectorAll('canvas'));
    const liveCanvasSnapshots = liveCanvases.map((cv) => {
      const rect = cv.getBoundingClientRect();
      let dataUrl = null;
      try {
        if (cv.width > 0 && cv.height > 0) {
          dataUrl = cv.toDataURL('image/png');
        }
      } catch {
        dataUrl = null;
      }
      return {
        dataUrl,
        width: rect.width,
        height: rect.height,
      };
    });

    const rawCanvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (!clonedEl) return;

        // Oculta apenas controles de interface para não incluir botões/barras vazias no recorte
        hideUiChromeForCapture(clonedEl);

        // Preserva as dimensões reais de cada SVG para evitar distorção de viewBox no html2canvas
        const clonedSvgs = Array.from(clonedEl.querySelectorAll('svg'));
        clonedSvgs.forEach((svg, idx) => {
          const size = liveSvgSizes[idx];
          if (size && size.width > 0 && size.height > 0) {
            svg.setAttribute('width', `${size.width}`);
            svg.setAttribute('height', `${size.height}`);
            svg.style.width = `${size.width}px`;
            svg.style.height = `${size.height}px`;
          }
        });

        // Substitui canvas WebGL/2D pelo snapshot exato mantendo proporção original
        const clonedCanvases = Array.from(clonedEl.querySelectorAll('canvas'));
        clonedCanvases.forEach((cv, idx) => {
          const snap = liveCanvasSnapshots[idx];
          if (snap && snap.dataUrl && snap.width > 0 && snap.height > 0 && cv.parentNode) {
            const img = clonedDoc.createElement('img');
            img.src = snap.dataUrl;
            img.style.width = `${snap.width}px`;
            img.style.height = `${snap.height}px`;
            img.style.display = 'block';
            cv.parentNode.replaceChild(img, cv);
          }
        });
      },
    });

    const finalCanvas = autoTrimCanvas(rawCanvas);
    return finalCanvas.toDataURL('image/png');
  } catch (error) {
    console.error('Erro ao capturar imagem interna:', error);
    throw error;
  }
};
