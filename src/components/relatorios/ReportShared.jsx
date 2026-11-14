import React from 'react';
import { CalendarDays, FileText, UserRound, Cuboid, ListChecks } from 'lucide-react';
import { LogoEureka } from '../ui/LogoEureka';
import { obterDimensoesLimpas } from '../../utils/exportacao/formatarDadosSimulacao';

export const SectionTitle = ({ icon: Icon, children, number }) => (
  <div className="mb-[10px] flex items-center gap-[8px] border-b border-[#dbe8f7] pb-[8px]">
    {Icon && (
      <Icon size={16} strokeWidth={2.5} className="block shrink-0 text-[#3478f6]" />
    )}
    <h3 className="m-0 p-0 text-[13px] font-black uppercase leading-none tracking-[0.5px] text-[#23477f]">
      {number ? `${number}. ` : ''}
      {children}
    </h3>
  </div>
);

export const Card = ({ children, className = '', allowOverflow = false }) => (
  <section
    className={`min-w-0 ${allowOverflow ? 'overflow-visible' : 'overflow-hidden'} rounded-[12px] border border-[#dbe8f7] bg-white shadow-[0_3px_10px_rgba(47,91,140,0.12)] ${className}`}
  >
    {children}
  </section>
);

export const InfoLine = ({ label, wide, value, noLine }) => (
  <div className={`${wide ? 'col-span-2' : ''} flex min-h-[30px] items-baseline gap-[6px] pt-[9px] pb-[7px]`}>
    <span className="shrink-0 text-[11px] font-semibold leading-none text-[#6b82a9]">
      {label}:
    </span>

    {noLine ? (
      <span className="text-[12px] font-black leading-none tracking-[0.5px] text-[#244a82]">
        {value}
      </span>
    ) : (
      <div className="relative -top-[1px] flex flex-1 items-baseline justify-end border-b border-[#bfd2ef]">
        {value ? (
          <span className="relative top-[1px] text-[12px] font-black leading-none tracking-[0.5px] text-[#244a82]">
            {value}
          </span>
        ) : (
          <span className="text-[11px] font-semibold leading-none opacity-0 select-none" aria-hidden="true">
            &nbsp;
          </span>
        )}
      </div>
    )}
  </div>
);

export const DataRow = ({ label, value }) => (
  <div className="flex min-h-[32px] items-center justify-between gap-[8px] rounded-[7px] border border-[#dce8f6] bg-[#fbfdff] px-[12px] py-[4px]">
    <span className="min-w-0 text-[11px] font-medium leading-[1.3] text-[#6d82a7]" style={{ transform: 'translateY(-1px)' }}>
      {label}
    </span>
    <span className="shrink-0 text-right text-[11.5px] font-black leading-[1.3] text-[#2f4468]" style={{ transform: 'translateY(-1px)' }}>
      {value}
    </span>
  </div>
);

export const HeaderInfoItem = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-[7px]">
    <Icon size={13} className="block shrink-0 text-[#3478f6]" />
    <div className="flex-1 text-[10px] font-bold leading-[1.25] text-[#4a638b]">
      {children}
    </div>
  </div>
);

export const ReportHeader = ({ subtitle, dataText, documentKindText }) => (
  <header className="h-[96px] shrink-0 rounded-b-[6px] border-b border-[#dce8f6] bg-white px-[32px] shadow-[0_8px_20px_rgba(25,96,180,0.06)]">
    <div className="flex h-full items-center justify-between">
      <div>
        <LogoEureka size="md" animated={false} theme="colored" />
        <p className="m-0 mt-[5px] text-[10.5px] font-black tracking-[1.5px] text-[#244a82]">
          {subtitle}
        </p>
      </div>

      <div className="flex w-[255px] flex-col gap-[10px]">
        <HeaderInfoItem icon={CalendarDays}>
          Data da Simulação: {dataText}
        </HeaderInfoItem>

        <HeaderInfoItem icon={FileText}>
          {documentKindText}
          <br />
          pelo sistema <strong className="text-[#3478f6]">EUREKA</strong>
        </HeaderInfoItem>
      </div>
    </div>
  </header>
);

