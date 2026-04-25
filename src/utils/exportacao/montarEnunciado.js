export const montarDescricaoGeometria = (dados) => {
  const dim = dados.dimensoes || {};
  const formatMeters = (cm) => (Number(cm) / 100).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' m';

  const dim1 = dim['Aresta/Raio (cm)'] || dim['Aresta/Raio'] || dim['Base (m)'] || 0;
  const dim2 = dim['Comprimento (cm)'] || dim['Comprimento'] || dim['Altura (m)'] || 0;

  if (dados.tipo === 'corpos-imersos') {
      if (dados.geometria === 'CUBE') return `um bloco cúbico de aresta ${formatMeters(dim1)}`;
      if (dados.geometria === 'SPHERE') return `uma esfera de raio ${formatMeters(dim1)}`;
      if (dados.geometria === 'CYLINDER') return `um cilindro de raio ${formatMeters(dim1)} e altura ${formatMeters(dim2)}`;
      if (dados.geometria === 'RECT' || dados.geometria === 'CUBOID') return `um paralelepípedo de seção quadrática de aresta da base ${formatMeters(dim1)} e altura ${formatMeters(dim2)}`;
      return `um bloco de aresta ${formatMeters(dim1)}`;
  }

  if (dados.tipo === 'barragens') {
      return `uma ${dados.geometria.toLowerCase()} de altura ${Number(dim2).toLocaleString('pt-BR')} m e base ${Number(dim1).toLocaleString('pt-BR')} m`;
  }
  if (dados.tipo === 'comportas') {
      return `uma comporta`;
  }

  return `um objeto avaliado nas dimensões da simulação`;
};

export const montarEnunciado = (dados) => {
  const descricao = montarDescricaoGeometria(dados);

  if (dados.tipo === 'corpos-imersos') {
    return `Um ${descricao.substring(3)} e densidade de ${dados.densidadeObjetoFmt} é colocado em um recipiente contendo um fluido de densidade ${dados.densidadeFluidoFmt}. Considerando a aceleração da gravidade g = ${dados.gravidade}, determine:`;
  }

  return `Considere um sistema físico contendo ${descricao}, onde atua um fluido de densidade ${dados.densidadeFluidoFmt}. Considerando a aceleração da gravidade g = ${dados.gravidade}, analise as propriedades:`;
};
