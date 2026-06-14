import type { Benefit, Eligibility } from './types.ts';
import { t } from './messages.ts';

export function formatINR(n: number): string {
  // en-IN grouping: ₹2,50,000 — lakh/crore style, as users expect.
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

const FREQ_LABEL = { one_time: 'one-time', monthly: 'per month', yearly: 'per year' } as const;

export function benefitLine(b: Benefit): string {
  if (b.amount === null) return b.note ?? b.type;
  const base = `${formatINR(b.amount)}${b.frequency ? ` ${FREQ_LABEL[b.frequency]}` : ''}`;
  return b.note ? `${base} — ${b.note}` : base;
}

export const humanizeFlag = (s: string) => s.replaceAll('_', ' ');

// Renders the STRUCTURED eligibility object as human-readable chips. This is
// the same data the checker matches on (Phase 2) — page and checker can never
// disagree, because there is only one source of truth.
export function eligibilityFacts(e: Eligibility, locale = 'en'): string[] {
  const out: string[] = [];
  if (e.age_min !== undefined && e.age_max !== undefined)
    out.push(t(locale, 'facts.ageRange', { min: e.age_min, max: e.age_max }));
  else if (e.age_min !== undefined) out.push(t(locale, 'facts.ageMin', { min: e.age_min }));
  else if (e.age_max !== undefined) out.push(t(locale, 'facts.ageMax', { max: e.age_max }));
  if (e.income_max !== undefined)
    out.push(t(locale, 'facts.income', { amount: formatINR(e.income_max) }));
  if (e.gender) out.push(t(locale, e.gender === 'female' ? 'facts.womenOnly' : 'facts.menOnly'));
  if (e.occupation) out.push(t(locale, 'facts.for', { list: e.occupation.map(humanizeFlag).join(', ') }));
  if (e.caste) out.push(t(locale, 'facts.category', { list: e.caste.join(', ') }));
  if (e.residence_state) out.push(t(locale, 'facts.resident', { list: e.residence_state.join(' / ') }));
  if (e.other_flags) out.push(...e.other_flags.map(humanizeFlag));
  return out;
}
