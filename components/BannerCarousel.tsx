'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ───────────────────────────────────────────────────────────────────────────
// EDIT YOUR SLIDES HERE — this is the single place to change images, captions,
// and buttons. Per slide:
//   img      — path under /public (optimized JPEGs live in scheme_image/opt/)
//   alt      — REQUIRED for accessibility; describe the banner
//   caption  — OPTIONAL overlay heading text (omit for none)
//   ctaText  — OPTIONAL overlay button label (omit for none)
//   href     — where the WHOLE slide links (defaults to the eligibility checker)
// The whole banner is clickable. These images already contain their own titles and
// buttons, so NO overlay is set by default — add caption/ctaText to a slide only if
// you want extra text on top of it.
// ───────────────────────────────────────────────────────────────────────────
type Slide = {
  img: string;
  alt: string;
  caption?: string;
  ctaText?: string;
  href?: string; // e.g. "/en/schemes/pm-kisan/" — omit to link to the checker
};

const SLIDES: Slide[] = [
  { img: '/images/scheme_image/opt/image1.jpg', alt: 'Discover government schemes for a better tomorrow' },
  { img: '/images/scheme_image/opt/image2.jpg', alt: 'Healthcare schemes for every Indian' },
  { img: '/images/scheme_image/opt/image3.jpg', alt: 'Featured government scheme' },
  { img: '/images/scheme_image/opt/image4.jpg', alt: 'Featured government scheme' },
  { img: '/images/scheme_image/opt/image5.jpg', alt: 'Featured government scheme' },
];

const AUTO_MS = 5000; // auto-advance interval

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

  // Touch swipe (mobile). suppressClick stops a swipe from also firing the
  // slide-link navigation when the finger lifts.
  const startX = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    suppressClick.current = false;
    setPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current !== null) {
      const dx = e.changedTouches[0].clientX - startX.current;
      if (Math.abs(dx) > 40) {
        (dx < 0 ? next : prev)();
        suppressClick.current = true;
      }
    }
    startX.current = null;
    setPaused(false);
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
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
      <div
        className="bc-viewport"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClickCapture={onClickCapture}
      >
        <div className="bc-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {SLIDES.map((s, i) => {
            const active = i === index;
            const href = s.href ?? `/${locale}/checker/`;
            return (
              <Link
                className="bc-slide"
                key={s.img}
                href={href}
                aria-roledescription="slide"
                aria-label={`${s.alt} — slide ${i + 1} of ${count}`}
                aria-hidden={!active}
                tabIndex={active ? 0 : -1}
                draggable={false}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.img}
                  alt=""
                  width={1600}
                  height={900}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                />
                {(s.caption || s.ctaText) && (
                  <span className="bc-caption">
                    {s.caption && <span className="bc-caption-text">{s.caption}</span>}
                    {s.ctaText && <span className="btn btn-primary bc-cta">{s.ctaText}</span>}
                  </span>
                )}
              </Link>
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
