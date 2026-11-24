import React, { useRef } from 'react';
import { SITE_CONTENT } from '../i18n/content';

export const AboutSection: React.FC = () => {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleMove = (idx: number, e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRefs.current[idx];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    el.style.setProperty('--spot-opacity', '1');
  };

  const handleLeave = (idx: number) => {
    const el = cardRefs.current[idx];
    if (!el) return;
    el.style.setProperty('--spot-opacity', '0');
  };

  return (
    <section
      id="about"
      className="border-t border-white/[0.08] bg-[#060D16] py-16 md:py-24 px-4 sm:px-6"
    >
      <div className="mx-auto max-w-[1360px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium tracking-wide text-amber-400">
              {SITE_CONTENT.about.kicker}
            </p>
            <h2
              className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight text-zinc-100"
              style={{ textWrap: 'balance' }}
            >
              {SITE_CONTENT.about.headingPrefix}
              <span className="text-amber-400">{SITE_CONTENT.about.headingAccent}</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">
              {SITE_CONTENT.about.subtitle}
            </p>
          </div>
          <div className="lg:col-span-7 lg:pt-6">
            <p className="text-base leading-relaxed text-zinc-200 max-w-2xl">
              {SITE_CONTENT.about.description}
            </p>
          </div>
        </div>

        {/* 4-column Focus / Next Step / Goal / Approach strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SITE_CONTENT.about.steps.map((step, idx) => (
            <div
              key={step.label}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              onPointerMove={(e) => handleMove(idx, e)}
              onPointerLeave={() => handleLeave(idx)}
              className="spotlight-card rounded-xl p-5 flex flex-col gap-1.5"
            >
              <span className="text-xs font-medium text-amber-400">{step.label}</span>
              <span className="font-display text-lg font-semibold text-zinc-100">
                {step.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