export const InfoGeralCard = () => (
  <Card className="shrink-0 px-[15px] py-[12px]">
    <SectionTitle icon={UserRound}>Informações Gerais</SectionTitle>
    <div className="grid grid-cols-3 gap-x-[14px] gap-y-[8px] pt-[4px]">
      <InfoLine label="Instituição" />
      <InfoLine label="Disciplina" />
      <InfoLine label="Professor(a)" />
      <InfoLine label="Aluno(a)" wide />
      <InfoLine label="Data" />
    </div>
  </Card>
);

export const ReportFooter = ({ heightClass = 'h-[54px]' }) => (
  <footer className={`${heightClass} shrink-0 border-t border-[#d8e8f8] bg-gradient-to-r from-[#dff3ff] via-[#eef9ff] to-[#d8f4ff]`}>
    <div className="flex h-full flex-col items-center justify-center gap-[3px]">
      <LogoEureka size="sm" animated={false} theme="colored" />
      <p className="m-0 text-center text-[8px] font-black tracking-[0.5px] text-[#6982a3]">
        Desenvolvido por Adaiula Ferraz
      </p>
    </div>
  </footer>
);

export const SimulationImageBox = ({
  src,
  alt = 'Visualização da simulação',
  heightClass = 'h-[268px]',
}) => (
  <div
    data-simulation-box="true"
    className={`relative flex ${heightClass} w-full items-center justify-center overflow-hidden rounded-[9px] border border-[#dce8f6] bg-white p-[4px]`}
  >
    <div className="absolute right-[8px] top-[8px] z-10 flex h-[28px] w-[28px] items-center justify-center rounded-full border border-[#dce8f6] bg-white shadow-sm">
      <Cuboid size={14} className="text-[#4d83f6]" />
    </div>
    {src ? (
      <img
        data-simulation-image="true"
        src={src}
        alt={alt}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          display: 'block',
          objectFit: 'contain',
        }}
      />
    ) : (
      <span className="text-[12px] font-semibold text-[#9aadc9]">
        [Sem imagem da simulação]
      </span>
    )}
  </div>
);

export const buildSimulationDataRows = (
  dados,
  { includeCalculated = false, alturaSubmersa = null, volumeSubmerso = null } = {}
) => {
  const dimsLimpas = obterDimensoesLimpas(dados);
  const seenLabels = new Set();
  const rows = [];

  const pushUniqueRow = (keyLabel, labelNode, value) => {
    const normalized = keyLabel.toLowerCase();
    if (seenLabels.has(normalized)) return;
    seenLabels.add(normalized);
    rows.push({ label: labelNode, value });
  };

  pushUniqueRow('Geometria do objeto', 'Geometria do objeto:', dados.geometriaNome);
  dimsLimpas.forEach((d) => {
    pushUniqueRow(d.label, `${d.label}:`, d.value);
  });

  if (dados.tipo === 'corpos-imersos' && dados.inverseSpecificWeightMode) {
    pushUniqueRow('Peso real no ar', <>Peso real no ar (P):</>, dados.pesoFmt);
    pushUniqueRow('Peso aparente', <>Peso aparente (P<sub>ap</sub>):</>, dados.pesoAparenteFmt);
    pushUniqueRow('Peso específico do fluido', <>Peso específico do fluido (&gamma;<sub>f</sub>):</>, dados.pesoEspecificoFluidoFmt);
    pushUniqueRow('Peso específico do bloco', <>Peso específico médio (&gamma;<sub>c</sub>):</>, dados.pesoEspecificoCorpoFmt);
    pushUniqueRow('Densidade média do bloco', <>Massa específica média (&rho;<sub>c</sub>):</>, dados.densidadeObjetoFmt);
    pushUniqueRow('Aceleração da gravidade', 'Aceleração da gravidade (g):', dados.gravidade);
    if (includeCalculated && dados.volumeDeslocadoFmt) {
      pushUniqueRow('Volume deslocado', 'Volume deslocado (V):', dados.volumeDeslocadoFmt);
    }
    return rows;
  }

  if (dados.tipo === 'corpos-imersos') {
    pushUniqueRow(
      'Densidade do objeto',
      <>Densidade do objeto (&rho;<sub>o</sub>):</>,
      dados.densidadeObjetoFmt
    );
  }

  pushUniqueRow(
    'Densidade do fluido',
    <>Densidade do fluido (&rho;<sub>f</sub>):</>,
    dados.densidadeFluidoFmt
  );

  pushUniqueRow('Aceleração da gravidade', 'Aceleração da gravidade (g):', dados.gravidade);

  if (includeCalculated && dados.tipo === 'corpos-imersos') {
    if (alturaSubmersa) {
      pushUniqueRow('Altura submersa', 'Altura submersa (h):', alturaSubmersa);
    }
    if (volumeSubmerso) {
      pushUniqueRow('Volume submerso', 'Volume submerso:', volumeSubmerso);
    }
  }

  if (dados.tipo !== 'corpos-imersos') {
    pushUniqueRow(
      'Nível de água a montante',
      'Nível de água a montante:',
      dados.alturaSubmersa
        ? `${Number(dados.alturaSubmersa).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} m`
        : '0,00 m'
    );
  }

  return rows;
};

