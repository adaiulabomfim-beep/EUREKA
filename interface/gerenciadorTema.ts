import { useState, useEffect } from 'react';

export const STORAGE_TEMA_KEY = 'eureka_theme_mode';
export const EVENTO_TEMA_ALTERADO = 'eureka_evento_tema_alterado';

export type ModoTema = 'light' | 'dark';

export function obterTemaAtual(): ModoTema {
  if (typeof window === 'undefined') return 'light';
  try {
    const salvo = localStorage.getItem(STORAGE_TEMA_KEY);
    if (salvo === 'dark' || salvo === 'light') {
      return salvo;
    }
    const prefereEscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefereEscuro ? 'dark' : 'light';
  } catch (err) {
    return 'light';
  }
}

export function aplicarTema(tema: ModoTema): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (tema === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  try {
    localStorage.setItem(STORAGE_TEMA_KEY, tema);
  } catch (err) {
    console.error('Erro ao salvar tema:', err);
  }
  window.dispatchEvent(new CustomEvent(EVENTO_TEMA_ALTERADO, { detail: tema }));
}

export function alternarTema(): ModoTema {
  const atual = obterTemaAtual();
  const novo: ModoTema = atual === 'dark' ? 'light' : 'dark';
  aplicarTema(novo);
  return novo;
}

export function useTema() {
  const [tema, setTema] = useState<ModoTema>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : obterTemaAtual();
    }
    return 'light';
  });

  useEffect(() => {
    // Garante sincronia inicial
    const temaInicial = obterTemaAtual();
    aplicarTema(temaInicial);
    setTema(temaInicial);

    const handleAtualizacao = (e: CustomEvent<ModoTema>) => {
      setTema(e.detail);
    };

    window.addEventListener(EVENTO_TEMA_ALTERADO as any, handleAtualizacao);
    return () => {
      window.removeEventListener(EVENTO_TEMA_ALTERADO as any, handleAtualizacao);
    };
  }, []);

  return {
    tema,
    isDark: tema === 'dark',
    alternarTema,
    definirTema: aplicarTema,
  };
}
