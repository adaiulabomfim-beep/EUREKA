import React from 'react';
import {
  CalendarDays,
  FileText,
  UserRound,
  Cuboid,
  ListChecks,
  HelpCircle,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';

import {
  formatarDadosSimulacao,
  obterDimensoesLimpas,
} from '../../utils/exportacao/formatarDadosSimulacao';

import { montarEnunciado } from '../../utils/exportacao/montarEnunciado';
import { LogoEureka } from '../ui/LogoEureka';

/* ─────────────────────────────────────────────
   SectionTitle
   FIX: flex + items-center — ícone e
        texto sempre no centro vertical da linha.
───────────────────────────────────────────── */
const SectionTitle = ({ icon: Icon, children, number }) => (
  <div className="mb-[8px] flex items-center gap-[6px] border-b border-[#dbe8f7] pb-[7px]">
    {Icon && <Icon size={16} strokeWidth={2.3} className="shrink-0 text-[#3478f6]" />}
    <h3 className="m-0 text-[12px] font-black uppercase leading-tight tracking-[0.5px] text-[#23477f]">
      {number ? `${number}. ` : ''}{children}
    </h3>
  </div>
);

/* ─────────────────────────────────────────────
   Card
───────────────────────────────────────────── */
const Card = ({ children, className = '' }) => (
  <section
    className={`overflow-hidden rounded-[12px] border border-[#dbe8f7] bg-white shadow-[0_3px_10px_rgba(47,91,140,0.12)] ${className}`}
  >
    {children}
  </section>
);

/* ─────────────────────────────────────────────
   InfoLine
   FIX 1 – items-end: label e underline ficam no
            mesmo baseline (linha não sobra acima).
   FIX 2 – removido justify-center no inner div.
   FIX 3 – prop noLine: campo Data sem underline.
   FIX 4 – shrink-0 no label para não comprimir
            o underline.
───────────────────────────────────────────── */
const InfoLine = ({ label, wide, value, noLine }) => (
  <div className={`${wide ? 'col-span-2' : ''} flex min-h-[26px] items-center gap-[6px]`}>
    <span className="shrink-0 whitespace-nowrap text-[10.5px] font-semibold leading-tight text-[#6b82a9]">
      {label}:
    </span>

    {noLine ? (
      /* sem underline — apenas o valor (ex.: Data) */
      <span className="text-[11.5px] font-black leading-tight tracking-[2px] text-[#244a82]">
        {value}
      </span>
    ) : (
      /* com underline */
      <div className="flex flex-1 items-center border-b border-[#bfd2ef] pt-[4px]">
        {value && (
          <span className="text-[11.5px] font-black leading-tight tracking-[2px] text-[#244a82] translate-y-[-2px]">
            {value}
          </span>
        )}
      </div>
    )}
  </div>
);

/* ─────────────────────────────────────────────
   DataRow
   FIX – flex + h fixo + items-center: conteúdo
         sempre no centro vertical do card-row;
         shrink-0 no value evita compressão.
───────────────────────────────────────────── */
const DataRow = ({ label, value }) => (
  <div className="flex min-h-[28px] items-center justify-between gap-[8px] rounded-[7px] border border-[#dce8f6] bg-[#fbfdff] px-[10px] py-[4px]">
    <span className="text-[10px] font-medium leading-tight text-[#6d82a7]">
      {label}
    </span>
    <span className="shrink-0 text-right text-[10px] font-black leading-tight text-[#2f4468]">
      {value}
    </span>
  </div>
);

/* ─────────────────────────────────────────────
   QuestionItem
   FIX – items-start: letra e texto alinhados
         pelo topo quando o texto quebra linha.
───────────────────────────────────────────── */
const QuestionItem = ({ letter, children }) => (
  <li className="grid grid-cols-[20px_1fr] items-start gap-[4px] text-[11.5px] font-semibold leading-[1.45] text-[#314b73]">
    <span className="font-black leading-[1.45] text-[#1f6fff]">{letter})</span>
    <span>{children}</span>
  </li>
);

/* ─────────────────────────────────────────────
   AnswerLine
   FIX – flex + items-center para linhas simples;
         items-start quando sub/superscripts.
───────────────────────────────────────────── */
const AnswerLine = ({ letter, children }) => (
  <div className="flex items-center gap-[8px] rounded-[8px] bg-white/70 px-[10px] py-[6px] text-[12px] leading-snug text-[#314b73]">
    <strong className="shrink-0 text-[#13996d]">{letter})</strong>
    <span className="leading-[1.4]">{children}</span>
  </div>
);

