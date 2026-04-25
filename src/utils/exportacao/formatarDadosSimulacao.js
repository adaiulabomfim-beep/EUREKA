import html2canvas from 'html2canvas';

export const formatarDadosSimulacao = (simulacao) => {
  const formatNumber = (num, min=2, max=2) => Number(num).toLocaleString('pt-BR', {minimumFractionDigits: min, maximumFractionDigits: max});
  
  const objDes = parseFloat(simulacao.densidadeObjeto) || 0;
  const fluidoDes = parseFloat(simulacao.densidadeFluido) || 0;
  
  let statusTexto = "O objeto permanecerá em EQUILÍBRIO (totalmente submerso), pois as densidades são iguais.";
  if (objDes > fluidoDes) {
     statusTexto = "Como a densidade do corpo é maior que a do fluido (consequentemente o peso é maior que o empuxo máximo), o corpo tende a AFUNDAR.";
  } else if (objDes < fluidoDes) {
     statusTexto = "Como a densidade do corpo é menor que a do fluido, o corpo irá FLUTUAR, deslocando um volume de fluido cujo peso se iguala ao peso total do corpo.";
  }

  const geoMapSubstantivo = {
    'CUBE': 'Cubo', 'SPHERE': 'Esfera', 'CYLINDER': 'Cilindro', 'CONE': 'Cone'
  };

  let geoLabel = simulacao.geometria || 'Desconhecida';
  let geoNome = geoMapSubstantivo[geoLabel] || geoLabel;

  if (geoLabel.includes('Barragem ')) {
     geoNome = "Barragem de " + geoLabel.replace('Barragem ', '').toLowerCase();
  } else if (geoLabel.includes('Comporta')) {
     geoNome = "Comporta";
  }

  const peso = Number(simulacao.peso) || 0;
  const empuxo = Number(simulacao.empuxo) || 0;
  const volDesl = Number(simulacao.volumeDeslocado) || 0;
  const pesoAp = Math.max(0, peso - empuxo);

  return {
    ...simulacao,
    geometriaNome: geoNome,
    densidadeObjetoFmt: `${formatNumber(objDes,0,0)} kg/m³`,
    densidadeFluidoFmt: `${formatNumber(fluidoDes,0,0)} kg/m³`,
    pesoNum: peso,
    pesoFmt: `${formatNumber(peso)} N`,
    empuxoNum: empuxo,
    empuxoFmt: `${formatNumber(empuxo)} N`,
    volumeDeslocadoNum: volDesl,
    volumeDeslocadoFmt: `${formatNumber(volDesl, 4, 4)} m³`,
    pesoAparenteNum: pesoAp,
    pesoAparenteFmt: `${formatNumber(pesoAp)} N`,
    gravidade: "9,81 m/s²",
    statusFisico: statusTexto
  };
};

export const obterDimensoesLimpas = (dados) => {
  const dim = dados.dimensoes || {};
  const results = [];
  
  const formatMetersFn = (val) => Number(val).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' m';
  
  if (dados.tipo === 'corpos-imersos') {
      const dim1 = dim['Aresta/Raio (cm)'] || 0;
      const dim2 = dim['Comprimento (cm)'] || 0;
      const val1 = formatMetersFn(dim1 / 100);
      const val2 = formatMetersFn(dim2 / 100);

      if (dados.geometria === 'CUBE') {
         results.push({ label: 'Aresta do Cubo', value: val1 });
      } else if (dados.geometria === 'SPHERE') {
         results.push({ label: 'Raio da Esfera', value: val1 });
      } else if (dados.geometria === 'CYLINDER') {
         results.push({ label: 'Raio do Cilindro', value: val1 });
         results.push({ label: 'Altura do Cilindro', value: val2 });
      } else {
         results.push({ label: 'Largura/Base', value: val1 });
         results.push({ label: 'Comprimento/Altura', value: val2 });
      }
  } else {
      Object.entries(dim).forEach(([k, v]) => {
         const isCm = k.includes('(cm)');
         const cleanKey = k.replace(/\s*\(.*?\)\s*/, '');
         const finalVal = isCm ? (v / 100) : v;
         results.push({ label: cleanKey, value: formatMetersFn(finalVal) }); 
      });
  }
  return results;
};

export const adicionarCabecalhoAcademico = (pdf, subtitulo, incluirCamposCompletos = false) => {
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  pdf.text('EUREKA', 105, 20, { align: 'center' });
  
  pdf.setFontSize(11);
  pdf.text('Laboratório Virtual de Hidrostática e Empuxo', 105, 26, { align: 'center' });
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  pdf.text('Ferramenta didática para ensino de conceitos de hidrostática', 105, 31, { align: 'center' });
  pdf.text('Desenvolvido por: Adaiula Ferraz', 105, 36, { align: 'center' });
  pdf.text('Relatório gerado automaticamente pelo sistema EUREKA', 105, 41, { align: 'center' });

  pdf.setFont('times', 'bold');
  pdf.setFontSize(12);
  pdf.text(`Documento: ${subtitulo}`, 105, 52, { align: 'center' });

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(20, 56, 190, 56);

  let startY = 64;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);

  if (incluirCamposCompletos) {
      pdf.text('Instituição: ________________________________________________________________', 20, startY); startY += 8;
      pdf.text('Disciplina: _________________________________________________________________', 20, startY); startY += 8;
      pdf.text('Professor(a): _______________________________________________________________', 20, startY); startY += 8;
  }
  
  pdf.text('Aluno(a): ___________________________________________   Data: ____/____/_____', 20, startY); 
  startY += 12;

  return startY;
};

export const adicionarImagemSimulacaoNoPDF = async (pdf, elementId, startY) => {
  try {
     const { capturarImagemSimulacao } = await import('./capturarImagemSimulacao');
     const imagemBase64 = await capturarImagemSimulacao(elementId);
     
     const imgProps = pdf.getImageProperties(imagemBase64);
     
     const imgWidth = 120;
     const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
     
     const xPos = (210 - imgWidth) / 2;
     
     if (startY + imgHeight > 280) {
        pdf.addPage();
        startY = 20;
     }

     pdf.addImage(imagemBase64, 'JPEG', xPos, startY, imgWidth, imgHeight);
     pdf.setDrawColor(150, 150, 150);
     pdf.setLineWidth(0.2);
     pdf.rect(xPos, startY, imgWidth, imgHeight);

     return startY + imgHeight + 10;
  } catch (err) {
     console.warn("Retrato visual omitido na exportação.");
     return startY + 5;
  }
};
