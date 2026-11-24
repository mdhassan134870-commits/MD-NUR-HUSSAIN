import React, { useRef } from 'react';
import { ProjectItem } from '../i18n/content';

interface SpotlightCardProps {
  item: ProjectItem;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({ item }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mx', `${x}px`);
    cardRef.current.style.setProperty('--my', `${y}px`);
    cardRef.current.style.setProperty('--spot-opacity', '1');
  };

  const handlePointerLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--spot-opacity', '0');
  };

  return (
    <article
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      data-cursor="card"
      data-cursor-label={item.cursorLabel}
      className={`spotlight-card group rounded-2xl p-7 flex flex-col justify-between overflow-hidden ${item.spanClass}`}
    >
      {/* Clean Unboxed Metadata + Exact Featured Project Content */}
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
          <span className="font-medium text-amber-400">{item.tag}</span>
          <span aria-hidden="true">·</span>
          <span>{item.meta}</span>
        </div>

        <h3 className="font-display text-xl font-semibold tracking-tight text-zinc-100 group-hover:text-amber-300 transition-colors">
          {item.title}
        </h3>

        <p className="text-sm leading-relaxed text-zinc-400 max-w-2xl">
          {item.description}
        </p>
      </div>
    </article>
  );
};
