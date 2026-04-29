import React from 'react';
import { motion } from 'motion/react';

interface LogoEurekaProps {
  className?: string;
  theme?: 'colored' | 'white' | 'solid-blue';
  size?: 'lg' | 'md' | 'sm';
  animated?: boolean;
}

export const LogoEureka: React.FC<LogoEurekaProps> = ({
  className = '',
  theme = 'colored',
  size = 'lg',
  animated = true,
}) => {
  const sizeClasses = {
    lg: 'h-[56px]',
    md: 'h-[24px]',
    sm: 'h-[18px]',
  }[size] || 'h-[56px]';

  const isColored = theme === 'colored';
  const isWhite = theme === 'white';
  const isSolidBlue = theme === 'solid-blue';

  const uniqId = React.useId ? React.useId().replace(/:/g, '') : 'id_' + Math.random().toString(36).substring(2, 9);
  const textGradId = `textGrad-${uniqId}`;
  const dropGradId = `dropGrad-${uniqId}`;
  const textShadowId = `textShadow-${uniqId}`;
  const dropShadowId = `dropShadow-${uniqId}`;
  const whiteDropShadowId = `whiteDropShadow-${uniqId}`;

  let textColor = '#ffffff';
  let barColor = '#ffffff';
  let dropColor = '#ffffff';

  if (isColored) {
    textColor = `url(#${textGradId})`;
    barColor = '#3b82f6';
    dropColor = `url(#${dropGradId})`;
  } else if (isSolidBlue) {
    textColor = '#3478f6';
    barColor = '#3478f6';
    dropColor = '#3478f6';
  }

  const DropElement = animated ? motion.g : 'g';
  const dropAnimationProps = animated
    ? {
        animate: { y: [0, 4, 0] },
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
      }
    : {};

  return (
    <svg
      viewBox="0 0 245 58"
      className={`${sizeClasses} ${className} block`}
      style={{ overflow: 'visible' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={textGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
        <linearGradient id={dropGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>

        <filter id={textShadowId} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#38bdf8" floodOpacity="0.16" />
        </filter>

        <filter id={dropShadowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.55" />
        </filter>

        <filter id={whiteDropShadowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#ffffff" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Texto EUREKA */}
      <text
        x="0"
        y="48"
        fontFamily="Inter, sans-serif"
        fontWeight="900"
        fontSize="54px"
        letterSpacing="-0.03em"
        fill={textColor}
        filter={isColored ? `url(#${textShadowId})` : undefined}
      >
        EUREKA
      </text>

      {/* Barra da Exclamação */}
      <rect
        x="222"
        y="8"
        width="10"
        height="31"
        rx="2"
        fill={barColor}
      />

      {/* Pingo da Exclamação */}
      <DropElement {...dropAnimationProps}>
        <path
          d="M 7 0 L 14 0 L 14 7 A 7 7 0 1 1 7 0 Z"
          transform="translate(220, 43) rotate(45, 7, 7)"
          fill={dropColor}
          filter={
            isColored ? `url(#${dropShadowId})` : isWhite ? `url(#${whiteDropShadowId})` : undefined
          }
        />
      </DropElement>
    </svg>
  );
};
