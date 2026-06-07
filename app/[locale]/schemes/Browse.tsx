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
  beneficiary: 'Beneficiary',
};

export default function Browse({ locale }: { locale: string }) {
  const [entries, setEntries] = useState<FacetEntry[] | null>(null);
  const [sel, setSel] = useState<Selection>(emptySelection());

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

  const anySelected = FACET_KEYS.some((k) => sel[k].length > 0);

  return (
    <div className="browse">
      <aside className="facets">
        {anySelected && (
          <button className="clear" onClick={() => setSel(emptySelection())}>
            Clear all filters
          </button>
        )}
        {FACET_KEYS.map((key) => (
          <fieldset key={key}>
            <legend>{GROUP_LABELS[key]}</legend>
            {facetOptions(entries, sel, key).map((opt) => {
              const checked = sel[key].includes(opt.value);
              const disabled = opt.count === 0 && !checked;
              return (
                <label key={opt.value} className={disabled ? 'disabled' : ''}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(key, opt.value)}
                  />
                  {opt.value} <span className="count">({opt.count})</span>
                </label>
              );
            })}
          </fieldset>
        ))}
      </aside>

      <section className="browse-results">
        <p className="result-count">
          {results.length} {results.length === 1 ? 'scheme' : 'schemes'}
        </p>
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
    </div>
  );
}
