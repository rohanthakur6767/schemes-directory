// ---------------------------------------------------------------------------
// The eligibility matcher — a PURE module (no React, no DB, no I/O) so it runs
// identically in the browser (the checker UI) and in `node --test`. This is the
// first headline feature and the payoff for storing eligibility as structured
// data instead of prose.
//
// Semantics (D9/D11) + three-valued logic (D15):
//   For each criterion DEFINED on a scheme, compare against the user's profile:
//     pass    — profile satisfies it
//     fail    — profile violates it          → scheme excluded entirely
//     unknown — user didn't answer, OR it's an `other_flags` condition we don't
//               ask about                     → scheme shown as "may qualify"
//   A criterion the scheme does NOT define is simply not tested (no constraint).
// ---------------------------------------------------------------------------
import type { Eligibility, Benefit } from './types.ts';
import { formatINR, humanizeFlag } from './format.ts';
import { t } from './messages.ts';

// One row of the build-time index (public/index/<locale>/schemes.json).
// Matchable fields + what we need to render a result card. NO prose.
export type SchemeIndexEntry = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  level: 'central' | 'state';
  state: string | null;
  categories: string[];
  benefit: Benefit;
  eligibility: Eligibility;
};

export type Profile = {
  age?: number;
  gender?: 'female' | 'male';
  income?: number; // annual household (D9)
  occupation?: string[]; // the roles the user identifies with
  caste?: 'GEN' | 'OBC' | 'SC' | 'ST';
  state?: string; // full name, e.g. 'Madhya Pradesh'
};

export type Verdict = 'eligible' | 'maybe' | 'ineligible';

export type Match = {
  scheme: SchemeIndexEntry;
  verdict: Verdict;
  reasons: string[]; // criteria the profile satisfies — the "why you matched"
  toConfirm: string[]; // unknowns: unanswered questions + other_flags conditions
};

// ---------------------------------------------------------------------------

export function matchScheme(profile: Profile, s: SchemeIndexEntry, locale = 'en'): Match {
  const e = s.eligibility;
  const reasons: string[] = [];
  const toConfirm: string[] = [];
  let failed = false;

  // Helper: record a tri-state outcome for one criterion.
  const judge = (
    defined: boolean,
    known: boolean,
    ok: boolean,
    passText: string,
    confirmText: string,
  ) => {
    if (!defined) return; // scheme has no such constraint → skip
    if (!known) toConfirm.push(confirmText); // user didn't answer → unknown
    else if (ok) reasons.push(passText);
    else failed = true; // profile violates a hard criterion → out
  };

  // age
  const ageText =
    e.age_min !== undefined && e.age_max !== undefined
      ? `${e.age_min}–${e.age_max}`
      : e.age_min !== undefined
        ? `${e.age_min}+`
        : t(locale, 'match.age.upTo', { max: e.age_max ?? 0 });
  judge(
    e.age_min !== undefined || e.age_max !== undefined,
    profile.age !== undefined,
    (e.age_min === undefined || profile.age! >= e.age_min) &&
      (e.age_max === undefined || profile.age! <= e.age_max),
    t(locale, 'match.age.pass', { range: ageText }),
    t(locale, 'match.age.confirm', { range: ageText }),
  );

  // income (household, annual)
  judge(
    e.income_max !== undefined,
    profile.income !== undefined,
    profile.income! <= (e.income_max ?? Infinity),
    t(locale, 'match.income.pass', { amount: formatINR(e.income_max ?? 0) }),
    t(locale, 'match.income.confirm', { amount: formatINR(e.income_max ?? 0) }),
  );

  // gender
  judge(
    e.gender !== undefined,
    profile.gender !== undefined,
    profile.gender === e.gender,
    t(locale, e.gender === 'female' ? 'match.gender.passFemale' : 'match.gender.passMale'),
    t(locale, e.gender === 'female' ? 'match.gender.confirmFemale' : 'match.gender.confirmMale'),
  );

  // occupation — scheme lists acceptable roles (ANY-of)
  judge(
    e.occupation !== undefined,
    !!profile.occupation && profile.occupation.length > 0,
    !!profile.occupation && profile.occupation.some((o) => e.occupation?.includes(o) ?? false),
    t(locale, 'match.occupation.pass'),
    t(locale, 'facts.for', { list: (e.occupation ?? []).map(humanizeFlag).join(', ') }),
  );

  // caste / social category (ANY-of)
  judge(
    e.caste !== undefined,
    profile.caste !== undefined,
    !!profile.caste && (e.caste?.includes(profile.caste) ?? false),
    t(locale, 'match.caste.pass', { caste: profile.caste ?? '' }),
    t(locale, 'match.caste.confirm', { list: (e.caste ?? []).join(', ') }),
  );

  // residence state (ANY-of)
  judge(
    e.residence_state !== undefined,
    profile.state !== undefined,
    !!profile.state && (e.residence_state?.includes(profile.state) ?? false),
    t(locale, 'match.state.pass'),
    t(locale, 'match.state.confirm', { list: (e.residence_state ?? []).join(' / ') }),
  );

  // other_flags — boolean conditions we deliberately don't ask (D11). ALWAYS
  // surfaced as things to confirm, never as a pass/fail.
  for (const flag of e.other_flags ?? []) {
    toConfirm.push(t(locale, 'match.alsoRequires', { flag: humanizeFlag(flag) }));
  }

  const verdict: Verdict = failed
    ? 'ineligible'
    : toConfirm.length > 0
      ? 'maybe'
      : 'eligible';

  return { scheme: s, verdict, reasons, toConfirm };
}

// Rank: confirmed-eligible above maybes; within each, larger headline benefit
// first (a crude but sensible "most valuable to you" proxy — D16). Amount=null
// sorts last because we can't rank what we can't quantify.
export function matchAll(profile: Profile, entries: SchemeIndexEntry[], locale = 'en'): Match[] {
  return entries
    .map((e) => matchScheme(profile, e, locale))
    .filter((m) => m.verdict !== 'ineligible')
    .sort((a, b) => {
      if (a.verdict !== b.verdict) return a.verdict === 'eligible' ? -1 : 1;
      const av = a.scheme.benefit.amount ?? -1;
      const bv = b.scheme.benefit.amount ?? -1;
      return bv - av;
    });
}

// Data-driven option lists for the questionnaire, derived from the index so new
// schemes never require touching the form (D17).
export function deriveOccupations(entries: SchemeIndexEntry[]): string[] {
  const set = new Set<string>();
  for (const e of entries) for (const o of e.eligibility.occupation ?? []) set.add(o);
  return [...set].sort();
}

export function deriveStates(entries: SchemeIndexEntry[]): string[] {
  const set = new Set<string>();
  for (const e of entries) for (const s of e.eligibility.residence_state ?? []) set.add(s);
  return [...set].sort();
}
