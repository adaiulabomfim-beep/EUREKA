import React from 'react';
import {
  CalendarDays,
  FileText,
  UserRound,
  Cuboid,
  ListChecks,
  Zap,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

import {
  formatarDadosSimulacao,
  obterDimensoesLimpas,
} from '../../utils/exportacao/formatarDadosSimulacao';

import { montarEnunciado } from '../../utils/exportacao/montarEnunciado';
import { LogoEureka } from '../ui/LogoEureka';

const SectionTitle = ({ icon: Icon, children, number }) => (
  <div className="mb-[8px] border-b border-[#dbe8f7] pb-[7px]">
    <div className="relative h-[22px]">
      {Icon && (
        <Icon
          size={16}
          strokeWidth={2.3}
          className="absolute left-0 text-[#3478f6]"
          style={{
            top: '3px',
            width: '16px',
            height: '16px',
            display: 'block',
            margin: 0,
            padding: 0,
          }}
        />
      )}

      <div
        className="absolute right-0 top-0 flex h-[22px] items-center text-[12px] font-black uppercase tracking-[0.5px] text-[#23477f]"
        style={{
          left: Icon ? '25px' : '0px',
          lineHeight: '22px',
        }}
      >
        <span>
          {number ? `${number}. ` : ''}
          {children}
        </span>
      </div>
    </div>
  </div>
);

const Card = ({ children, className = '' }) => (
  <section
    className={`overflow-hidden rounded-[12px] border border-[#dbe8f7] bg-white shadow-[0_3px_10px_rgba(47,91,140,0.12)] ${className}`}
  >
    {children}
  </section>
);

const InfoLine = ({ label, wide, value, noLine }) => (
  <div
    className={`${
      wide ? 'col-span-2' : ''
    } grid h-[24px] grid-cols-[auto_1fr] items-center gap-[6px]`}
  >
    <span className="shrink-0 whitespace-nowrap text-[10.5px] font-semibold leading-[1.2] text-[#6b82a9]">
      {label}:
    </span>

    {noLine ? (
      <span className="flex h-[18px] items-center text-[11.5px] font-black leading-[1.2] tracking-[2px] text-[#244a82]">
        {value}
      </span>
    ) : (
      <div className="relative h-[18px]">
        <div className="absolute bottom-[2px] left-0 right-0 border-b border-[#bfd2ef]" />

        {value && (
          <span className="relative z-10 flex h-[18px] items-center text-[11.5px] font-black leading-[1.2] tracking-[2px] text-[#244a82]">
            {value}
          </span>
        )}
      </div>
    )}
  </div>
);

const DataRow = ({ label, value }) => (
  <div className="grid h-[30px] grid-cols-[1fr_auto] items-center gap-[8px] rounded-[7px] border border-[#dce8f6] bg-[#fbfdff] px-[10px]">
    <span className="flex h-[18px] items-center text-[10px] font-medium leading-[1.2] text-[#6d82a7]">
      {label}
    </span>

    <span className="flex h-[18px] shrink-0 items-center justify-end text-right text-[10px] font-black leading-[1.2] text-[#2f4468]">
      {value}
    </span>
  </div>
);

const FormulaRow = ({ label, children }) => (
  <div className="grid h-[40px] grid-cols-[112px_1fr] items-center rounded-[8px] bg-[#f8fbff] px-[10px]">
    <span className="flex h-[20px] items-center text-[10px] font-black leading-[1.2] text-[#2472ff]">
      {label}
    </span>

    <div className="flex h-[26px] items-center justify-center font-serif text-[14px] italic leading-[1.35] text-[#333]">
      {children}
    </div>
  </div>
);

const ResultRow = ({ label, value, tone }) => {
  const tones = {
    red: {
      bg: 'bg-[#fffafa]',
      border: 'border-[#ff3b30]',
      text: 'text-[#ff3b30]',
    },
    green: {
      bg: 'bg-[#f8fffb]',
      border: 'border-[#1fc896]',
      text: 'text-[#1eae82]',
    },
    blue: {
      bg: 'bg-[#f8fbff]',
      border: 'border-[#2676ff]',
      text: 'text-[#2676ff]',
    },
  };

  const t = tones[tone];

  return (
    <div
      className={`grid h-[36px] grid-cols-[1fr_auto] items-center gap-[8px] rounded-[8px] border-l-[4px] px-[10px] ${t.border} ${t.bg}`}
    >
      <span className="flex h-[18px] items-center text-[10px] font-medium leading-[1.2] text-[#6d82a7]">
        {label}
      </span>

      <span
        className={`flex h-[18px] shrink-0 items-center justify-end text-right text-[11.5px] font-black leading-[1.2] ${t.text}`}
      >
        {value}
      </span>
    </div>
  );
};

const HeaderInfoItem = ({ icon: Icon, children }) => (
  <div className="relative min-h-[16px]">
    <Icon
      size={13}
      className="absolute left-0 text-[#3478f6]"
      style={{
        top: '1px',
        width: '13px',
        height: '13px',
        display: 'block',
        margin: 0,
        padding: 0,
      }}
    />

    <div
      className="text-[10px] font-bold text-[#4a638b]"
      style={{
        marginLeft: '20px',
        lineHeight: '1.25',
      }}
    >
      {children}
    </div>
  </div>
);

const parseNumero = (valor) => {
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

const formatarVolume = (valor) =>
  `${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })} m³`;

export const RelatorioVisualEureka = ({
  simulacao,
  imagemSimulacao,
  dataText,
}) => {
  const dados = formatarDadosSimulacao(simulacao);
  const dimsLimpas = obterDimensoesLimpas(dados);
  const enunciado = montarEnunciado(dados);

  const dataApenas = (() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();

    return `${d} / ${m} / ${y}`;
  })();

  let statusLabel = 'EQUILÍBRIO';
  let relCond = '(P = E)';

  if (
    dados.statusFisico?.includes('AFUNDAR') ||
    dados.statusFisico?.includes('AFUNDA')
  ) {
    statusLabel = 'AFUNDA';
    relCond = '(P > E)';
  } else if (
    dados.statusFisico?.includes('FLUTUAR') ||
    dados.statusFisico?.includes('FLUTUA')
  ) {
    statusLabel = 'FLUTUA';
    relCond = '(P < E)';
  }

  const statusColor = {
    AFUNDA: {
      bg: '#f3e8ff',
      color: '#8b3bea',
    },
    FLUTUA: {
      bg: '#dcfce7',
      color: '#16a34a',
    },
    EQUILÍBRIO: {
      bg: '#e0f2fe',
      color: '#0284c7',
    },
  }[statusLabel];

  const formatMeters = (valor) => {
    const numero = Number(valor) || 0;

    return `${(numero / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} m`;
  };

  const alturaSubmersa = (() => {
    if (dados.tipo !== 'corpos-imersos') return null;

    const dim = simulacao.dimensoes || {};
    const dim1 = dim['Aresta/Raio (cm)'] || dim['Aresta/Raio'] || 0;
    const dim2 = dim['Comprimento (cm)'] || dim['Comprimento'] || 0;

    const objDens = parseFloat(simulacao.densidadeObjeto) || 0;
    const fluidDens = parseFloat(simulacao.densidadeFluido) || 0;

    if (fluidDens === 0) return null;

    const ratio = Math.min(1, objDens / fluidDens);

    let h = 0;

    if (dados.geometria === 'CUBE') {
      h = (Number(dim1) / 100) * ratio;
    } else if (dados.geometria === 'CYLINDER') {
      h = (Number(dim2) / 100) * ratio;
    } else if (dados.geometria === 'SPHERE') {
      h = (Number(dim1) / 100) * 2 * ratio;
    } else {
      h = (Number(dim2) / 100) * ratio;
    }

    if (objDens >= fluidDens) {
      if (dados.geometria === 'CUBE') {
        h = Number(dim1) / 100;
      } else if (dados.geometria === 'CYLINDER') {
        h = Number(dim2) / 100;
      } else if (dados.geometria === 'SPHERE') {
        h = (Number(dim1) / 100) * 2;
      } else {
        h = Number(dim2) / 100;
      }
    }

    return `${h.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} m`;
  })();

  const volumeSubmersoCorrigido = (() => {
    const candidatos = [
      dados.volumeDeslocado,
      simulacao.volumeDeslocado,
      simulacao.volumeSubmerso,
      simulacao.resultados?.volumeDeslocado,
      simulacao.resultados?.volumeSubmerso,
    ];

    for (const candidato of candidatos) {
      const valor = parseNumero(candidato);

      if (Number.isFinite(valor) && valor > 0) {
        return formatarVolume(valor);
      }
    }

    const volumeAtual = parseNumero(dados.volumeDeslocadoFmt);

    if (Number.isFinite(volumeAtual) && volumeAtual > 0) {
      return dados.volumeDeslocadoFmt;
    }

    const empuxo = parseNumero(dados.empuxoFmt);
    const densidadeFluido = parseNumero(
      simulacao.densidadeFluido ?? dados.densidadeFluidoFmt
    );
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
  })();

  const descricaoProblema = () => {
    const dim = simulacao.dimensoes || {};
    const dim1 =
      dim['Aresta/Raio (cm)'] ||
      dim['Aresta/Raio'] ||
      dim['Base (m)'] ||
      0;
    const dim2 =
      dim['Comprimento (cm)'] ||
      dim['Comprimento'] ||
      dim['Altura (m)'] ||
      0;

    const parseBoldText = (text) => {
      if (typeof text !== 'string') return text;

      return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-black text-[#253957]">
              {part.slice(2, -2)}
            </strong>
          );
        }

        return part;
      });
    };

    if (dados.tipo === 'corpos-imersos') {
      let objeto;

      if (dados.geometria === 'CUBE') {
        objeto = (
          <>
            Um bloco cúbico de aresta{' '}
            <strong className="font-black text-[#253957]">
              {formatMeters(dim1)}
            </strong>
          </>
        );
      } else if (dados.geometria === 'SPHERE') {
        objeto = (
          <>
            Uma esfera de raio{' '}
            <strong className="font-black text-[#253957]">
              {formatMeters(dim1)}
            </strong>
          </>
        );
      } else if (dados.geometria === 'CYLINDER') {
        objeto = (
          <>
            Um cilindro de raio{' '}
            <strong className="font-black text-[#253957]">
              {formatMeters(dim1)}
            </strong>{' '}
            e altura{' '}
            <strong className="font-black text-[#253957]">
              {formatMeters(dim2)}
            </strong>
          </>
        );
      } else if (dados.geometria === 'RECT' || dados.geometria === 'CUBOID') {
        objeto = (
          <>
            Um paralelepípedo de base{' '}
            <strong className="font-black text-[#253957]">
              {formatMeters(dim1)}
            </strong>{' '}
            e altura{' '}
            <strong className="font-black text-[#253957]">
              {formatMeters(dim2)}
            </strong>
          </>
        );
      } else {
        objeto = (
          <>
            Um corpo de dimensão característica{' '}
            <strong className="font-black text-[#253957]">
              {formatMeters(dim1)}
            </strong>
          </>
        );
      }

      return (
        <>
          {objeto} e densidade de{' '}
          <strong className="font-black text-[#253957]">
            {dados.densidadeObjetoFmt}
          </strong>{' '}
          é colocado em um recipiente contendo um fluido de densidade{' '}
          <strong className="font-black text-[#253957]">
            {dados.densidadeFluidoFmt}
          </strong>
          . Considerando a aceleração da gravidade{' '}
          <strong className="font-black text-[#253957]">
            g = {dados.gravidade}
          </strong>
          , determine:
        </>
      );
    }

    return <>{parseBoldText(enunciado)}</>;
  };

  const analiseQualitativa = () => {
    if (statusLabel === 'AFUNDA') {
      return (
        <span>
          Como o peso do corpo (P) é maior que o empuxo (E), a força resultante é
          dirigida para baixo. Assim, o corpo tenderá a{' '}
          <strong className="mx-[2px] font-black text-[#7c3aed]">
            AFUNDAR
          </strong>{' '}
          no fluido.
        </span>
      );
    }

    if (statusLabel === 'FLUTUA') {
      return (
        <span>
          Como a densidade do corpo é menor que a do fluido, o corpo irá{' '}
          <strong className="mx-[2px] font-black text-[#16a34a]">
            FLUTUAR
          </strong>
          . Parte do volume permanecerá submersa até que o empuxo equilibre o
          peso.
        </span>
      );
    }

    return (
      <span>
        O peso e o empuxo apresentam equilíbrio entre si. O objeto permanecerá em{' '}
        <strong className="mx-[2px] font-black text-[#2563eb]">
          EQUILÍBRIO
        </strong>{' '}
        no fluido.
      </span>
    );
  };

  return (
    <div
      id="relatorio-eureka"
      className="mx-auto flex flex-col overflow-hidden font-sans text-[#27446f]"
      style={{
        width: '794px',
        height: '1123px',
        boxSizing: 'border-box',
        background:
          'linear-gradient(180deg, #f8fbff 0%, #f5faff 58%, #edf7ff 100%)',
      }}
    >
      <header className="h-[96px] shrink-0 rounded-b-[6px] border-b border-[#dce8f6] bg-white px-[32px] shadow-[0_8px_20px_rgba(25,96,180,0.06)]">
        <div className="flex h-full items-center justify-between">
          <div>
            <LogoEureka size="md" animated={false} theme="colored" />

            <p className="m-0 mt-[5px] text-[10.5px] font-black tracking-[1.8px] text-[#244a82]">
              Laboratório Virtual de Hidrostática e Empuxo
            </p>
          </div>

          <div className="flex w-[255px] flex-col gap-[10px]">
            <HeaderInfoItem icon={CalendarDays}>
              Data da Simulação: {dataText}
            </HeaderInfoItem>

            <HeaderInfoItem icon={FileText}>
              <span>
                Relatório gerado automaticamente
                <br />
                pelo sistema{' '}
                <strong className="text-[#3478f6]">EUREKA</strong>
              </span>
            </HeaderInfoItem>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden px-[26px] pb-[10px] pt-[14px]">
        <Card className="shrink-0 px-[15px] py-[12px]">
          <SectionTitle icon={UserRound}>Informações Gerais</SectionTitle>

          <div className="grid grid-cols-3 gap-x-[14px] gap-y-[8px] pt-[4px]">
            <InfoLine label="Instituição" />
            <InfoLine label="Disciplina" />
            <InfoLine label="Professor(a)" />
            <InfoLine label="Aluno(a)" wide />
            <InfoLine label="Data" value={dataApenas} noLine />
          </div>
        </Card>

        <section className="mt-[14px] shrink-0">
          <h2 className="m-0 mb-[5px] text-[16px] font-black uppercase text-[#1057cc]">
            1. DESCRIÇÃO DO PROBLEMA
          </h2>

          <p className="m-0 text-[12.3px] font-medium leading-[1.6] text-[#3b557c]">
            {descricaoProblema()}
          </p>
        </section>

        <div className="mt-[14px] grid h-[346px] shrink-0 grid-cols-[1.16fr_0.94fr] gap-[15px]">
          <Card className="p-[12px]">
            <SectionTitle icon={Cuboid}>
              Visualização da Simulação
            </SectionTitle>

            <div className="relative flex h-[283px] items-center justify-center overflow-hidden rounded-[9px] border border-[#dce8f6] bg-white">
              <div className="absolute right-[8px] top-[8px] z-10 flex h-[28px] w-[28px] items-center justify-center rounded-full border border-[#dce8f6] bg-white shadow-sm">
                <Cuboid size={14} className="text-[#4d83f6]" />
              </div>

              {imagemSimulacao ? (
                <img
                  src={imagemSimulacao}
                  alt="Visualização da simulação"
                  className="block max-h-full max-w-full object-contain"
                  style={{
                    width: '108%',
                    height: '108%',
                    objectFit: 'contain',
                    objectPosition: 'center center',
                    transform: 'scale(1.2)',
                  }}
                />
              ) : (
                <span className="text-[12px] font-semibold text-[#9aadc9]">
                  [Sem imagem da simulação]
                </span>
              )}
            </div>
          </Card>

          <Card className="p-[12px]">
            <SectionTitle icon={ListChecks}>Dados da Simulação</SectionTitle>

            <div className="space-y-[3px]">
              <DataRow
                label="Geometria do Objeto:"
                value={dados.geometriaNome}
              />

              {dimsLimpas.map((d, index) => (
                <DataRow
                  key={`${d.label}-${index}`}
                  label={`${d.label}:`}
                  value={d.value}
                />
              ))}

              {dados.tipo === 'corpos-imersos' && (
                <DataRow
                  label={
                    <>
                      Densidade do Objeto (&rho;<sub>o</sub>):
                    </>
                  }
                  value={dados.densidadeObjetoFmt}
                />
              )}

              <DataRow
                label={
                  <>
                    Densidade do Fluido (&rho;<sub>f</sub>):
                  </>
                }
                value={dados.densidadeFluidoFmt}
              />

              <DataRow label="Gravidade (g):" value={dados.gravidade} />

              {dados.tipo === 'corpos-imersos' && alturaSubmersa && (
                <DataRow label="Altura Submersa (h):" value={alturaSubmersa} />
              )}

              <DataRow
                label="Volume Submerso:"
                value={volumeSubmersoCorrigido}
              />
            </div>
          </Card>
        </div>

        <div className="mt-[12px] grid h-[234px] shrink-0 grid-cols-2 gap-[15px]">
          <Card className="p-[12px]">
            <SectionTitle icon={Zap} number="2">
              Fórmulas Utilizadas
            </SectionTitle>

            <div className="space-y-[4px]">
              <FormulaRow label="Peso (P):">
                P = &rho;<sub>o</sub> &middot; g &middot; V<sub>total</sub>
              </FormulaRow>

              <FormulaRow label="Empuxo (E):">
                E = &rho;<sub>f</sub> &middot; g &middot; V<sub>submerso</sub>
              </FormulaRow>

              <FormulaRow
                label={
                  <>
                    Peso Aparente (P<sub>ap</sub>):
                  </>
                }
              >
                P<sub>ap</sub>&nbsp;=&nbsp;P &minus; E
              </FormulaRow>
            </div>
          </Card>

          <Card className="p-[12px]">
            <SectionTitle icon={BarChart3} number="3">
              Resultados Obtidos
            </SectionTitle>

            <div className="space-y-[4px]">
              <ResultRow
                label="Peso Real (P):"
                value={dados.pesoFmt}
                tone="red"
              />

              <ResultRow
                label="Empuxo (E):"
                value={dados.empuxoFmt}
                tone="green"
              />

              <ResultRow
                label={
                  <>
                    Peso Aparente (P<sub>ap</sub>):
                  </>
                }
                value={dados.pesoAparenteFmt}
                tone="blue"
              />

              <div className="grid h-[40px] grid-cols-[1fr_auto] items-center gap-[8px] rounded-[8px] bg-[#fbf7ff] px-[10px]">
                <span className="flex h-[18px] items-center text-[10px] font-medium leading-[1.2] text-[#6d82a7]">
                  Condição:
                </span>

                <div className="grid min-w-[78px] place-items-center gap-[3px]">
                  <span
                    className="flex h-[18px] items-center justify-center rounded-full px-[14px] text-[10.5px] font-black leading-[1]"
                    style={{
                      background: statusColor.bg,
                      color: statusColor.color,
                    }}
                  >
                    {statusLabel}
                  </span>

                  <span className="text-center text-[9px] font-bold leading-[1] text-[#667895]">
                    {relCond}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="mt-[12px] shrink-0 px-[12px] py-[10px]">
          <SectionTitle icon={ShieldCheck} number="4">
            Análise Qualitativa
          </SectionTitle>

          <div className="flex min-h-[36px] items-center justify-center rounded-[8px] bg-[#f8fbff] px-[12px] py-[8px] text-center text-[10.8px] font-medium leading-[1.5] text-[#3b557c]">
            {analiseQualitativa()}
          </div>
        </Card>
      </main>

      <footer className="h-[58px] shrink-0 border-t border-[#d8e8f8] bg-gradient-to-r from-[#dff3ff] via-[#eef9ff] to-[#d8f4ff]">
        <div className="flex h-full flex-col items-center justify-center gap-[3px]">
          <LogoEureka size="sm" animated={false} theme="colored" />

          <p className="m-0 text-[8px] font-black tracking-[0.5px] text-[#6982a3]">
            Laboratório Virtual de Hidrostática e Empuxo
          </p>
        </div>
      </footer>
    </div>
  );
};