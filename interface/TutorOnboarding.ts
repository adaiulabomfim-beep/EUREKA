import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_STORAGE_KEY = 'eureka_lab_tour_completed_v1';

function formatHtmlText(text: string): string {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-extrabold italic">$1</strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>');
}

export const TOUR_STEPS: DriveStep[] = [
  {
    element: '#tour-nav-modos',
    popover: {
      title: '🧭 1. Seleção de Laboratórios',
      description: 'Navegue entre os diferentes módulos didáticos: <strong>Corpos Imersos</strong> (Princípio de Arquimedes), <strong>Barragens</strong> e <strong>Comportas Hidráulicas</strong>, além dos <strong>Fundamentos Teóricos</strong>.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-controles',
    popover: {
      title: '⚙️ 2. Painel de Controles e Presets',
      description: 'Ajuste os parâmetros físicos e geométricos: dimensões da comporta ou corpo, tipo de fluido (água, óleo, mercúrio), níveis de montante/jusante e carregue exercícios clássicos prontos nos <strong>Presets</strong>.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#areaSimulacao',
    popover: {
      title: '🔬 3. Visualização Interativa 2D & 3D',
      description: 'Acompanhe o ensaio físico em tempo real! Alterne livremente entre a <strong>Vista 2D</strong> (diagramas técnicos e cotas rebatidas) e a <strong>Vista 3D</strong> (espaço tridimensional, prisma de pressões e vetores). Use o mouse ou toque para rotacionar e aproximar.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-btn-acao, #areaSimulacao button:has(svg), #areaSimulacao',
    popover: {
      title: '⚡ 4. Executar Análise / Simulação',
      description: 'Clique no botão <strong>Analisar</strong> (ou <strong>Iniciar Simulação</strong>) para processar os cálculos hidrostáticos, traçar o prisma de pressão e calcular a força resultante de empuxo.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-resultados',
    popover: {
      title: '📊 5. Resultados e Memorial de Cálculo',
      description: 'Consulte os resultados analíticos: módulo da força de empuxo (E), Centróide (CG) e Centro de Pressão (CP). Clique em <strong>Memorial de Cálculo</strong> para visualizar o passo a passo algébrico detalhado.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '#tour-btn-exportar',
    popover: {
      title: '📑 6. Exportação de Relatórios',
      description: 'Gere instantaneamente um <strong>Relatório Técnico em PDF</strong> com os dados do seu ensaio, fórmulas utilizadas e resultados validados para entrega de relatórios acadêmicos.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#tour-btn-historico',
    popover: {
      title: '🕒 7. Histórico & Comparador de Cenários',
      description: 'Salve os parâmetros e resultados das suas últimas <strong>5 simulações</strong> no painel retrátil para comparar rapidamente diferentes fluidos, cotas e geometrias lado a lado.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#tour-btn-tutor',
    popover: {
      title: '🤖 8. Tutor Inteligente com IA',
      description: 'Dúvidas conceituais ou sobre os resultados do experimento? Abra o <strong>Tutor IA</strong> a qualquer momento para explicações didáticas alimentadas pelo <strong>Gemini 3.1 Pro</strong>.',
      side: 'left',
      align: 'end',
    },
  },
];

export function iniciarTourGuiado(forcar: boolean = false) {
  if (!forcar) {
    const jaVisto = localStorage.getItem(TOUR_STORAGE_KEY);
    if (jaVisto === 'true') {
      return;
    }
  }

  // Filtrar passos cujos elementos estejam presentes no DOM no momento
  const passosValidos = TOUR_STEPS.filter((step) => {
    if (!step.element) return true;
    if (typeof step.element === 'string') {
      return document.querySelector(step.element) !== null;
    }
    return true;
  }).map((step) => {
    if (step.popover?.description) {
      return {
        ...step,
        popover: {
          ...step.popover,
          description: formatHtmlText(step.popover.description),
          title: step.popover.title ? formatHtmlText(step.popover.title) : step.popover.title,
        },
      };
    }
    return step;
  });

  const driverObj = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayColor: 'rgba(15, 23, 42, 0.75)',
    stagePadding: 8,
    stageRadius: 16,
    nextBtnText: 'Próximo →',
    prevBtnText: '← Anterior',
    doneBtnText: 'Começar a Explorar! 🚀',
    progressText: '{{current}} de {{total}}',
    onDestroyStarted: () => {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      driverObj.destroy();
    },
    steps: passosValidos.length > 0 ? passosValidos : TOUR_STEPS,
  });

  driverObj.drive();
}
