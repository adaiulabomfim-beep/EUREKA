import React, { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Scale, Anchor, Droplets, ChevronLeft, BookOpen, Lightbulb } from 'lucide-react';

type SubjectId = 'hidrostatica' | 'arquimedes' | 'pascal' | 'estabilidade' | 'manometria' | null;

export const TheoryReference: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(null);

  const subjects = [
    {
      id: 'hidrostatica' as SubjectId,
      title: 'Lei de Stevin & Hidrostática',
      icon: <ArrowDownToLine className="w-6 h-6 text-cyan-600" />,
      theme: {
        bgIcon: 'bg-cyan-50',
        bgHeader: 'bg-cyan-50/50',
        borderCard: 'border-cyan-100',
        hoverBorder: 'hover:border-cyan-300',
        hoverShadow: 'hover:shadow-cyan-200/20',
        textAction: 'text-cyan-600',
        bgFormulas: 'bg-cyan-50',
        textFormulas: 'text-cyan-900',
        borderFormulas: 'border-cyan-200/50'
      },
      summary: 'A pressão em um fluido aumenta linearmente com a profundidade (Lei de Stevin).',
      details: (
        <>
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            A Hidrostática estuda os fluidos em repouso. Segundo a <strong>Lei de Stevin</strong>, a diferença de pressão entre dois pontos de um fluido em repouso é igual ao peso específico do fluido multiplicado pela diferença de profundidade entre eles.
          </p>
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            <strong>Paradoxo Hidrostático:</strong> A pressão no fundo de um recipiente depende exclusivamente da altura da coluna de líquido e da sua densidade, sendo totalmente independente do formato ou volume total do recipiente. Além disso, a pressão em um fluido age sempre perpendicularmente às superfícies submersas.
          </p>
          <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100 text-center font-serif text-lg mb-4 text-slate-800">
            P = P<sub>atm</sub> + γ · h
          </div>
          
          <h4 className="font-bold text-slate-700 text-sm mb-2 mt-6">Força em Superfícies Planas</h4>
          <p className="text-xs text-slate-500 mb-2">
            A força resultante atua no <strong>Centro de Pressão (CP)</strong>, que está sempre abaixo do Centro de Gravidade (CG) da área molhada devido ao aumento linear da pressão com a profundidade.
          </p>
          
          <div className="mt-8 bg-cyan-600/5 border border-cyan-200/50 rounded-2xl p-5 relative">
             <div className="absolute -top-3 -left-3 bg-cyan-100 p-2 rounded-full border border-cyan-200 shadow-sm text-cyan-700">
               <Lightbulb className="w-5 h-5" />
             </div>
             <h4 className="font-bold text-cyan-800 text-sm mb-3 ml-6">Exemplo Ilustrativo Prático</h4>
             <p className="text-sm text-slate-700 mb-3 leading-relaxed">
               <strong>Situação:</strong> Uma piscina tem 3 metros de profundidade e está cheia de água (γ = 10.000 N/m³). Queremos descobrir a pressão hidrostática no fundo (desconsiderando a pressão atmosférica para achar a pressão manométrica).
             </p>
             <div className="bg-white/60 p-4 rounded-xl text-sm text-slate-700 font-mono">
                P = γ · h<br/>
                P = 10.000 N/m³ · 3 m<br/>
                P = 30.000 N/m² (ou 30 kPa)
             </div>
             <p className="text-xs text-slate-500 mt-3 leading-relaxed">
               Se a base desta piscina tiver uma área de 10 m², a força total exercida pela água sobre o fundo seria F = P · A = 30.000 · 10 = 300.000 N (equivalente ao peso de cerca de 30 toneladas!).
             </p>
          </div>
        </>
      ),
      formulas: [
        { name: 'Pressão Hidrostática', eq: 'P = P<sub>atm</sub> + γ · h' },
        { name: 'Força Resultante', eq: 'F = P<sub>CG</sub> · A' },
        { name: 'Posição Y do Centro de Pressão', eq: 'y<sub>p</sub> = ȳ + I<sub>0</sub> / (A · ȳ)' },
      ]
    },
    {
      id: 'arquimedes' as SubjectId,
      title: 'Princípio de Arquimedes (Empuxo)',
      icon: <ArrowUpFromLine className="w-6 h-6 text-blue-600" />,
      theme: {
        bgIcon: 'bg-blue-50',
        bgHeader: 'bg-blue-50/50',
        borderCard: 'border-blue-100',
        hoverBorder: 'hover:border-blue-300',
        hoverShadow: 'hover:shadow-blue-200/20',
        textAction: 'text-blue-600',
        bgFormulas: 'bg-blue-50',
        textFormulas: 'text-blue-900',
        borderFormulas: 'border-blue-200/50'
      },
      summary: 'Todo corpo submerso sofre uma força vertical para cima (Empuxo) devido à pressão do fluido.',
      details: (
        <>
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            "Um corpo total ou parcialmente imerso em um fluido sofre uma força de baixo para cima denominada empuxo (E), 
            igual ao peso do volume do fluido que ele deslocou." 
          </p>
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            <strong>Como navios de aço flutuam?</strong> O aço é muito mais denso que a água, porém, um navio é oco por dentro (cheio de ar). Assim, a sua "densidade média" global (massa total / volume total) se torna menor do que a da água. O grande volume submerso do casco desloca uma enorme quantidade de água, gerando um Empuxo colossal que equilibra o peso de milhares de toneladas do navio de aço.
          </p>
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-center font-serif text-xl mb-6 text-slate-800">
            E = γ<sub>fluido</sub> · V<sub>sub</sub>
          </div>
          
          <div className="mt-8 bg-blue-600/5 border border-blue-200/50 rounded-2xl p-5 relative">
             <div className="absolute -top-3 -left-3 bg-blue-100 p-2 rounded-full border border-blue-200 shadow-sm text-blue-700">
               <Lightbulb className="w-5 h-5" />
             </div>
             <h4 className="font-bold text-blue-800 text-sm mb-3 ml-6">Exemplo Ilustrativo Prático</h4>
             <p className="text-sm text-slate-700 mb-3 leading-relaxed">
               <strong>A Lenda da Coroa de Ouro:</strong> Imagine que uma coroa de ouro falso tem uma massa de 2 kg (Peso de ~20 N). O volume real dessa coroa é de 0,0002 m³.
               Se mergulharmos essa coroa num balde de água (γ = 10.000 N/m³), qual será o peso medido na balança (Peso Aparente)?
             </p>
             <div className="bg-white/60 p-4 rounded-xl text-sm text-slate-700 font-mono mb-2">
                E = γ<sub>água</sub> · V<sub>sub</sub><br/>
                E = 10.000 N/m³ · 0,0002 m³ = 2 N
             </div>
             <div className="bg-white/60 p-4 rounded-xl text-sm text-slate-700 font-mono">
                P<sub>aparente</sub> = P<sub>real</sub> - E<br/>
                P<sub>aparente</sub> = 20 N - 2 N = 18 N
             </div>
             <p className="text-xs text-slate-500 mt-3 leading-relaxed">
               A coroa aparenta ter perdido "2 N" de peso dentro d'água graças à sustentação do Empuxo gerado pelo volume de água deslocado.
             </p>
          </div>
        </>
      ),
      formulas: [
        { name: 'Empuxo', eq: 'E = γ<sub>fluido</sub> · V<sub>sub</sub>' },
        { name: 'Empuxo (Densidade)', eq: 'E = ρ<sub>fluido</sub> · g · V<sub>sub</sub>' },
        { name: 'Peso Aparente', eq: 'P<sub>ap</sub> = P<sub>real</sub> - E' },
      ]
    },
    {
      id: 'pascal' as SubjectId,
      title: 'Princípio de Pascal',
      icon: <Scale className="w-6 h-6 text-violet-600" />,
      theme: {
        bgIcon: 'bg-violet-50',
        bgHeader: 'bg-violet-50/50',
        borderCard: 'border-violet-100',
        hoverBorder: 'hover:border-violet-300',
        hoverShadow: 'hover:shadow-violet-200/20',
        textAction: 'text-violet-600',
        bgFormulas: 'bg-violet-50',
        textFormulas: 'text-violet-900',
        borderFormulas: 'border-violet-200/50'
      },
      summary: 'Pressões aplicadas em um fluido incompressível são transmitidas integralmente a todo o fluido.',
      details: (
        <>
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            "O acréscimo de pressão produzido em um líquido em equilíbrio transmite-se integralmente a todos os pontos do líquido e às paredes do recipiente."
          </p>
          <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-100 text-center font-serif text-lg mb-4 text-slate-800">
            F<sub>1</sub> / A<sub>1</sub> = F<sub>2</sub> / A<sub>2</sub>
          </div>
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            <strong>Conservação de Energia:</strong> Embora haja multiplicação de força (consegue-se erguer grandes pesos com pouca força), a energia mecânica se conserva. O trabalho realizado de um lado é igual ao do outro. Para erguer um peso grande por uma altura pequena, o operador deve empurrar o pistão menor por uma distância muito maior (A₁·d₁ = A₂·d₂).
          </p>
          
          <div className="mt-8 bg-violet-600/5 border border-violet-200/50 rounded-2xl p-5 relative">
             <div className="absolute -top-3 -left-3 bg-violet-100 p-2 rounded-full border border-violet-200 shadow-sm text-violet-700">
               <Lightbulb className="w-5 h-5" />
             </div>
             <h4 className="font-bold text-violet-800 text-sm mb-3 ml-6">Exemplo Ilustrativo Prático</h4>
             <p className="text-sm text-slate-700 mb-3 leading-relaxed">
               <strong>O Elevador Hidráulico de Oficina:</strong> Um carro de 1.000 kg (Peso de ~10.000 N) está apoiado no êmbolo maior de uma prensa hidráulica, cuja área é A₂ = 0,5 m². Você aplicará uma força no êmbolo menor, que tem área A₁ = 0,01 m². Qual força você precisa aplicar?
             </p>
             <div className="bg-white/60 p-4 rounded-xl text-sm text-slate-700 font-mono mb-2">
                F₁ / A₁ = F₂ / A₂<br/>
                F₁ / 0,01 = 10.000 / 0,5
             </div>
             <div className="bg-white/60 p-4 rounded-xl text-sm text-slate-700 font-mono">
                F₁ = (10.000 · 0,01) / 0,5<br/>
                F₁ = 100 / 0,5 = 200 N
             </div>
             <p className="text-xs text-slate-500 mt-3 leading-relaxed">
               <strong>Resultado:</strong> Com uma força de apenas 200 N (equivalente a segurar ~20 kg), você consegue equilibrar um carro inteiro de 1.000 kg, provando o enorme poder da vantagem mecânica hidráulica!
             </p>
          </div>
        </>
      ),
      formulas: [
        { name: 'Igualdade de Variação de Pressão', eq: 'ΔP<sub>1</sub> = ΔP<sub>2</sub>' },
        { name: 'Multiplicação de Força (Prensa)', eq: 'F<sub>1</sub> / A<sub>1</sub> = F<sub>2</sub> / A<sub>2</sub>' },
        { name: 'Conservação de Volume', eq: 'A<sub>1</sub> · d<sub>1</sub> = A<sub>2</sub> · d<sub>2</sub>' },
      ]
    },
    {
      id: 'estabilidade' as SubjectId,
      title: 'Flutuabilidade e Estabilidade',
      icon: <Anchor className="w-6 h-6 text-emerald-600" />,
      theme: {
        bgIcon: 'bg-emerald-50',
        bgHeader: 'bg-emerald-50/50',
        borderCard: 'border-emerald-100',
        hoverBorder: 'hover:border-emerald-300',
        hoverShadow: 'hover:shadow-emerald-200/20',
        textAction: 'text-emerald-600',
        bgFormulas: 'bg-emerald-50',
        textFormulas: 'text-emerald-900',
        borderFormulas: 'border-emerald-200/50'
      },
      summary: 'Critérios que definem se um corpo afunda, flutua e se ele tombará em um fluido.',
      details: (
        <>
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            Para corpos que flutuam na superfície, a estabilidade não depende apenas de flutuar ou não, mas sim da posição relativa do <strong>Centro de Gravidade (CG)</strong> e do <strong>Metacentro (M)</strong>. 
          </p>
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            <strong>Momento Restaurador:</strong> Quando um navio inclina devido a uma onda, o seu Centro de Carena (centro do volume submerso) muda de lugar, pois o formato submerso se altera. Isso desloca a linha de ação do Empuxo. Se o Metacentro (M) ficar acima do CG, o peso e o empuxo formam um binário de força (Momento) que "restaura" a posição reta do barco. Se (M) for mais baixo que o (CG), o barco capota!
          </p>
          
          <div className="mt-8 bg-emerald-600/5 border border-emerald-200/50 rounded-2xl p-5 relative">
             <div className="absolute -top-3 -left-3 bg-emerald-100 p-2 rounded-full border border-emerald-200 shadow-sm text-emerald-700">
               <Lightbulb className="w-5 h-5" />
             </div>
             <h4 className="font-bold text-emerald-800 text-sm mb-3 ml-6">Exemplo Ilustrativo Prático</h4>
             <p className="text-sm text-slate-700 mb-3 leading-relaxed">
               <strong>A Fração Submersa do Iceberg:</strong> Imagine um cubo de gelo flutuando no mar. O gelo tem densidade ρ<sub>gelo</sub> ≈ 900 kg/m³, enquanto a água do mar tem densidade ρ<sub>mar</sub> ≈ 1.025 kg/m³. Qual a porcentagem do iceberg que fica oculta debaixo d'água?
             </p>
             <p className="text-sm text-slate-700 mb-3 leading-relaxed">
               Como ele flutua em equilíbrio, as forças se igualam (Empuxo = Peso).
             </p>
             <div className="bg-white/60 p-4 rounded-xl text-sm text-slate-700 font-mono mb-2">
                E = P<br/>
                ρ<sub>mar</sub> · g · V<sub>sub</sub> = ρ<sub>gelo</sub> · g · V<sub>total</sub>
             </div>
             <div className="bg-white/60 p-4 rounded-xl text-sm text-slate-700 font-mono">
                Fração = V<sub>sub</sub> / V<sub>total</sub> = ρ<sub>gelo</sub> / ρ<sub>mar</sub><br/>
                Fração = 900 / 1025 ≈ 0,878 (ou 87,8%)
             </div>
             <p className="text-xs text-slate-500 mt-3 leading-relaxed">
               <strong>Resultado:</strong> Aproximadamente 88% do iceberg fica oculto no fundo do mar, sobrando apenas 12% na superfície (a famosa ponta do iceberg).
             </p>
          </div>
        </>
      ),
      formulas: [
        { name: 'Condição para Flutuar', eq: 'ρ<sub>corpo</sub> < ρ<sub>fluido</sub>' },
        { name: 'Fração Submersa', eq: 'V<sub>sub</sub> / V<sub>total</sub> = ρ<sub>corpo</sub> / ρ<sub>fluido</sub>' },
        { name: 'Altura Metacêntrica', eq: 'GM = BM - BG' },
      ]
    },
    {
      id: 'manometria' as SubjectId,
      title: 'Manometria e Tubo em U',
      icon: <Droplets className="w-6 h-6 text-amber-600" />,
      theme: {
        bgIcon: 'bg-amber-50',
        bgHeader: 'bg-amber-50/50',
        borderCard: 'border-amber-100',
        hoverBorder: 'hover:border-amber-300',
        hoverShadow: 'hover:shadow-amber-200/20',
        textAction: 'text-amber-600',
        bgFormulas: 'bg-amber-50',
        textFormulas: 'text-amber-900',
        borderFormulas: 'border-amber-200/50'
      },
      summary: 'Métodos para medir a pressão utilizando colunas de fluidos em manômetros.',
      details: (
        <>
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            A manometria aplica a Lei de Stevin em medições. Em um sistema interligado, assumimos que <strong>pontos na mesma cota horizontal de um mesmo fluido contínuo estão exatamente à mesma pressão.</strong> 
          </p>
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            É comum utilizar fluidos pesados, como o mercúrio, em Tubos em U para medir altas pressões sem precisar usar tubos de vidro de muitos metros de altura.
          </p>
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 mb-6 text-center text-lg text-amber-900 font-mono">
            P<sub>esquerda</sub> = P<sub>direita</sub> (na interface horizontal)
          </div>
          
          <div className="mt-8 bg-amber-600/5 border border-amber-200/50 rounded-2xl p-5 relative">
             <div className="absolute -top-3 -left-3 bg-amber-100 p-2 rounded-full border border-amber-200 shadow-sm text-amber-700">
               <Lightbulb className="w-5 h-5" />
             </div>
             <h4 className="font-bold text-amber-800 text-sm mb-3 ml-6">Exemplo Ilustrativo Prático</h4>
             <p className="text-sm text-slate-700 mb-3 leading-relaxed">
               <strong>Aferindo a pressão:</strong> Num tubo em U aberto para a atmosfera em ambas as pontas, você tem água num lado e óleo do outro. A interface de divisão é a referência (P<sub>esq</sub> = P<sub>dir</sub>).
               A coluna de água mede h<sub>A</sub> = 20 cm acima dessa linha. Qual a altura da coluna de óleo h<sub>O</sub> sabendo que ρ<sub>água</sub> = 1.000 kg/m³ e ρ<sub>óleo</sub> = 800 kg/m³?
             </p>
             <div className="bg-white/60 p-4 rounded-xl text-sm text-slate-700 font-mono mb-2">
                P<sub>atm</sub> + ρ<sub>água</sub> · g · h<sub>A</sub> = P<sub>atm</sub> + ρ<sub>óleo</sub> · g · h<sub>O</sub><br/>
             </div>
             <div className="bg-white/60 p-4 rounded-xl text-sm text-slate-700 font-mono">
                (Cortando P<sub>atm</sub> e g):<br/>
                1.000 · 0,20 = 800 · h<sub>O</sub><br/>
                200 = 800 · h<sub>O</sub><br/>
                h<sub>O</sub> = 200 / 800 = 0,25 m (ou 25 cm)
             </div>
             <p className="text-xs text-slate-500 mt-3 leading-relaxed">
               <strong>Resultado:</strong> São necessários 25 cm de óleo para equilibrar o peso de apenas 20 cm de água, confirmando que o fluido menos denso exige uma coluna mais alta.
             </p>
          </div>
        </>
      ),
      formulas: [
        { name: 'Equilíbrio na Interface Horizontal', eq: 'P<sub>esq</sub> = P<sub>dir</sub>' },
        { name: 'Acréscimo de Pressão (descendo)', eq: 'ΔP = + γ · h' },
        { name: 'Decréscimo de Pressão (subindo)', eq: 'ΔP = - γ · h' },
      ]
    }
  ];

  const activeSubject = subjects.find(s => s.id === selectedSubject);

  return (
    <div className="w-full">
      {!selectedSubject ? (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <div className="mb-8 text-center bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Fundamentos Teóricos</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Selecione um dos cartões abaixo para visualizar detalhadamente os resumos, conceitos chave e fórmulas de cada tópico da hidrostática e transporte.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub) => (
              <div 
                key={sub.id}
                onClick={() => setSelectedSubject(sub.id)}
                className={`bg-white/80 backdrop-blur-sm border ${sub.theme.borderCard} ${sub.theme.hoverBorder} p-6 rounded-3xl shadow-sm ${sub.theme.hoverShadow} transition-all cursor-pointer group flex flex-col h-full`}
              >
                <div className={`w-14 h-14 rounded-2xl ${sub.theme.bgIcon} flex items-center justify-center mb-5 group-hover:-translate-y-1 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  {sub.icon}
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-3 tracking-tight">{sub.title}</h3>
                <p className="text-sm text-slate-500 flex-grow leading-relaxed">{sub.summary}</p>
                
                <div className={`mt-6 flex items-center justify-between text-sm font-semibold ${sub.theme.textAction} opacity-80 group-hover:opacity-100 transition-opacity`}>
                  <span>Estudar assunto</span>
                  <BookOpen className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className={`${activeSubject?.theme.bgHeader} p-6 sm:p-8 border-b ${activeSubject?.theme.borderCard} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
            <div className="flex items-center gap-4">
               <div className={`p-3.5 bg-white rounded-2xl shadow-sm border border-white/50`}>
                 {activeSubject?.icon}
               </div>
               <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">{activeSubject?.title}</h2>
            </div>
            <button 
              onClick={() => setSelectedSubject(null)}
              className="px-5 py-2.5 bg-white text-slate-600 hover:text-slate-900 rounded-xl text-sm font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm transition-all flex items-center gap-2 w-fit"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
            {/* Details Section */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-slate-800 rounded-full"></div>
                  Resumo e Conceitos Principais
                </h3>
                <div className="prose prose-slate prose-sm sm:prose-base max-w-none">
                  {activeSubject?.details}
                </div>
              </div>
            </div>

            {/* Formulas Section */}
            <div>
              <div className={`${activeSubject?.theme.bgFormulas} p-6 sm:p-8 rounded-3xl border ${activeSubject?.theme.borderFormulas} sticky top-6`}>
                <h3 className={`text-xl font-bold ${activeSubject?.theme.textFormulas} mb-6 flex items-center gap-2 border-b ${activeSubject?.theme.borderFormulas} pb-4`}>
                  <BookOpen className="w-5 h-5" /> Fórmulas
                </h3>
                <div className="space-y-4">
                  {activeSubject?.formulas.map((form, idx) => (
                    <div key={idx} className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">{form.name}</div>
                      <div className="font-mono text-[15px] text-slate-800 text-center py-3 bg-slate-50/80 rounded-xl border border-slate-100/50">
                        <span dangerouslySetInnerHTML={{ __html: form.eq }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