export const SimulationDataContinuationCard = ({ rows, className = '' }) => (
  <Card className={`shrink-0 p-[12px] ${className}`} allowOverflow>
    <SectionTitle icon={ListChecks}>Dados da Simulação (Continuação)</SectionTitle>
    <div className="grid grid-cols-2 gap-[6px]">
      {rows.map((row, idx) => (
        <DataRow key={`cont-row-${idx}`} label={row.label} value={row.value} />
      ))}
    </div>
  </Card>
);

export const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export const parseNumero = (valor) => {
  if (typeof valor === 'number') return valor;
  if (valor === null || valor === undefined) return NaN;

  let texto = String(valor)
    .replace(/\s/g, '')
    .replace(/[^\d,.-]/g, '');

  if (!texto) return NaN;

  if (texto.includes(',')) {
    texto = texto.replace(/\./g, '').replace(',', '.');
  } else {
    const partes = texto.split('.');
    const ultimo = partes[partes.length - 1];
    if (partes.length > 1 && ultimo.length === 3) {
      texto = texto.replace(/\./g, '');
    }
  }

  return Number(texto);
};

export const formatarVolume = (valor) =>
  `${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })} m³`;

export const formatMeters = (valor) => {
  const numero = Number(valor) || 0;
  return `${(numero / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} m`;
};

export const calcularAlturaSubmersaTexto = (simulacao, dados) => {
  if (dados.tipo !== 'corpos-imersos') return null;

  const hDireta = parseNumero(simulacao.alturaSubmersa);
  if (Number.isFinite(hDireta) && hDireta > 0) {
    return `${hDireta.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} m`;
  }

  const dim = simulacao.dimensoes || {};
  const dim1 = dim['Aresta/Raio (cm)'] || dim['Aresta/Raio'] || 0;
  const dim2 = dim['Comprimento (cm)'] || dim['Comprimento'] || 0;
  const objDens = parseNumero(simulacao.densidadeEquivalente ?? simulacao.densidadeObjeto) || 0;
  const fluidDens = parseNumero(simulacao.densidadeFluido) || 0;

  if (fluidDens === 0) return null;

  const ratio = Math.min(1, objDens / fluidDens);
  let h = 0;

  if (dados.geometria === 'CUBE') h = (Number(dim1) / 100) * ratio;
  else if (dados.geometria === 'CYLINDER') h = (Number(dim2) / 100) * ratio;
  else if (dados.geometria === 'SPHERE') {
    const R = Number(dim1) / 100;
    if (ratio >= 1) {
      h = 2 * R;
    } else {
      const targetV = ratio * (4 / 3) * Math.PI * Math.pow(R, 3);
      let lo = 0;
      let hi = 2 * R;
      for (let i = 0; i < 40; i++) {
        const mid = 0.5 * (lo + hi);
        const vCap = Math.PI * mid * mid * (R - mid / 3);
        if (vCap < targetV) lo = mid;
        else hi = mid;
      }
      h = 0.5 * (lo + hi);
    }
  } else {
    h = (Number(dim2) / 100) * ratio;
  }

  if (objDens >= fluidDens) {
    if (dados.geometria === 'CUBE') h = Number(dim1) / 100;
    else if (dados.geometria === 'CYLINDER') h = Number(dim2) / 100;
    else if (dados.geometria === 'SPHERE') h = (Number(dim1) / 100) * 2;
    else h = Number(dim2) / 100;
  }

  return `${h.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} m`;
};

