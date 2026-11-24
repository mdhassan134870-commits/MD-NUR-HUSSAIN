import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { SITE_CONTENT } from '../i18n/content';
import { MagneticWrap } from './KineticCursor';

interface TopBarProps {
  onNavigate: (sectionId: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLinkClick = (sectionId: string) => {
    setMobileOpen(false);
    onNavigate(sectionId);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.08] bg-[#060D16]/95">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 py-3 md:py-4">
        {/* Zone 1: Single brand wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('home');
          }}
          className="font-display text-xl font-bold tracking-tight text-zinc-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          {SITE_CONTENT.brandPrefix}
          <span className="text-amber-400">{SITE_CONTENT.brandAccent}</span>
        </a>

        {/* Zone 2: Desktop single-line navigation links */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400"
        >
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('home');
            }}
            className="nav-link-underline hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            {SITE_CONTENT.nav.home}
          </a>
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('about');
            }}
            className="nav-link-underline hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            {SITE_CONTENT.nav.about}
          </a>
          <a
            href="#skills"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('skills');
            }}
            className="nav-link-underline hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            {SITE_CONTENT.nav.services}
          </a>
          <a
            href="#projects"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('projects');
            }}
            className="nav-link-underline hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            {SITE_CONTENT.nav.projects}
          </a>
        </nav>

        {/* Zone 3: Primary action + Mobile menu toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <MagneticWrap strength={0.25}>
            <button
              type="button"
              onClick={() => handleLinkClick('contact')}
              className="rounded-lg bg-amber-500 px-3.5 sm:px-4 py-2 min-h-[40px] text-xs font-semibold text-zinc-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-300"
            >
              {SITE_CONTENT.nav.contact}
            </button>
          </MagneticWrap>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-site-nav"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-[#0B1624] text-zinc-200 transition-colors hover:border-amber-400/50 hover:text-amber-300"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation (44px+ touch targets) */}
      {mobileOpen && (
        <nav
          id="mobile-site-nav"
          aria-label="Mobile navigation"
          className="md:hidden border-t border-white/[0.08] bg-[#0B1624] px-4 py-3 flex flex-col gap-1"
        >
          {[
            { id: 'home', label: SITE_CONTENT.nav.home },
            { id: 'about', label: SITE_CONTENT.nav.about },
            { id: 'skills', label: SITE_CONTENT.nav.services },
            { id: 'projects', label: SITE_CONTENT.nav.projects },
            { id: 'contact', label: SITE_CONTENT.nav.contact },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(item.id);
              }}
              className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.06] hover:text-amber-400"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
};
