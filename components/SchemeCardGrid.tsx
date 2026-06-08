import Link from 'next/link';
import { iconFor } from '@/lib/categoryIcons';
import type { SchemeWithProse } from '@/lib/types';

// Shared card grid used by the category + state hub templates (and reusable
// anywhere). Server component — no client JS. One place to style scheme cards,
// so every hub page stays consistent automatically.
export default function SchemeCardGrid({
  schemes,
  locale,
}: {
  schemes: SchemeWithProse[];
  locale: string;
}) {
  return (
    <div className="scheme-cards">
      {schemes.map((s) => (
        <Link key={s.id} className="scheme-card" href={`/${locale}/schemes/${s.slug}/`}>
          <span className="scheme-card-icon" aria-hidden>
            {iconFor(s.categories[0])}
          </span>
          <strong>{s.prose.name}</strong>
          <p>{s.prose.summary}</p>
          <span className="scheme-card-tags">
            {s.state ?? 'Central'}
            {s.categories.length ? ` · ${s.categories.join(', ')}` : ''}
          </span>
        </Link>
      ))}
    </div>
  );
}