export const calcularVolumeSubmersoTexto = (simulacao, dados) => {
  const candidatos = [
    dados.volumeDeslocado,
    simulacao.volumeDeslocado,
    simulacao.volumeSubmerso,
    simulacao.resultados?.volumeDeslocado,
    simulacao.resultados?.volumeSubmerso,
  ];

  for (const candidato of candidatos) {
    const valor = parseNumero(candidato);
    if (Number.isFinite(valor) && valor > 0) return formatarVolume(valor);
  }

  const volumeAtual = parseNumero(dados.volumeDeslocadoFmt);
  if (Number.isFinite(volumeAtual) && volumeAtual > 0) return dados.volumeDeslocadoFmt;

  const empuxo = parseNumero(dados.empuxoFmt);
  const densidadeFluido = parseNumero(simulacao.densidadeFluido ?? dados.densidadeFluidoFmt);
  const gravidade = parseNumero(simulacao.gravidade ?? dados.gravidade);

  if (
    Number.isFinite(empuxo) &&
    Number.isFinite(densidadeFluido) &&
    Number.isFinite(gravidade) &&
    empuxo > 0 &&
    densidadeFluido > 0 &&
    gravidade > 0
  ) {
    return formatarVolume(empuxo / (densidadeFluido * gravidade));
  }

  return dados.volumeDeslocadoFmt;
};

export const renderDescricaoProblema = (simulacao, dados, enunciado) => {
  const dim = simulacao.dimensoes || {};
  const dim1 = dim['Aresta/Raio (cm)'] || dim['Aresta/Raio'] || dim['Base (m)'] || 0;
  const dim2 = dim['Comprimento (cm)'] || dim['Comprimento'] || dim['Altura (m)'] || 0;

  const parseBoldText = (text) => {
    if (typeof text !== 'string') return text;
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} className="font-black text-[#253957]">{part.slice(2, -2)}</strong>
        : part
    );
  };

  if (dados.tipo === 'corpos-imersos') {
    let desc;
    if (dados.geometria === 'CUBE') {
      desc = <>Um bloco cúbico de aresta <strong className="font-black text-[#253957]">{formatMeters(dim1)}</strong></>;
    } else if (dados.geometria === 'SPHERE') {
      desc = <>Uma esfera de raio <strong className="font-black text-[#253957]">{formatMeters(dim1)}</strong></>;
    } else if (dados.geometria === 'CYLINDER') {
      desc = <>Um cilindro de raio <strong className="font-black text-[#253957]">{formatMeters(dim1)}</strong> e altura <strong className="font-black text-[#253957]">{formatMeters(dim2)}</strong></>;
    } else if (dados.geometria === 'RECT' || dados.geometria === 'CUBOID') {
      desc = <>Um paralelepípedo de base <strong className="font-black text-[#253957]">{formatMeters(dim1)}</strong> e altura <strong className="font-black text-[#253957]">{formatMeters(dim2)}</strong></>;
    } else {
      desc = <>Um corpo de dimensão característica <strong className="font-black text-[#253957]">{formatMeters(dim1)}</strong></>;
    }

    return (
      <>
        {desc} e densidade de{' '}
        <strong className="font-black text-[#253957]">{dados.densidadeObjetoFmt}</strong>{' '}
        é colocado em um recipiente contendo um fluido de densidade{' '}
        <strong className="font-black text-[#253957]">{dados.densidadeFluidoFmt}</strong>.
        Considerando a aceleração da gravidade{' '}
        <strong className="font-black text-[#253957]">g = {dados.gravidade}</strong>, determine:
      </>
    );
  }

  return <>{parseBoldText(enunciado)}</>;
};
