// Hub-page derivation (Phase 6 SEO). Pure → unit-tested. Turns the published
// schemes into per-category and per-state landing pages, each a unique crawlable
// URL with its own title (the long-tail SEO surface).
import type { SchemeWithProse } from './types.ts';

// "Women & Child" → "women-and-child"; "Madhya Pradesh" → "madhya-pradesh".
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type Hub = { slug: string; label: string; schemes: SchemeWithProse[] };

// Category hubs: a scheme can appear under several categories (that's fine —
// each category page is still unique content).
export function deriveCategoryHubs(schemes: SchemeWithProse[]): Hub[] {
  const map = new Map<string, Hub>();
  for (const s of schemes) {
    for (const c of s.categories) {
      const slug = slugify(c);
      if (!slug) continue;
      if (!map.has(slug)) map.set(slug, { slug, label: c, schemes: [] });
      map.get(slug)!.schemes.push(s);
    }
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

// State hubs: only state-level schemes (D20 + avoid duplicate central content
// across every state page).
export function deriveStateHubs(schemes: SchemeWithProse[]): Hub[] {
  const map = new Map<string, Hub>();
  for (const s of schemes) {
    if (!s.state) continue;
    const slug = slugify(s.state);
    if (!map.has(slug)) map.set(slug, { slug, label: s.state, schemes: [] });
    map.get(slug)!.schemes.push(s);
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}
