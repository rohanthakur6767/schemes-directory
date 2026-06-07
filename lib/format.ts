import type { Benefit, Eligibility } from './types.ts';

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
export function eligibilityFacts(e: Eligibility): string[] {
  const out: string[] = [];
  if (e.age_min !== undefined && e.age_max !== undefined) out.push(`Age ${e.age_min}–${e.age_max}`);
  else if (e.age_min !== undefined) out.push(`Age ${e.age_min}+`);
  else if (e.age_max !== undefined) out.push(`Age up to ${e.age_max}`);
  if (e.income_max !== undefined) out.push(`Household income ≤ ${formatINR(e.income_max)}/year`);
  if (e.gender) out.push(e.gender === 'female' ? 'Women / girls only' : 'Men only');
  if (e.occupation) out.push(`For: ${e.occupation.map(humanizeFlag).join(', ')}`);
  if (e.caste) out.push(`Category: ${e.caste.join(', ')}`);
  if (e.residence_state) out.push(`Resident of ${e.residence_state.join(' / ')}`);
  if (e.other_flags) out.push(...e.other_flags.map(humanizeFlag));
  return out;
}
