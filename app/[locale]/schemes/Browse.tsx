'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  facetOptions,
  filterEntries,
  paramsToSelection,
  selectionToParams,
  emptySelection,
  FACET_KEYS,
  type FacetEntry,
  type FacetKey,
  type Selection,
} from '@/lib/facets';
import { iconFor } from '@/lib/categoryIcons';

const GROUP_LABELS: Record<FacetKey, string> = {
  state: 'State',
  category: 'Category',
  beneficiary: "Who it's for",
};

// The three accordion filter sections. Rendered in BOTH the desktop sidebar and
// the mobile bottom-sheet — each instance keeps its own open/search UI state, but
// all share the single `sel` selection through `toggle` (so counts/results and
// the active chips stay in sync regardless of which surface you tick).
function FilterGroups({
  entries,
  sel,
  toggle,
  defaultOpen,
}: {
  entries: FacetEntry[];
  sel: Selection;
  toggle: (key: FacetKey, value: string) => void;
  defaultOpen: FacetKey[];
}) {
  const [open, setOpen] = useState<Set<FacetKey>>(() => new Set(defaultOpen));
  const [stateQuery, setStateQuery] = useState('');

  const toggleSection = (k: FacetKey) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <>
      {FACET_KEYS.map((key) => {
        const opts = facetOptions(entries, sel, key);
        const isOpen = open.has(key);
        const activeCount = sel[key].length;
        const q = stateQuery.trim().toLowerCase();
        const list =
          key === 'state' && q
            ? opts.filter((o) => o.value.toLowerCase().includes(q))
            : opts;

        return (
          <div className="facet-group" key={key}>
            <button
              type="button"
              className="facet-head"
              aria-expanded={isOpen}
              onClick={() => toggleSection(key)}
            >
              <span className="facet-title">{GROUP_LABELS[key]}</span>
              {activeCount > 0 && <span className="facet-badge">{activeCount}</span>}
              <span className="facet-caret" aria-hidden>{isOpen ? '▾' : '▸'}</span>
            </button>

            {isOpen && (
              <div className="facet-body">
                {key === 'state' && (
                  <input
                    className="facet-search"
                    type="search"
                    placeholder="Search state…"
                    aria-label="Search state"
                    value={stateQuery}
                    onChange={(e) => setStateQuery(e.target.value)}
                  />
                )}
                <div className={`facet-list${key === 'state' ? ' facet-list--state' : ''}`}>
                  {list.map((opt) => {
                    const checked = sel[key].includes(opt.value);
                    const disabled = opt.count === 0 && !checked;
                    return (
                      <label key={opt.value} className={`facet-opt${disabled ? ' disabled' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggle(key, opt.value)}
                        />
                        <span className="facet-opt-label">{opt.value}</span>
                        <span className="count">({opt.count})</span>
                      </label>
                    );
                  })}
                  {list.length === 0 && <p className="facet-empty">No matches.</p>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default function Browse({ locale }: { locale: string }) {
  const [entries, setEntries] = useState<FacetEntry[] | null>(null);
  const [sel, setSel] = useState<Selection>(emptySelection());
  const [sheetOpen, setSheetOpen] = useState(false);

  // Same single static file as the checker — no extra fetch, no server (D1/D2).
  useEffect(() => {
    fetch(`/index/${locale}/schemes.json`)
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [locale]);

  // Restore selection from the URL on first load (shareable filtered views).
  useEffect(() => {
    setSel(paramsToSelection(window.location.search));
  }, []);

  // Mirror selection back into the URL without a navigation/reload.
  useEffect(() => {
    const qs = selectionToParams(sel);
    window.history.replaceState(null, '', qs || window.location.pathname);
  }, [sel]);

  // While the mobile sheet is open: lock background scroll + close on Escape.
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen]);

  const results = useMemo(
    () => (entries ? filterEntries(entries, sel) : []),
    [entries, sel],
  );

  if (entries === null) return <p>Loading…</p>;

  const toggle = (key: FacetKey, value: string) =>
    setSel((s) => ({
      ...s,
      [key]: s[key].includes(value)
        ? s[key].filter((v) => v !== value)
        : [...s[key], value],
    }));

  const clearAll = () => setSel(emptySelection());
  const totalActive = FACET_KEYS.reduce((n, k) => n + sel[k].length, 0);
  const chips = FACET_KEYS.flatMap((k) => sel[k].map((value) => ({ key: k, value })));
  const countLabel = (n: number) => `${n} ${n === 1 ? 'scheme' : 'schemes'}`;

  return (
    <div className="browse">
      {/* Desktop sidebar — hidden < 1024px (replaced by the Filters button). */}
      <aside className="facets" aria-label="Filters">
        <FilterGroups entries={entries} sel={sel} toggle={toggle} defaultOpen={FACET_KEYS} />
      </aside>

      <section className="browse-results">
        {/* Mobile/tablet only (hidden ≥1024px via CSS). */}
        <button type="button" className="filters-trigger" onClick={() => setSheetOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 5h18l-7 8v6l-4-2v-4z" />
          </svg>
          Filters
          {totalActive > 0 && <span className="ft-badge">{totalActive}</span>}
        </button>

        {chips.length > 0 && (
          <div className="active-chips">
            {chips.map(({ key, value }) => (
              <span className="chip" key={`${key}:${value}`}>
                {value}
                <button
                  type="button"
                  className="chip-x"
                  aria-label={`Remove filter ${value}`}
                  onClick={() => toggle(key, value)}
                >
                  ✕
                </button>
              </span>
            ))}
            {chips.length >= 2 && (
              <button type="button" className="chip-clear" onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>
        )}

        <p className="result-count">{countLabel(results.length)}</p>
        {results.map((s) => (
          <div key={s.id} className="result-card">
            <a href={`/${locale}/schemes/${s.slug}/`}>
              <strong>{s.name}</strong>
            </a>
            <p>{s.summary}</p>
            <p className="tags">
              <span aria-hidden>{iconFor(s.categories[0])}</span> {s.state ?? 'Central'}
              {s.categories.length ? ` · ${s.categories.join(', ')}` : ''}
            </p>
          </div>
        ))}
        {results.length === 0 && <p>No schemes match these filters.</p>}
      </section>

      {/* Mobile bottom-sheet */}
      {sheetOpen && (
        <div className="sheet-backdrop" onClick={() => setSheetOpen(false)}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-head">
              <h2>Filters</h2>
              {totalActive > 0 && (
                <button type="button" className="sheet-clear" onClick={clearAll}>
                  Clear all
                </button>
              )}
              <button
                type="button"
                className="sheet-close"
                aria-label="Close filters"
                onClick={() => setSheetOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="sheet-body">
              <FilterGroups entries={entries} sel={sel} toggle={toggle} defaultOpen={[]} />
            </div>
            <button type="button" className="sheet-apply" onClick={() => setSheetOpen(false)}>
              Show {countLabel(results.length)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
