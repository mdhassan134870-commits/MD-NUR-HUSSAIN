import React, { useEffect, useRef, useState } from 'react';

interface CursorState {
  visible: boolean;
  hovering: boolean;
  pressed: boolean;
  label: string;
  variant: 'default' | 'pointer' | 'drag' | 'card';
}

interface OrbitBubbleSpec {
  color: string;
  size: number;
  baseAngle: number;
  radiusOffset: number;
  speedMul: number;
}

const ORBIT_BUBBLES: OrbitBubbleSpec[] = [
  { color: '#38BDF8', size: 5, baseAngle: 0, radiusOffset: 22, speedMul: 1.0 },
  { color: '#F59E0B', size: 4.5, baseAngle: (Math.PI * 2) / 6, radiusOffset: 24, speedMul: 1.15 },
  { color: '#A78BFA', size: 5, baseAngle: (Math.PI * 4) / 6, radiusOffset: 21, speedMul: 0.9 },
  { color: '#34D399', size: 4, baseAngle: (Math.PI * 6) / 6, radiusOffset: 25, speedMul: 1.25 },
  { color: '#FB7185', size: 4.5, baseAngle: (Math.PI * 8) / 6, radiusOffset: 22, speedMul: 1.05 },
  { color: '#FDE047', size: 3.5, baseAngle: (Math.PI * 10) / 6, radiusOffset: 24, speedMul: 1.2 },
];

interface TouchBurst {
  id: number;
  x: number;
  y: number;
}

