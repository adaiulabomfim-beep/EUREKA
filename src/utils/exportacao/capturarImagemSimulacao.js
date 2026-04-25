import html2canvas from 'html2canvas';

export const capturarImagemSimulacao = async (elementId) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Elemento com ID '${elementId}' não encontrado.`);
    }

    const canvas = await html2canvas(element, {
      scale: 3, 
      useCORS: true, 
      logging: false, 
      backgroundColor: '#ffffff',
      ignoreElements: (el) => {
        // Ignora botões interativos e overlays da interface gráfica
        if (el.tagName === 'BUTTON') return true;
        if (el.classList && (
             el.classList.contains('canvas-ui-overlay') ||
             el.classList.contains('bg-white/75') || // Tab header fallback
             el.getAttribute('title')
           )) {
          return true;
        }
        return false;
      }
    });

    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (error) {
    console.error("Erro ao capturar imagem interna:", error);
    throw error;
  }
};
