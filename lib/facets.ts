// ---------------------------------------------------------------------------
// Faceted browse — a PURE module (no React/DB/I/O) so it unit-tests cleanly and
// runs in the browser. Reuses the Phase 2 index; adds a derived `beneficiaries`
// facet. Facet logic: OR within a group, AND across groups (D19). State is a
// PROPERTY filter, not a relevance filter (D20) — the checker covers relevance.
// ---------------------------------------------------------------------------
import type { Eligibility } from './types.ts';
import type { SchemeIndexEntry } from './matcher.ts';

// The index JSON carries this extra field for browse; the matcher ignores it.
export type FacetEntry = SchemeIndexEntry & { beneficiaries: string[] };

export type FacetKey = 'state' | 'category' | 'beneficiary';
export const FACET_KEYS: FacetKey[] = ['state', 'category', 'beneficiary'];
export type Selection = Record<FacetKey, string[]>;

export const emptySelection = (): Selection => ({ state: [], category: [], beneficiary: [] });

export const CENTRAL_LABEL = 'Central (all-India)';

// Derive "who is this for?" from STRUCTURED eligibility at build time (D21).
// Heuristic on the 10 seeds; revisit with real data in Phase 4 (cf. D11).
export function deriveBeneficiaries(e: Eligibility): string[] {
  const out = new Set<string>();
  if (e.gender === 'female') out.add('Women & Girls');
  if (e.gender === 'male') out.add('Men');
  for (const o of e.occupation ?? []) {
    if (o === 'farmer') out.add('Farmers');
    else if (o === 'student') out.add('Students');
    else if (o === 'street_vendor') out.add('Street Vendors');
    else if (o === 'artisan') out.add('Artisans');
  }
  if (e.caste && e.caste.length > 0) out.add('SC / ST / OBC');
  if (e.age_max !== undefined && e.age_max <= 18) out.add('Children');
  if (e.age_min !== undefined && e.age_min >= 60) out.add('Senior Citizens');
  if ((e.other_flags ?? []).some((f) => f.includes('70_plus'))) out.add('Senior Citizens');
  if ((e.other_flags ?? []).some((f) => f.includes('disab'))) out.add('Persons with Disabilities');
  if (out.size === 0) out.add('General Public');
  return [...out].sort();
}

// The facet values an entry contributes, per group.
function valuesFor(entry: FacetEntry, key: FacetKey): string[] {
  if (key === 'state') return [entry.state ?? CENTRAL_LABEL];
  if (key === 'category') return entry.categories;
  return entry.beneficiaries;
}

// An entry matches a group if nothing is selected there, or it carries one of
// the selected values (OR within group).
function groupMatch(entry: FacetEntry, key: FacetKey, sel: Selection): boolean {
  const chosen = sel[key];
  if (chosen.length === 0) return true;
  const values = valuesFor(entry, key);
  return chosen.some((c) => values.includes(c));
}

// AND across groups.
export function filterEntries(entries: FacetEntry[], sel: Selection): FacetEntry[] {
  return entries.filter((e) => FACET_KEYS.every((k) => groupMatch(e, k, sel)));
}

export type FacetOption = { value: string; count: number };

// Options for one group, each with the count it WOULD yield given the OTHER
// groups' selections (a group's own selection is ignored for its own counts —
// standard faceted-search behaviour, so you never tick into zero results).
export function facetOptions(
  entries: FacetEntry[],
  sel: Selection,
  key: FacetKey,
): FacetOption[] {
  const others = entries.filter((e) =>
    FACET_KEYS.filter((k) => k !== key).every((k) => groupMatch(e, k, sel)),
  );
  const all = new Set<string>();
  for (const e of entries) for (const v of valuesFor(e, key)) all.add(v);
  return [...all]
    .sort()
    .map((value) => ({
      value,
      count: others.filter((e) => valuesFor(e, key).includes(value)).length,
    }));
}

// --- URL sync helpers (comma-separated; no facet value contains a comma) ---

export function selectionToParams(sel: Selection): string {
  const p = new URLSearchParams();
  for (const k of FACET_KEYS) if (sel[k].length) p.set(k, sel[k].join(','));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function paramsToSelection(search: string): Selection {
  const p = new URLSearchParams(search);
  const sel = emptySelection();
  for (const k of FACET_KEYS) {
    const raw = p.get(k);
    if (raw) sel[k] = raw.split(',').filter(Boolean);
  }
  return sel;
}