export const KineticCursor: React.FC = () => {
  const outerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const arcGroupRef = useRef<SVGGElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [desktopEnabled, setDesktopEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [touchBursts, setTouchBursts] = useState<TouchBurst[]>([]);
  const [cursorState, setCursorState] = useState<CursorState>({
    visible: false,
    hovering: false,
    pressed: false,
    label: '',
    variant: 'default',
  });

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateMode = () => {
      setReducedMotion(rmQuery.matches);
      const active = finePointer.matches && !rmQuery.matches;
      setDesktopEnabled(active);
      document.body.classList.toggle('kinetic-cursor-active', active);
    };

    updateMode();
    finePointer.addEventListener('change', updateMode);
    rmQuery.addEventListener('change', updateMode);

    return () => {
      document.body.classList.remove('kinetic-cursor-active');
      finePointer.removeEventListener('change', updateMode);
      rmQuery.removeEventListener('change', updateMode);
    };
  }, []);

  // Touch ripple + colorful bubble burst on mobile phones
  useEffect(() => {
    if (desktopEnabled || reducedMotion) return;

    let burstSeq = 0;
    const onTouchPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      const id = ++burstSeq;
      setTouchBursts((prev) => [...prev.slice(-3), { id, x: e.clientX, y: e.clientY }]);
      window.setTimeout(() => {
        setTouchBursts((prev) => prev.filter((b) => b.id !== id));
      }, 650);
    };

    window.addEventListener('pointerdown', onTouchPointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', onTouchPointerDown);
  }, [desktopEnabled, reducedMotion]);

  // Continuous desktop mouse kinetic cursor + orbiting colored bubbles
  useEffect(() => {
    if (!desktopEnabled) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let dotX = targetX;
    let dotY = targetY;
    let prevX = targetX;
    let prevY = targetY;
    let arcAngle = 0;
    let targetAngle = 0;
    let scaleVal = 1;
    let targetScale = 1;
    let orbitClock = 0;
    let rafId = 0;
    let isVisible = false;

    const bubblePos = ORBIT_BUBBLES.map(() => ({ x: targetX, y: targetY }));

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        ringX = targetX;
        ringY = targetY;
        dotX = targetX;
        dotY = targetY;
        bubblePos.forEach((b) => {
          b.x = targetX;
          b.y = targetY;
        });
        setCursorState((prev) => ({ ...prev, visible: true }));
      }

      const targetEl = e.target as HTMLElement | null;
      const interactiveEl = targetEl?.closest<HTMLElement>(
        '[data-cursor], button, a, input, textarea, select, [role="button"]'
      );

      if (interactiveEl) {
        const customType = interactiveEl.getAttribute('data-cursor');
        const customLabel = interactiveEl.getAttribute('data-cursor-label') || '';

        if (customType === 'drag') {
          targetScale = 1.35;
          setCursorState((prev) =>
            prev.variant === 'drag' && prev.label === customLabel && prev.hovering
              ? prev
              : { ...prev, hovering: true, variant: 'drag', label: customLabel }
          );
        } else if (customType === 'card') {
          targetScale = 1.28;
          setCursorState((prev) =>
            prev.variant === 'card' && prev.label === customLabel && prev.hovering
              ? prev
              : { ...prev, hovering: true, variant: 'card', label: customLabel }
          );
        } else {
          targetScale = 1.22;
          setCursorState((prev) =>
            prev.variant === 'pointer' && prev.label === customLabel && prev.hovering
              ? prev
              : { ...prev, hovering: true, variant: 'pointer', label: customLabel }
          );
        }
      } else {
        targetScale = 1;
        setCursorState((prev) =>
          !prev.hovering && prev.variant === 'default' && prev.label === ''
            ? prev
            : { ...prev, hovering: false, variant: 'default', label: '' }
        );
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      setCursorState((prev) => ({ ...prev, pressed: true }));
      if (rippleRef.current) {
        rippleRef.current.style.left = `${e.clientX}px`;
        rippleRef.current.style.top = `${e.clientY}px`;
        rippleRef.current.classList.remove('animate-ping-once');
        void rippleRef.current.offsetWidth;
        rippleRef.current.classList.add('animate-ping-once');
      }
    };

    const onPointerUp = () => {
      setCursorState((prev) => ({ ...prev, pressed: false }));
    };

    const onMouseLeave = () => {
      isVisible = false;
      setCursorState((prev) => ({ ...prev, visible: false }));
    };

    const tick = () => {
      const dx = targetX - prevX;
      const dy = targetY - prevY;
      const speed = Math.hypot(dx, dy);

      orbitClock += 0.028 + Math.min(speed * 0.002, 0.04);

      if (speed > 0.6) {
        targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
      } else {
        targetAngle += 0.5;
      }

      const angleDiff = ((targetAngle - arcAngle + 540) % 360) - 180;
      arcAngle += angleDiff * 0.16;

      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      dotX += (targetX - dotX) * 0.5;
      dotY += (targetY - dotY) * 0.5;
      scaleVal += (targetScale - scaleVal) * 0.18;

      const stretch = Math.min(speed * 0.006, 0.16);

      if (outerRef.current) {
        outerRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scaleVal + stretch}, ${scaleVal - stretch * 0.3})`;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
      }

      if (arcGroupRef.current) {
        arcGroupRef.current.style.transform = `rotate(${arcAngle}deg)`;
        arcGroupRef.current.style.transformOrigin = '18px 18px';
      }

      for (let i = 0; i < ORBIT_BUBBLES.length; i++) {
        const spec = ORBIT_BUBBLES[i];
        const a = spec.baseAngle + orbitClock * spec.speedMul;
        const r = spec.radiusOffset * scaleVal + Math.sin(orbitClock * 1.8 + i) * 2.5;
        const desiredX = ringX + Math.cos(a) * r;
        const desiredY = ringY + Math.sin(a) * r;

        const followRate = 0.24 - i * 0.015;
        bubblePos[i].x += (desiredX - bubblePos[i].x) * followRate;
        bubblePos[i].y += (desiredY - bubblePos[i].y) * followRate;

        const el = bubbleRefs.current[i];
        if (el) {
          el.style.transform = `translate3d(${bubblePos[i].x}px, ${bubblePos[i].y}px, 0) translate(-50%, -50%)`;
        }
      }

      prevX = targetX;
      prevY = targetY;
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [desktopEnabled]);

  const isExpanded = cursorState.hovering;
  const isPressed = cursorState.pressed;

  return (
    <>
      {/* Touch-screen multi-colored ring + bubble tap feedback for phones */}
      {!desktopEnabled &&
        touchBursts.map((burst) => (
          <div
            key={burst.id}
            aria-hidden="true"
            className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
            style={{ left: burst.x, top: burst.y }}
          >
            <div className="h-9 w-9 rounded-full border border-amber-400/70 animate-ping-once" />
            {ORBIT_BUBBLES.map((b, i) => (
              <span
                key={b.color + i}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: b.size,
                  height: b.size,
                  backgroundColor: b.color,
                  boxShadow: `0 0 8px ${b.color}`,
                  transform: `translate(-50%, -50%) translate(${Math.cos(b.baseAngle) * 20}px, ${Math.sin(b.baseAngle) * 20}px)`,
                }}
              />
            ))}
          </div>
        ))}

      {/* Desktop continuous orbiting bubbles + compact rotating ring */}
      {desktopEnabled && (
        <>
          {ORBIT_BUBBLES.map((bubble, idx) => (
            <div
              key={bubble.color + idx}
              ref={(el) => {
                bubbleRefs.current[idx] = el;
              }}
              aria-hidden="true"
              className={`fixed top-0 left-0 pointer-events-none z-[9998] rounded-full transition-opacity duration-200 will-change-transform ${
                cursorState.visible ? 'opacity-90' : 'opacity-0'
              }`}
              style={{
                width: bubble.size,
                height: bubble.size,
                backgroundColor: bubble.color,
                boxShadow: `0 0 8px ${bubble.color}`,
              }}
            />
          ))}

          <div
            ref={outerRef}
            aria-hidden="true"
            className={`fixed top-0 left-0 pointer-events-none z-[9999] transition-opacity duration-200 will-change-transform ${
              cursorState.visible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ width: 36, height: 36 }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className={`w-full h-full transition-transform duration-150 ${
                isPressed ? 'scale-85' : 'scale-100'
              }`}
            >
              <circle
                cx="18"
                cy="18"
                r={isExpanded ? 13 : 10}
                stroke={isExpanded ? 'rgba(245, 158, 11, 0.55)' : 'rgba(244, 244, 245, 0.3)'}
                strokeWidth="1"
                className="transition-all duration-200"
              />

              <g ref={arcGroupRef}>
                <path
                  d="M 27.9 8.1 A 14 14 0 0 1 27.9 27.9"
                  stroke="#F59E0B"
                  strokeWidth={isExpanded ? '2' : '1.5'}
                  strokeLinecap="round"
                />
                <path
                  d="M 8.1 27.9 A 14 14 0 0 1 8.1 8.1"
                  stroke="#38BDF8"
                  strokeWidth={isExpanded ? '1.7' : '1.25'}
                  strokeLinecap="round"
                />
              </g>
            </svg>
          </div>

          <div
            ref={dotRef}
            aria-hidden="true"
            className={`fixed top-0 left-0 pointer-events-none z-[9999] rounded-full transition-opacity duration-150 will-change-transform ${
              cursorState.visible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              width: isExpanded ? 3.5 : 4.5,
              height: isExpanded ? 3.5 : 4.5,
              backgroundColor: isExpanded ? '#F59E0B' : '#F4F4F5',
            }}
          />

          <div
            ref={rippleRef}
            aria-hidden="true"
            className="fixed pointer-events-none z-[9997] -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-amber-400/60 opacity-0 scale-50 transition-none"
          />
        </>
      )}
    </>
  );
};

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export const MagneticWrap: React.FC<MagneticProps> = ({
  children,
  className = '',
  strength = 0.28,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * strength;
    ref.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  };

  const handleLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = 'translate3d(0px, 0px, 0)';
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`inline-block transition-transform duration-200 ease-out ${className}`}
    >
      {children}
    </div>
  );
};
