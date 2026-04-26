/**
 * Força o download de um PDF gerado pelo jsPDF.
 * Usa Data URI com application/octet-stream para impedir que o navegador
 * abra o PDF em uma aba em vez de baixá-lo.
 * 
 * Se o navegador suportar a API showSaveFilePicker (Chrome/Edge modernos),
 * usa essa API para um salvamento mais confiável.
 */
export const forcarDownloadPDF = async (pdf, filename) => {
  try {
    // Tentativa 1: Usar File System Access API (mais confiável para download)
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Documento PDF',
            accept: { 'application/pdf': ['.pdf'] },
          }],
        });
        const writable = await handle.createWritable();
        const arrayBuffer = pdf.output('arraybuffer');
        await writable.write(arrayBuffer);
        await writable.close();
        return; // Sucesso via File System Access API
      } catch (fsErr) {
        // Se o usuário cancelou o diálogo ou a API falhou, usar fallback
        if (fsErr.name === 'AbortError') return; // Usuário cancelou
        console.warn('[PDF] File System API falhou, usando fallback:', fsErr);
      }
    }

    // Tentativa 2: Data URI com download attribute
    const base64 = pdf.output('datauristring');
    const link = document.createElement('a');
    link.href = base64;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
    }, 500);
    
  } catch (err) {
    console.error('[PDF] Erro ao forçar download:', err);
    // Último recurso: pdf.save nativo
    pdf.save(filename);
  }
};
