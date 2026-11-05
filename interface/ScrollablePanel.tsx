import React, { useRef, useState, useEffect, useCallback } from 'react';

interface ScrollablePanelProps {
  id?: string;
  dataTour?: string;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

export const ScrollablePanel: React.FC<ScrollablePanelProps> = ({
  id,
  dataTour,
  className = '',
  contentClassName = '',
  children,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbHeight, setThumbHeight] = useState<number>(35);
  const [thumbTop, setThumbTop] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ y: number; scrollTop: number }>({ y: 0, scrollTop: 0 });

  const updateScrollbar = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight) {
      setThumbHeight(85);
      setThumbTop(0);
      return;
    }
    const ratio = Math.min(0.88, Math.max(0.15, clientHeight / scrollHeight));
    const heightPct = ratio * 100;
    const maxScroll = scrollHeight - clientHeight;
    const scrollFraction = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;
    const topPct = scrollFraction * (100 - heightPct);

    setThumbHeight(heightPct);
    setThumbTop(topPct);
  }, []);

  useEffect(() => {
    updateScrollbar();
    const el = scrollRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => updateScrollbar());
    ro.observe(el);
    Array.from(el.children).forEach((child) => ro.observe(child));

    const mo = new MutationObserver(() => {
      updateScrollbar();
      Array.from(el.children).forEach((child) => ro.observe(child));
    });
    mo.observe(el, { childList: true, subtree: true, attributes: true });

    window.addEventListener('resize', updateScrollbar);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', updateScrollbar);
    };
  }, [updateScrollbar]);

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    dragStartRef.current = { y: e.clientY, scrollTop: el.scrollTop };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const el = scrollRef.current;
      const track = trackRef.current;
      if (!el || !track) return;

      const trackRect = track.getBoundingClientRect();
      const thumbPx = (thumbHeight / 100) * trackRect.height;
      const availableTrackPx = Math.max(1, trackRect.height - thumbPx);
      const maxScroll = Math.max(1, el.scrollHeight - el.clientHeight);
      const deltaY = e.clientY - dragStartRef.current.y;

      el.scrollTop = dragStartRef.current.scrollTop + (deltaY / availableTrackPx) * maxScroll;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, thumbHeight]);

  const handleTrackClick = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track || e.target !== track) return;

    const rect = track.getBoundingClientRect();
    const clickRatio = (e.clientY - rect.top) / rect.height;
    const maxScroll = el.scrollHeight - el.clientHeight;
    el.scrollTo({
      top: clickRatio * maxScroll,
      behavior: 'smooth',
    });
  };

  return (
    <div id={id} data-tour={dataTour} className={`relative min-h-0 ${className}`}>
      <div
        ref={scrollRef}
        onScroll={updateScrollbar}
        className={`h-full w-full overflow-y-auto no-native-scrollbar ${contentClassName}`}
      >
        {children}
      </div>

      {/* Barra de rolagem estilo pílula arredondada */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="absolute right-0.5 top-2 bottom-2 w-[6px] z-20 select-none"
      >
        <div
          onMouseDown={handleThumbMouseDown}
          style={{
            height: `${thumbHeight}%`,
            top: `${thumbTop}%`,
          }}
          className={`absolute left-0 w-[6px] rounded-full cursor-pointer transition-colors ${
            isDragging
              ? 'bg-[#94a3b8] dark:bg-slate-400'
              : 'bg-[#c6cbd2] hover:bg-[#94a3b8] dark:bg-slate-600 dark:hover:bg-slate-500'
          }`}
        />
      </div>
    </div>
  );
};
