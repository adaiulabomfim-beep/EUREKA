import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export const texNum = (valor: string | number | null | undefined): string =>
  String(valor ?? '').replace(/(\d),(\d)/g, '$1{,}$2');

interface MathTexProps {
  tex: string;
  display?: boolean;
  className?: string;
}

export const MathTex: React.FC<MathTexProps> = ({
  tex,
  display = false,
  className = '',
}) => {
  const html = React.useMemo(
    () =>
      katex.renderToString(String(tex || ''), {
        displayMode: display,
        output: 'html',
        throwOnError: false,
        strict: 'ignore',
      }),
    [tex, display]
  );

  return (
    <span
      className={`eureka-math ${
        display
          ? 'eureka-math-display flex max-w-full justify-center'
          : 'eureka-math-inline inline align-baseline'
      } ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

const GREEK_TO_TEX: Record<string, string> = {
  ρ: '\\rho',
  γ: '\\gamma',
  μ: '\\mu',
  θ: '\\theta',
  σ: '\\sigma',
  Δ: '\\Delta',
  Σ: '\\Sigma',
  π: '\\pi',
  α: '\\alpha',
  β: '\\beta',
  φ: '\\varphi',
  τ: '\\tau',
};

const mapBaseToTex = (base: string): string => {
  let out = '';
  for (const ch of base) {
    out += GREEK_TO_TEX[ch] ?? ch;
  }
  return out;
};

const formatSubscriptSegment = (seg: string): string => {
  // Single math letter/digit or xx/yy/zz remain italic math indices; multi-letter abbreviations render upright.
  if (/^(?:[A-Za-z0-9]|xx|yy|zz)'*$/.test(seg)) {
    return seg;
  }
  const primeMatch = seg.match(/^([A-Za-z0-9À-ÿ]+)('+)$/);
  if (primeMatch) {
    const [, core, primes] = primeMatch;
    if (/^(?:[A-Za-z0-9]|xx|yy|zz)$/.test(core)) {
      return `${core}${primes}`;
    }
    return `\\text{${core}}${primes}`;
  }
  return `\\text{${seg}}`;
};

const SUB_TOKEN_REGEX =
  /([A-Za-zρμγθσΔΣπαβφτ]+)_([A-Za-z0-9À-ÿ]+(?:'+)?(?:,[A-Za-z0-9À-ÿ]+(?:'+)?)*)/g;

export const RichMathText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  SUB_TOKEN_REGEX.lastIndex = 0;

  while ((match = SUB_TOKEN_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const baseTex = mapBaseToTex(match[1]);
    const subParts = match[2].split(',').map(formatSubscriptSegment);
    const subTex = subParts.join(',');
    const fullTex = `${baseTex}_{${subTex}}`;

    nodes.push(<MathTex key={`m-${match.index}`} tex={fullTex} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes}</>;
};
