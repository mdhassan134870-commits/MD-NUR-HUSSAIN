import { SITE_CONTENT } from './i18n/content';
import { KineticCursor } from './components/KineticCursor';
import { TopBar } from './components/TopBar';
import { HeroViewport } from './components/HeroViewport';
import { AboutSection } from './components/AboutSection';
import { CapabilitiesSection } from './components/CapabilitiesSection';
import { SpotlightCard } from './components/SpotlightCard';
import { ContactSection } from './components/ContactSection';

export default function App() {
  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#060D16] text-zinc-100">
      <KineticCursor />
      <TopBar onNavigate={handleNavigate} />

      <main>
        <HeroViewport onNavigate={handleNavigate} />

        <AboutSection />

        <CapabilitiesSection />

        {/* Featured Projects Interactive Bento Showcase */}
        <section
          id="projects"
          className="border-t border-white/[0.08] bg-[#060D16] py-16 md:py-24 px-4 sm:px-6"
        >
          <div className="mx-auto max-w-[1360px]">
            <div className="mb-10 md:mb-14 max-w-2xl">
              <p className="text-xs font-medium tracking-wide text-amber-400">
                {SITE_CONTENT.projects.kicker}
              </p>
              <h2
                className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight text-zinc-100"
                style={{ textWrap: 'balance' }}
              >
                {SITE_CONTENT.projects.headingPrefix}
                <span className="text-amber-400">
                  {SITE_CONTENT.projects.headingAccent}
                </span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-400">
                {SITE_CONTENT.projects.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
              {SITE_CONTENT.projects.items.map((item) => (
                <SpotlightCard key={item.id} item={item} />
              ))}
            </div>

            <p className="mt-6 text-xs text-zinc-500">
              {SITE_CONTENT.projects.note}
            </p>
          </div>
        </section>

        <ContactSection />
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-white/[0.08] bg-[#060D16] py-10 px-6">
        <div className="mx-auto flex max-w-[1360px] items-center justify-center text-xs text-zinc-500">
          <span>{SITE_CONTENT.footer}</span>
        </div>
      </footer>
    </div>
  );
}
