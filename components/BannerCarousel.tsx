'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ───────────────────────────────────────────────────────────────────────────
// EDIT YOUR SLIDES HERE — this is the single place to change images, captions,
// and buttons. Per slide:
//   img      — path under /public (optimized JPEGs live in scheme_image/opt/)
//   alt      — REQUIRED for accessibility; describe the banner
//   caption  — optional overlay heading (leave out for no text)
//   ctaText  — button label. Omit → "Check what you qualify for →".
//              Set to null → NO button (use when the image already has one baked in).
//   href     — optional full path (defaults to the eligibility checker)
// ───────────────────────────────────────────────────────────────────────────
type Slide = {
  img: string;
  alt: string;
  caption?: string;
  ctaText?: string | null;
  href?: string; // e.g. "/en/schemes/pm-kisan/" — omit to link to the checker
};

const SLIDES: Slide[] = [
  // image1 already has its own "Explore Schemes" button → hide the overlay one.
  { img: '/images/scheme_image/opt/image1.jpg', alt: 'Featured government scheme', ctaText: null },
  { img: '/images/scheme_image/opt/image2.jpg', alt: 'Featured government scheme' },
  { img: '/images/scheme_image/opt/image3.jpg', alt: 'Featured government scheme' },
  { img: '/images/scheme_image/opt/image4.jpg', alt: 'Featured government scheme' },
  { img: '/images/scheme_image/opt/image5.jpg', alt: 'Featured government scheme' },
];

const AUTO_MS = 5000; // auto-advance interval
const DEFAULT_CTA = 'Check what you qualify for →';

export default function BannerCarousel({ locale }: { locale: string }) {
  const count = SLIDES.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  // Auto-advance right-to-left, paused on hover/touch, disabled for reduced motion.
  useEffect(() => {
    if (paused || reduced || count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTO_MS);
    return () => clearInterval(id);
  }, [paused, reduced, count]);

  // Touch swipe (mobile).
  const startX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    startX.current = null;
    setPaused(false);
  };

  // Arrow-key navigation when the carousel has focus.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  };

  if (count === 0) return null;

  return (
    <section
      className="banner-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured schemes"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      <div className="bc-viewport" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="bc-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {SLIDES.map((s, i) => {
            const active = i === index;
            const href = s.href ?? `/${locale}/checker/`;
            return (
              <div
                className="bc-slide"
                key={s.img}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={!active}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.img}
                  alt={s.alt}
                  width={1600}
                  height={900}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                />
                {(s.caption || s.ctaText !== null) && (
                  <div className="bc-caption">
                    {s.caption && <p className="bc-caption-text">{s.caption}</p>}
                    {s.ctaText !== null && (
                      <Link className="btn btn-primary bc-cta" href={href} tabIndex={active ? 0 : -1}>
                        {s.ctaText ?? DEFAULT_CTA}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <>
            <button className="bc-arrow bc-prev" onClick={prev} aria-label="Previous slide">
              ‹
            </button>
            <button className="bc-arrow bc-next" onClick={next} aria-label="Next slide">
              ›
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="bc-dots" role="group" aria-label="Choose slide">
          {SLIDES.map((s, i) => (
            <button
              key={s.img}
              className={`bc-dot${i === index ? ' is-active' : ''}`}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// Tracks the user's OS "reduce motion" preference (live-updating).
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}
