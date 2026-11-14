import React from 'react';
import {
  Cuboid,
  ListChecks,
  Pencil,
  ClipboardList,
} from 'lucide-react';

import { formatarDadosSimulacao } from '../../utils/exportacao/formatarDadosSimulacao';
import { montarEnunciado } from '../../utils/exportacao/montarEnunciado';
import {
  SectionTitle,
  Card,
  DataRow,
  ReportHeader,
  InfoGeralCard,
  ReportFooter,
  SimulationImageBox,
  buildSimulationDataRows,
  SimulationDataContinuationCard,
  chunkArray,
  renderDescricaoProblema,
} from './ReportShared';

const QuestionItem = ({ letter, children }) => (
  <li className="grid grid-cols-[20px_1fr] items-start gap-[4px] text-[11.5px] font-semibold leading-[1.45] text-[#314b73]">
    <span className="font-black leading-[1.45] text-[#1f6fff]">{letter})</span>
    <span>{children}</span>
  </li>
);

const PAGE1_DATA_LIMIT = 11;

export const RelatorioProvaEureka = ({
  simulacao,
  imagemSimulacao,
  dataText,
}) => {
  const dados = formatarDadosSimulacao(simulacao);
  const enunciado = montarEnunciado(dados);
  const dataRows = buildSimulationDataRows(dados, { includeCalculated: false });

  const page1Rows = dataRows.slice(0, PAGE1_DATA_LIMIT);
  const remainingRows = dataRows.slice(PAGE1_DATA_LIMIT);
  const continuationChunks = remainingRows.length > 0 ? chunkArray(remainingRows, 28) : [];

  return (
    <div id="relatorio-eureka" className="flex flex-col gap-[16px]">
      {/* ── PÁGINA 1: IDENTIFICAÇÃO, DESCRIÇÃO, CENA, DADOS E QUESTÕES PROPOSTAS ── */}
      <div
        className="pdf-page mx-auto flex flex-col overflow-hidden font-sans text-[#27446f]"
        style={{
          width: '794px',
          height: '1123px',
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #f8fbff 0%, #f5faff 58%, #edf7ff 100%)',
        }}
      >
        <ReportHeader
          subtitle="ATIVIDADE DE APRENDIZAGEM — Hidrostática e Empuxo"
          dataText={dataText}
          documentKindText="Atividade gerada automaticamente"
        />

        <main className="flex flex-1 flex-col px-[26px] pb-[14px] pt-[16px]">
          <InfoGeralCard />

          <section className="mt-[16px] shrink-0">
            <h2 className="m-0 mb-[10px] text-[16px] font-black uppercase text-[#1057cc]">
              1. DESCRIÇÃO DO PROBLEMA
            </h2>
            <p className="m-0 text-[12px] font-medium leading-[1.55] text-[#3b557c]">
              {renderDescricaoProblema(simulacao, dados, enunciado)}
            </p>
          </section>

          <div className="mt-[24px] grid min-h-[425px] shrink-0 grid-cols-[1.22fr_0.88fr] items-stretch gap-[15px]">
            <Card className="flex flex-col p-[12px]">
              <SectionTitle icon={Cuboid}>Cena da Simulação</SectionTitle>
              <SimulationImageBox
                src={imagemSimulacao}
                alt="Cena da simulação"
                heightClass="flex-1 min-h-[355px]"
              />
            </Card>

            <Card className="flex flex-col p-[12px]" allowOverflow>
              <SectionTitle icon={ListChecks}>Dados da Simulação</SectionTitle>
              <div className="space-y-[4px]">
                {page1Rows.map((row, idx) => (
                  <DataRow key={`p1-row-${idx}`} label={row.label} value={row.value} />
                ))}
              </div>
            </Card>
          </div>

          <Card className="mt-[20px] flex flex-1 flex-col px-[12px] pt-[10px] pb-[14px]">
            <SectionTitle icon={ClipboardList} number="2">
              Questões propostas
            </SectionTitle>

            <ul className="m-0 grid list-none grid-cols-2 grid-flow-col grid-rows-3 items-start gap-x-[24px] gap-y-[9px] px-[4px] py-[4px]">
              {dados.tipo === 'corpos-imersos' && (
                <>
                  <QuestionItem letter="a">Calcule o peso real do objeto.</QuestionItem>
                  <QuestionItem letter="b">Calcule o empuxo exercido pelo fluido.</QuestionItem>
                  <QuestionItem letter="c">Calcule o peso aparente do objeto.</QuestionItem>
                  <QuestionItem letter="d">
                    Determine se o corpo flutua, afunda ou permanece em equilíbrio.
                  </QuestionItem>
                  <QuestionItem letter="e">Determine a altura submersa do corpo.</QuestionItem>
                  <QuestionItem letter="f">Determine o volume de fluido deslocado.</QuestionItem>
                </>
              )}

              {dados.tipo === 'comportas' && (
                <>
                  <QuestionItem letter="a">Calcule a profundidade do centróide (h_cg).</QuestionItem>
                  <QuestionItem letter="b">Calcule a força hidrostática resultante atuante na comporta.</QuestionItem>
                  <QuestionItem letter="c">Determine a profundidade do centro de pressão (h_cp).</QuestionItem>
                  <QuestionItem letter="d">Determine o braço de alavanca da força hidrostática em relação à articulação.</QuestionItem>
                  <QuestionItem letter="e">Caso aplicável, calcule o peso da comporta.</QuestionItem>
                  <QuestionItem letter="f">Através da equação de momentos, dimensione a força mínima no tirante para que ocorra equilíbrio.</QuestionItem>
                </>
              )}

              {dados.tipo === 'barragens' && (
                <>
                  <QuestionItem letter="a">Calcule o peso total e volume em 1m linear da barragem e componentes extras.</QuestionItem>
                  <QuestionItem letter="b">Determine a força hidrostática horizontal e seu centro de aplicação.</QuestionItem>
                  <QuestionItem letter="c">Determine a componente vertical hidrostática.</QuestionItem>
                  <QuestionItem letter="d">
                    Calcule a subpressão ao longo da base, se houver percolação assumida de forma linear.
                  </QuestionItem>
                  <QuestionItem letter="e">Determine o Fator de Segurança ao Deslizamento.</QuestionItem>
                  <QuestionItem letter="f">Determine o Fator de Segurança ao Tombamento na crista de jusante.</QuestionItem>
                </>
              )}
            </ul>
          </Card>
        </main>

        <ReportFooter heightClass="h-[52px]" />
      </div>

      {/* ── PÁGINAS DEDICADAS DE CONTINUAÇÃO DE DADOS (APENAS SE EXCEDER 11 PARÂMETROS) ── */}
      {continuationChunks.map((chunk, pageIdx) => (
        <div
          key={`cont-page-${pageIdx}`}
          className="pdf-page mx-auto flex flex-col overflow-hidden font-sans text-[#27446f]"
          style={{
            width: '794px',
            height: '1123px',
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #f8fbff 0%, #f5faff 58%, #edf7ff 100%)',
          }}
        >
          <ReportHeader
            subtitle="ATIVIDADE DE APRENDIZAGEM — Hidrostática e Empuxo"
            dataText={dataText}
            documentKindText="Atividade gerada automaticamente"
          />

          <main className="flex flex-1 flex-col px-[26px] pb-[10px] pt-[14px]">
            <SimulationDataContinuationCard rows={chunk} />
          </main>

          <ReportFooter heightClass="h-[52px]" />
        </div>
      ))}

      {/* ── PÁGINA DEDICADA EXCLUSIVAMENTE AO ESPAÇO PARA RESOLUÇÃO ── */}
      <div
        className="pdf-page mx-auto flex flex-col overflow-hidden font-sans text-[#27446f]"
        style={{
          width: '794px',
          height: '1123px',
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #f8fbff 0%, #f5faff 58%, #edf7ff 100%)',
        }}
      >
        <ReportHeader
          subtitle="ATIVIDADE DE APRENDIZAGEM — Hidrostática e Empuxo"
          dataText={dataText}
          documentKindText="Atividade gerada automaticamente"
        />

        <main className="flex flex-1 flex-col px-[26px] pb-[10px] pt-[14px]">
          <Card className="flex flex-1 flex-col px-[12px] py-[10px]">
            <SectionTitle icon={Pencil} number="3">
              Espaço para resolução
            </SectionTitle>

            <div className="w-full flex-1" />
          </Card>
        </main>

        <ReportFooter heightClass="h-[52px]" />
      </div>
    </div>
  );
};