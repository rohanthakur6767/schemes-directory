// ---------------------------------------------------------------------------
// Client-side keyword search over the static JSON index (D37). Pure → unit-tested,
// runs entirely in the browser (no server, D2). Substring + token matching with
// simple relevance ranking. Not fuzzy/typo-tolerant — that's a later Pagefind job.
// ---------------------------------------------------------------------------

export type SearchableScheme = {
  slug: string;
  name: string;
  summary: string;
  categories: string[];
  state: string | null;
};

export function searchSchemes<T extends SearchableScheme>(
  entries: T[],
  query: string,
  limit = 8,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const scored: { e: T; score: number }[] = [];
  for (const e of entries) {
    const name = e.name.toLowerCase();
    // Searchable haystack: name + summary + categories + state.
    const hay = `${name} ${e.summary.toLowerCase()} ${e.categories.join(' ').toLowerCase()} ${(e.state ?? '').toLowerCase()}`;
    // Every term must appear somewhere (AND semantics).
    if (!terms.every((t) => hay.includes(t))) continue;

    let score = 0;
    if (name.startsWith(q)) score += 100; // exact prefix on the name → best
    else if (name.includes(q)) score += 60; // whole query inside the name
    if (terms.every((t) => name.includes(t))) score += 25; // all terms in the name
    score -= name.length * 0.02; // nudge shorter/closer names up

    scored.push({ e, score });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.e);
}
