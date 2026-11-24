import React, { useEffect, useRef, useState } from 'react';
import { SITE_CONTENT } from '../i18n/content';
import portraitImg from '../assets/alamin-portrait.jpg';
import {
  KineticSceneController,
  mountKineticSculptureScene,
} from '../three/KineticSculptureScene';
import { MagneticWrap } from './KineticCursor';

interface HeroViewportProps {
  onNavigate: (sectionId: string) => void;
}

export const HeroViewport: React.FC<HeroViewportProps> = ({ onNavigate }) => {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<KineticSceneController | null>(null);

  const [contextLost, setContextLost] = useState<boolean>(false);
  const [imgFailed, setImgFailed] = useState<boolean>(false);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const controller = mountKineticSculptureScene(
      container,
      { sculpture: 'star', finish: 'gold', motion: 'orbital', explode: 0.15 },
      setContextLost
    );
    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!controllerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    controllerRef.current.setPointerNormalized(nx, ny, true);
  };

  const handlePointerLeave = () => {
    controllerRef.current?.setPointerNormalized(0, 0, false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (!controllerRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    controllerRef.current.setPointerNormalized(nx, ny, true);
  };

  return (
    <section
      id="home"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handlePointerLeave}
      className="relative min-h-[640px] lg:h-screen lg:max-h-[980px] w-full overflow-hidden bg-[#060D16] pt-20 pb-12 md:pb-16"
    >
      {/* Isolated Full-Viewport 3D WebGL Sculpture */}
      <div
        ref={canvasMountRef}
        data-cursor="drag"
        data-cursor-label={SITE_CONTENT.hero.cursorDragLabel}
        className="absolute inset-0 z-0"
      />

      {contextLost && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#060D16]/95 text-center p-6">
          <div className="max-w-md border border-white/10 bg-[#0B1624] p-6 rounded-xl">
            <p className="text-sm text-zinc-300">
              3D WebGL viewport paused due to hardware context reset. Reload to resume.
            </p>
          </div>
        </div>
      )}

      {/* Left contrast scrim */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-full md:w-1/2 bg-gradient-to-r from-[#060D16]/90 via-[#060D16]/55 to-transparent"
      />

      {/* Semantic DOM Hero Content */}
      <div className="pointer-events-none relative z-20 mx-auto flex h-full max-w-[1360px] flex-col lg:flex-row items-center justify-between gap-8 md:gap-10 px-4 sm:px-6 py-6 md:py-8">
        {/* Left: Exact Headline, Copy & CTAs */}
        <div className="w-full max-w-xl pointer-events-auto">
          <p className="mb-3 md:mb-4 text-xs font-medium tracking-wide text-amber-400">
            {SITE_CONTENT.hero.kicker}
          </p>

          <h1
            className="font-display font-bold tracking-tight text-zinc-50 leading-[1.06]"
            style={{
              fontSize: 'clamp(2.15rem, 6vw, 3.85rem)',
              textWrap: 'balance',
            }}
          >
            {SITE_CONTENT.hero.headlineLine1}
            <br />
            <span className="text-amber-400">{SITE_CONTENT.hero.headlineAccent}</span>
          </h1>

          <p className="mt-4 md:mt-5 text-sm sm:text-base md:text-lg leading-relaxed text-zinc-300 max-w-lg">
            {SITE_CONTENT.hero.subheadline}
          </p>

          <div className="mt-6 md:mt-7 flex flex-wrap items-center gap-3 sm:gap-4">
            <MagneticWrap strength={0.28}>
              <button
                type="button"
                onClick={() => onNavigate('projects')}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0"
              >
                {SITE_CONTENT.hero.primaryCta}
              </button>
            </MagneticWrap>

            <MagneticWrap strength={0.22}>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="min-h-[44px] rounded-lg border border-white/20 bg-[#0B1624] px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-amber-400/60 hover:text-amber-300 whitespace-nowrap shrink-0"
              >
                {SITE_CONTENT.hero.secondaryCta}
              </button>
            </MagneticWrap>
          </div>
        </div>

        {/* Right: Al Amin's Portrait + Exact Caption */}
        <div className="pointer-events-auto flex flex-col items-center text-center lg:items-end lg:text-right shrink-0">
          <div className="relative p-1.5 rounded-full border border-amber-400/50 bg-[#060D16]/75 shadow-2xl">
            {imgFailed ? (
              <div className="flex h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56 items-center justify-center rounded-full bg-[#0B1624] text-2xl font-display font-bold text-amber-400">
                Al Amin.
              </div>
            ) : (
              <img
                src={portraitImg}
                alt={SITE_CONTENT.hero.portraitAlt}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56 rounded-full object-cover object-[center_28%]"
              />
            )}
          </div>
          <p className="mt-4 max-w-xs text-xs md:text-sm font-medium text-zinc-300 bg-[#060D16]/80 px-3 py-1.5 rounded-lg border border-white/10">
            {SITE_CONTENT.hero.portraitCaption}
          </p>
        </div>
      </div>
    </section>
  );
};
