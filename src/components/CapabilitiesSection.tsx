import React, { useRef } from 'react';
import { SITE_CONTENT } from '../i18n/content';

export const CapabilitiesSection: React.FC = () => {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleMove = (idx: number, e: React.PointerEvent<HTMLDivElement>) => {
    const el = rowRefs.current[idx];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    el.style.setProperty('--spot-opacity', '1');
  };

  const handleLeave = (idx: number) => {
    const el = rowRefs.current[idx];
    if (!el) return;
    el.style.setProperty('--spot-opacity', '0');
  };

  return (
    <section
      id="skills"
      className="border-t border-white/[0.08] bg-[#060D16] py-16 md:py-24 px-4 sm:px-6"
    >
      <div className="mx-auto max-w-[1360px]">
        <div className="mb-14 max-w-2xl">
          <p className="text-xs font-medium tracking-wide text-amber-400">
            {SITE_CONTENT.skills.kicker}
          </p>
          <h2
            className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight text-zinc-100"
            style={{ textWrap: 'balance' }}
          >
            {SITE_CONTENT.skills.headingPrefix}
            <span className="text-amber-400">{SITE_CONTENT.skills.headingAccent}</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            {SITE_CONTENT.skills.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SITE_CONTENT.skills.items.map((item, idx) => (
            <div
              key={item.title}
              ref={(el) => {
                rowRefs.current[idx] = el;
              }}
              onPointerMove={(e) => handleMove(idx, e)}
              onPointerLeave={() => handleLeave(idx)}
              className="spotlight-card rounded-2xl p-7 flex flex-col justify-between gap-4"
            >
              <div>
                <span className="font-mono-tabular text-xs font-medium text-amber-400 block mb-3">
                  0{idx + 1}.
                </span>
                <h3 className="font-display text-xl font-semibold tracking-tight text-zinc-100">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