/* ═══════════════════════════════════════════════
   Componente principal
═══════════════════════════════════════════════ */
export const RelatorioProvaEureka = ({
  simulacao,
  imagemSimulacao,
  dataText,
  isGabarito,
}) => {
  const dados      = formatarDadosSimulacao(simulacao);
  const dimsLimpas = obterDimensoesLimpas(dados);
  const enunciado  = montarEnunciado(dados);

  const dataApenas = (() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d} / ${m} / ${y}`;
  })();

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

  const formatMeters = (valor) => {
    const numero = Number(valor) || 0;
    return `${(numero / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} m`;
  };

  const alturaSubmersa = (() => {
    if (dados.tipo !== 'corpos-imersos') return null;

    const dim       = simulacao.dimensoes || {};
    const dim1      = dim['Aresta/Raio (cm)'] || dim['Aresta/Raio'] || 0;
    const dim2      = dim['Comprimento (cm)'] || dim['Comprimento'] || 0;
    const objDens   = parseNumero(simulacao.densidadeObjeto)  || 0;
    const fluidDens = parseNumero(simulacao.densidadeFluido)  || 0;

    if (fluidDens === 0) return null;

    const ratio = Math.min(1, objDens / fluidDens);
    let h = 0;

    if      (dados.geometria === 'CUBE')     h = (Number(dim1) / 100) * ratio;
    else if (dados.geometria === 'CYLINDER') h = (Number(dim2) / 100) * ratio;
    else if (dados.geometria === 'SPHERE')   h = (Number(dim1) / 100) * 2 * ratio;
    else                                     h = (Number(dim2) / 100) * ratio;

    if (objDens >= fluidDens) {
      if      (dados.geometria === 'CUBE')     h = Number(dim1) / 100;
      else if (dados.geometria === 'CYLINDER') h = Number(dim2) / 100;
      else if (dados.geometria === 'SPHERE')   h = (Number(dim1) / 100) * 2;
      else                                     h = Number(dim2) / 100;
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
      if (Number.isFinite(valor) && valor > 0) return formatarVolume(valor);
    }

    const volumeAtual = parseNumero(dados.volumeDeslocadoFmt);
    if (Number.isFinite(volumeAtual) && volumeAtual > 0) return dados.volumeDeslocadoFmt;

    const empuxo        = parseNumero(dados.empuxoFmt);
    const densidadeFluido = parseNumero(simulacao.densidadeFluido ?? dados.densidadeFluidoFmt);
    const gravidade     = parseNumero(simulacao.gravidade ?? dados.gravidade);

    if (
      Number.isFinite(empuxo) && Number.isFinite(densidadeFluido) &&
      Number.isFinite(gravidade) && empuxo > 0 && densidadeFluido > 0 && gravidade > 0
    ) {
      return formatarVolume(empuxo / (densidadeFluido * gravidade));
    }

    return dados.volumeDeslocadoFmt;
  })();

  const descricaoProblema = () => {
    const dim  = simulacao.dimensoes || {};
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

  /* ── Render ─────────────────────────── */
  return (
    <div
      id="relatorio-eureka"
      className="mx-auto flex flex-col overflow-hidden font-sans text-[#27446f]"
      style={{
        width: '794px',
        height: '1123px',
        boxSizing: 'border-box',
        background: 'linear-gradient(180deg, #f8fbff 0%, #f5faff 58%, #edf7ff 100%)',
      }}
    >
      {/* ── Header ─────────────────────── */}
      <header className="h-[96px] shrink-0 rounded-b-[6px] border-b border-[#dce8f6] bg-white px-[32px] shadow-[0_8px_20px_rgba(25,96,180,0.06)]">
        <div className="flex h-full items-center justify-between">
          {/* logo + subtítulo */}
          <div>
            <LogoEureka size="md" animated={false} theme="colored" />
            <p className="m-0 mt-[5px] text-[10.5px] font-black tracking-[1.5px] text-[#244a82]">
              {isGabarito ? 'GABARITO — Estudo Dirigido' : 'ESTUDO DIRIGIDO — Hidrostática e Empuxo'}
            </p>
          </div>

          {/* info direita
              FIX: items-start + translate-y no ícone para alinhar
                   com a primeira linha do texto multiline.
          */}
          <div className="flex w-[255px] flex-col gap-[10px] text-[10px] font-bold leading-snug text-[#4a638b]">
            <div className="flex items-start gap-[7px]">
              <CalendarDays size={13} className="mt-[1px] shrink-0 text-[#3478f6]" />
              <span className="leading-none pt-[1px]">Data da Simulação: {dataText}</span>
            </div>

            <div className="flex items-start gap-[7px]">
              <FileText size={13} className="mt-[1px] shrink-0 text-[#3478f6]" />
              <span className="leading-[1.35]">
                {isGabarito ? 'Material exclusivo do professor' : 'Atividade gerada automaticamente'}
                <br />pelo sistema <strong className="text-[#3478f6]">EUREKA</strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden px-[26px] pb-[10px] pt-[14px]">

        {/* Informações Gerais */}
        <Card className="shrink-0 px-[15px] py-[12px]">
          <SectionTitle icon={UserRound}>Informações Gerais</SectionTitle>
          <div className="grid grid-cols-3 gap-x-[14px] gap-y-[8px] pt-[4px]">
            <InfoLine label="Instituição" />
            <InfoLine label="Disciplina" />
            <InfoLine label="Professor(a)" />
            <InfoLine label="Aluno(a)" wide />
            {/* FIX: noLine remove o underline da Data */}
            <InfoLine label="Data" value={dataApenas} noLine />
          </div>
        </Card>

        {/* Descrição do Problema */}
        <section className="mt-[14px] shrink-0">
          <h2 className="m-0 mb-[6px] text-[16px] font-black uppercase text-[#1057cc]">
            1. DESCRIÇÃO DO PROBLEMA
          </h2>
          <p className="m-0 text-[12.2px] font-medium leading-[1.55] text-[#3b557c]">
            {descricaoProblema()}
          </p>
        </section>

        {/* Cena + Dados */}
        <div className="mt-[12px] grid min-h-[292px] flex-1 shrink-0 grid-cols-[1.16fr_0.94fr] gap-[15px]">
          <Card className="p-[12px]">
            <SectionTitle icon={Cuboid}>Cena da Simulação</SectionTitle>
            <div className="relative flex h-[207px] items-center justify-center overflow-hidden rounded-[9px] border border-[#dce8f6] bg-white">
              <div className="absolute right-[8px] top-[8px] z-10 flex h-[28px] w-[28px] items-center justify-center rounded-full border border-[#dce8f6] bg-white shadow-sm">
                <Cuboid size={14} className="text-[#4d83f6]" />
              </div>
              {imagemSimulacao ? (
                <img
                  src={imagemSimulacao}
                  alt="Cena da simulação"
                  style={{ width: '108%', height: '108%', objectFit: 'contain', transform: 'scale(1.2)' }}
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
              <DataRow label="Geometria do Objeto:" value={dados.geometriaNome} />
              {dimsLimpas.map((d, i) => (
                <DataRow key={`${d.label}-${i}`} label={`${d.label}:`} value={d.value} />
              ))}
              {dados.tipo === 'corpos-imersos' && (
                <DataRow
                  label={<>Densidade do Objeto (&rho;<sub>o</sub>):</>}
                  value={dados.densidadeObjetoFmt}
                />
              )}
              <DataRow label={<>Densidade do Fluido (&rho;<sub>f</sub>):</>} value={dados.densidadeFluidoFmt} />
              <DataRow label="Gravidade (g):" value={dados.gravidade} />
              {dados.tipo === 'corpos-imersos' && alturaSubmersa && (
                <DataRow label="Altura Submersa (h):" value={alturaSubmersa} />
              )}
              {dados.tipo === 'corpos-imersos' && (
                <DataRow label="Volume Submerso:" value={volumeSubmersoCorrigido} />
              )}
              {dados.tipo !== 'corpos-imersos' && (
                <DataRow
                  label="Nível d'água (Montante):"
                  value={dados.alturaSubmersa ? `${Number(dados.alturaSubmersa).toLocaleString('pt-BR', {minimumFractionDigits: 2})} m` : '0,00 m'}
                />
              )}
            </div>
          </Card>
        </div>

        {/* Questões Propostas */}
        <Card className="mt-[12px] min-h-[188px] shrink-0 px-[12px] py-[10px]">
          <SectionTitle icon={ClipboardList} number="2">
            Questões propostas
          </SectionTitle>

          <div className="grid min-h-[136px] flex-1 grid-cols-[1fr_1fr] gap-[12px]">
            {dados.tipo === 'corpos-imersos' && (
              <>
                <div className="rounded-[9px] border border-[#dce8f6] bg-[#fbfdff] px-[14px] py-[12px]">
                  <ul className="m-0 flex h-full list-none flex-col justify-between p-0">
                    <QuestionItem letter="a">Calcule o peso real do objeto.</QuestionItem>
                    <QuestionItem letter="b">Calcule o empuxo exercido pelo fluido.</QuestionItem>
                    <QuestionItem letter="c">Calcule o peso aparente do objeto.</QuestionItem>
                  </ul>
                </div>

                <div className="rounded-[9px] border border-[#dce8f6] bg-[#fbfdff] px-[14px] py-[12px]">
                  <ul className="m-0 flex h-full list-none flex-col justify-between p-0">
                    <QuestionItem letter="d">
                      Determine se o corpo flutua, afunda ou permanece em equilíbrio.
                    </QuestionItem>
                    <QuestionItem letter="e">Determine a altura submersa do corpo.</QuestionItem>
                    <QuestionItem letter="f">Determine o volume de fluido deslocado.</QuestionItem>
                  </ul>
                </div>
              </>
            )}
            {dados.tipo === 'comportas' && (
              <>
                <div className="rounded-[9px] border border-[#dce8f6] bg-[#fbfdff] px-[14px] py-[12px]">
                  <ul className="m-0 flex h-full list-none flex-col justify-between p-0">
                    <QuestionItem letter="a">Calcule a profundidade do centróide (h_cg).</QuestionItem>
                    <QuestionItem letter="b">Calcule a força hidrostática resultante atuante na comporta.</QuestionItem>
                    <QuestionItem letter="c">Determine a profundidade do centro de pressão (h_cp).</QuestionItem>
                  </ul>
                </div>

                <div className="rounded-[9px] border border-[#dce8f6] bg-[#fbfdff] px-[14px] py-[12px]">
                  <ul className="m-0 flex h-full list-none flex-col justify-between p-0">
                    <QuestionItem letter="d">Determine o braço de alavanca da força hidrostática em relação à articulação.</QuestionItem>
                    <QuestionItem letter="e">Caso aplicável, calcule o peso da comporta.</QuestionItem>
                    <QuestionItem letter="f">Através da equação de momentos, dimensione a força mínima no tirante para que ocorra equilíbrio.</QuestionItem>
                  </ul>
                </div>
              </>
            )}
            {dados.tipo === 'barragens' && (
              <>
                <div className="rounded-[9px] border border-[#dce8f6] bg-[#fbfdff] px-[14px] py-[12px]">
                  <ul className="m-0 flex h-full list-none flex-col justify-between p-0">
                    <QuestionItem letter="a">Calcule o peso total e volume em 1m linear da barragem e componentes extras.</QuestionItem>
                    <QuestionItem letter="b">Determine a força hidrostática horizontal e seu centro de aplicação.</QuestionItem>
                    <QuestionItem letter="c">Determine a componente vertical hidrostática.</QuestionItem>
                  </ul>
                </div>

                <div className="rounded-[9px] border border-[#dce8f6] bg-[#fbfdff] px-[14px] py-[12px]">
                  <ul className="m-0 flex h-full list-none flex-col justify-between p-0">
                    <QuestionItem letter="d">
                      Calcule a subpressão ao longo da base, se houver percolação assumida de forma linear.
                    </QuestionItem>
                    <QuestionItem letter="e">Determine o Fator de Segurança ao Deslizamento.</QuestionItem>
                    <QuestionItem letter="f">Determine o Fator de Segurança ao Tombamento na crista de jusante.</QuestionItem>
                  </ul>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Gabarito / Espaço para resolução */}
        <Card className="mt-[12px] min-h-[260px] shrink-0 px-[12px] py-[10px]">
          <SectionTitle icon={isGabarito ? ShieldCheck : HelpCircle} number="3">
            {isGabarito ? 'Gabarito' : 'Espaço para resolução'}
          </SectionTitle>

          {isGabarito ? (
            <div className="relative min-h-[190px] w-full overflow-hidden rounded-[9px] border border-emerald-200 bg-[#f7fffb] px-[12px] py-[10px]">
              {/* barra lateral verde */}
              <div className="absolute left-0 top-0 h-full w-[4px] bg-[#1fc896]" />

              {/*
                FIX: grid com items-center para as AnswerLines ficarem
                     centralizadas verticalmente em cada célula.
              */}
              <div className="grid h-full grid-cols-2 items-center gap-[3px] pl-[2px]">
                {dados.tipo === 'corpos-imersos' && (
                  <>
                    <AnswerLine letter="a">P = {dados.pesoFmt}</AnswerLine>
                    <AnswerLine letter="b">E = {dados.empuxoFmt}</AnswerLine>
                    <AnswerLine letter="c">
                      P<sub>ap</sub> = {dados.pesoAparenteFmt}
                    </AnswerLine>
                    <AnswerLine letter="d">{dados.statusFisico}</AnswerLine>
                    <AnswerLine letter="e">
                      h<sub>submersa</sub> = {alturaSubmersa || '—'}
                    </AnswerLine>
                    <AnswerLine letter="f">V = {volumeSubmersoCorrigido}</AnswerLine>
                  </>
                )}
                {dados.tipo === 'comportas' && (
                  <>
                    <AnswerLine letter="a">h<sub>cg</sub> = {dados.analyzedResults && dados.analyzedResults.forceData.up ? (dados.analyzedResults.forceData.up.h_cg).toLocaleString('pt-BR', {minimumFractionDigits: 3}) : '-'} m</AnswerLine>
                    <AnswerLine letter="b">F = {dados.analyzedResults ? (dados.analyzedResults.forceData.FR_net / 1000).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '-'} kN</AnswerLine>
                    <AnswerLine letter="c">y<sub>cp</sub> = {dados.analyzedResults ? (dados.analyzedResults.forceData.s_cp_net).toLocaleString('pt-BR', {minimumFractionDigits: 3}) : '-'} m</AnswerLine>
                    <AnswerLine letter="d">braço = {dados.analyzedResults ? Math.abs((dados.analyzedResults.forceData.s_cp_net || 0)).toLocaleString('pt-BR', {minimumFractionDigits: 3}) : '-'} m</AnswerLine>
                    <AnswerLine letter="e">P = {dados.peso ? (dados.peso).toLocaleString('pt-BR', {minimumFractionDigits: 2}) + ' N' : '-'}</AnswerLine>
                    <AnswerLine letter="f">F<sub>tirante</sub> = {dados.analyzedResults && dados.analyzedResults.equilibrium ? (dados.analyzedResults.equilibrium.F_tie).toLocaleString('pt-BR', {minimumFractionDigits: 2}) + ' N' : '-'}</AnswerLine>
                  </>
                )}
                {dados.tipo === 'barragens' && (
                  <>
                    <AnswerLine letter="a">W = {dados.analyzedResults && dados.analyzedResults.stabilityData ? (dados.analyzedResults.stabilityData.weight / 1000).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '-'} kN</AnswerLine>
                    <AnswerLine letter="b">F<sub>H</sub> = {dados.analyzedResults ? (dados.analyzedResults.forceData.FR_net / 1000).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '-'} kN, y<sub>cp</sub> = {dados.analyzedResults ? (dados.analyzedResults.forceData.y_cp_net).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '-'} m</AnswerLine>
                    <AnswerLine letter="c">F<sub>V</sub> = -</AnswerLine>
                    <AnswerLine letter="d">U = -</AnswerLine>
                    <AnswerLine letter="e">FS<sub>desliz</sub> = {dados.analyzedResults && dados.analyzedResults.stabilityData ? (dados.analyzedResults.stabilityData.fs_desl).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '-'}</AnswerLine>
                    <AnswerLine letter="f">FS<sub>tomba</sub> = {dados.analyzedResults && dados.analyzedResults.stabilityData ? (dados.analyzedResults.stabilityData.fs_tomb).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '-'}</AnswerLine>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="grid min-h-[190px] grid-cols-2 gap-[8px]">
              <div className="rounded-[9px] border border-dashed border-[#b8cce8] bg-[#fbfdff]" />
              <div className="rounded-[9px] border border-dashed border-[#b8cce8] bg-[#fbfdff]" />
            </div>
          )}
        </Card>
      </main>

      {/* ── Footer ─────────────────────── */}
      <footer className="h-[52px] shrink-0 border-t border-[#d8e8f8] bg-gradient-to-r from-[#dff3ff] via-[#eef9ff] to-[#d8f4ff]">
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