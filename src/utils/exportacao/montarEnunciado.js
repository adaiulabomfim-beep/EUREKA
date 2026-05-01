import { obterDimensoesLimpas } from './formatarDadosSimulacao';

export const montarEnunciado = (simulacao) => {
  const dimensoes = obterDimensoesLimpas(simulacao);
  const densidadeObj = Number(simulacao.densidadeObjeto || 0).toLocaleString('pt-BR');
  const densidadeFluido = Number(simulacao.densidadeFluido || 0).toLocaleString('pt-BR');
  
  if (simulacao.tipo === 'comportas') {
     const altura = dimensoes.find(d => d.label.includes('Altura'))?.value || '1,00 m';
     const base = dimensoes.find(d => d.label.includes('Base') || d.label.includes('Largura'))?.value || '1,00 m';
     const submersa = simulacao.alturaSubmersa ? Number(simulacao.alturaSubmersa).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00';
     return `Uma ${simulacao.geometria} de altura **${altura}** e largura **${base}** atua na retenção de um fluido de densidade **${densidadeFluido} kg/m³**, com o nível d'água a **${submersa} m**. Considerando a aceleração da gravidade **g = 9,81 m/s²**, determine a força hidrostática resultante e sua linha de ação.`;
  }

  if (simulacao.tipo === 'barragens') {
     const altura = dimensoes.find(d => d.label.includes('Altura'))?.value || '1,00 m';
     const crista = dimensoes.find(d => d.label.includes('Crista'))?.value || '1,00 m';
     const submersa = simulacao.alturaSubmersa ? Number(simulacao.alturaSubmersa).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00';
     return `Para uma ${simulacao.geometria} com altura total de **${altura}** e crista de **${crista}**, submetida a um nível d'água principal de **${submersa} m** (fluido com densidade **${densidadeFluido} kg/m³**). Considerando **g = 9,81 m/s²**, calcule os esforços principais, resultante, e realize a verificação de estabilidade (deslizamento e tombamento).`;
  }

  let textoGeometria = '';
  const geo = simulacao.geometria;

  if (geo === 'CUBE') {
    const aresta = dimensoes.find(d => d.label.includes('Aresta'))?.value || '1,00 m';
    textoGeometria = `Um bloco cúbico de aresta **${aresta}**`;
  } else if (geo === 'SPHERE') {
    const raio = dimensoes.find(d => d.label.includes('Raio'))?.value || '0,50 m';
    textoGeometria = `Uma esfera de raio **${raio}**`;
  } else if (geo === 'CYLINDER') {
    const raio = dimensoes.find(d => d.label.includes('Raio'))?.value || '0,50 m';
    const altura = dimensoes.find(d => d.label.includes('Altura'))?.value || '1,00 m';
    textoGeometria = `Um cilindro de raio **${raio}** e altura **${altura}**`;
  } else {
    // Paralelepípedo ou genérico
    const largura = dimensoes.find(d => d.label.includes('Largura'))?.value || '1,00 m';
    const comprimento = dimensoes.find(d => d.label.includes('Comprimento'))?.value || '1,00 m';
    const l = largura.replace(' m', '');
    const c = comprimento.replace(' m', '');
    textoGeometria = `Um paralelepípedo de dimensões **${l} m × ${l} m × ${c} m**`;
  }

  // Se tiver peso extra
  const pesoExtraStr = simulacao.pesoExtra > 0 ? ` e uma carga adicional de **${simulacao.pesoExtra} N** no topo` : '';

  return `${textoGeometria} e densidade de **${densidadeObj} kg/m³** é colocado${pesoExtraStr} em um recipiente contendo um fluido de densidade **${densidadeFluido} kg/m³**. Considerando a aceleração da gravidade **g = 9,81 m/s²**, determine:`;
};
