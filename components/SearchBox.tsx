'use client';

import { useEffect, useRef, useState } from 'react';
import { searchSchemes, type SearchableScheme } from '@/lib/search';

// One component, two looks: a big box for the hero, a compact one for the nav.
// Both read the SAME static index (D2/D37) — fetched lazily on first focus, so
// pages that don't use search stay light. No server.
export default function SearchBox({
  locale,
  variant,
}: {
  locale: string;
  variant: 'hero' | 'nav';
}) {
  const [entries, setEntries] = useState<SearchableScheme[] | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = () => {
    if (entries === null) {
      fetch(`/index/${locale}/schemes.json`)
        .then((r) => r.json())
        .then(setEntries)
        .catch(() => setEntries([]));
    }
  };

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const results = entries && q.trim() ? searchSchemes(entries, q, 8) : [];

  const go = (slug: string) => {
    window.location.href = `/${locale}/schemes/${slug}/`;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]?.slug ?? results[0].slug);
    }
  };

  return (
    <div className={`search search-${variant}`} ref={wrapRef}>
      <input
        type="search"
        className="search-input"
        placeholder="Search schemes — e.g. farmer, scholarship, pension"
        value={q}
        onFocus={() => {
          load();
          setOpen(true);
        }}
        onChange={(e) => {
          load(); // robust: load the index on first interaction (focus OR typing)
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        aria-label="Search schemes"
        autoComplete="off"
      />
      {open && q.trim() && (
        <div className="search-results" role="listbox">
          {entries === null ? (
            <p className="search-msg">Loading…</p>
          ) : results.length === 0 ? (
            <p className="search-msg">No schemes match “{q.trim()}”.</p>
          ) : (
            results.map((r, i) => (
              <a
                key={r.slug}
                href={`/${locale}/schemes/${r.slug}/`}
                className={`search-hit${i === active ? ' active' : ''}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
              >
                <strong>{r.name}</strong>
                <span>
                  {r.state ?? 'Central'}
                  {r.categories.length ? ` · ${r.categories.slice(0, 2).join(', ')}` : ''}
                </span>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
