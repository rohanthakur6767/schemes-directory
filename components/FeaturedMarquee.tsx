import Link from 'next/link';
import { iconFor } from '@/lib/categoryIcons';
import type { SchemeWithProse } from '@/lib/types';

// Auto-scrolling (right→left) showcase of schemes. PURE CSS animation (no client
// JS, static-export friendly). The card list is rendered twice so the loop is
// seamless; the second copy is aria-hidden + non-focusable (and hidden entirely
// under prefers-reduced-motion) so screen readers / keyboard never hit duplicates.
// Reuses .scheme-card styling for visual consistency with the hub/browse grids.
export default function FeaturedMarquee({
  schemes,
  locale,
}: {
  schemes: SchemeWithProse[];
  locale: string;
}) {
  if (!schemes.length) return null;

  const card = (s: SchemeWithProse, dup: boolean) => (
    <Link
      key={(dup ? 'dup-' : '') + s.id}
      className="scheme-card marquee-card"
      href={`/${locale}/schemes/${s.slug}/`}
      {...(dup ? { 'aria-hidden': true, tabIndex: -1 } : {})}
    >
      <span className="scheme-card-icon" aria-hidden>
        {iconFor(s.categories[0])}
      </span>
      <strong>{s.prose.name}</strong>
      <p>{s.prose.summary}</p>
      <span className="scheme-card-tags">
        Central{s.categories.length ? ` · ${s.categories.join(', ')}` : ''}
      </span>
    </Link>
  );

  return (
    <div className="marquee">
      {/* Speed scales with count (~4s/card) so it feels the same at any length. */}
      <div className="marquee-track" style={{ animationDuration: `${schemes.length * 4}s` }}>
        {schemes.map((s) => card(s, false))}
        {schemes.map((s) => card(s, true))}
      </div>
    </div>
  );
}
