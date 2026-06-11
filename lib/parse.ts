// ---------------------------------------------------------------------------
// Bridge between the LLM's "full object with nulls" and our canonical sparse
// shape (D11: omitted key = no constraint). Pure → unit-tested. Also exports the
// JSON Schema the LLM is constrained to, and the extraction prompt.
// ---------------------------------------------------------------------------
import { z } from 'zod';
import {
  BenefitSchema,
  EligibilitySchema,
  type Eligibility,
  type Benefit,
  type RelevantLink,
  type Contacts,
} from './types.ts';
import type { JsonSchema } from './llm.ts';
import { CANONICAL_CATEGORIES } from './categories.ts';

// Snake_case flag vocabulary we already use — fed to the model so flags stay
// consistent across schemes (the checker matches on exact flag strings).
export const FLAG_VOCAB = [
  'owns_cultivable_land', 'not_income_tax_payer', 'no_government_employee_in_family',
  'no_family_member_in_government_service', 'poor_household', 'no_lpg_connection_in_household',
  'has_savings_bank_account', 'has_vending_certificate_or_survey_listing',
  'studying_in_government_or_aided_school', 'works_in_listed_traditional_trade',
  'married_widowed_divorced_or_abandoned', 'unmarried', 'enrolled_in_education',
  'secc_2011_listed', 'bpl', 'minority', 'disabled',
];

// The shape the LLM MUST return (every key present; nulls/'any'/[] = unknown).
// Validated before sparse-ifying, so a malformed LLM reply fails loudly.
const LlmResult = z.strictObject({
  name: z.string(),
  level: z.enum(['central', 'state']),
  state: z.string().nullable(),
  categories: z.array(z.string()),
  benefit: z.strictObject({
    type: z.string(),
    amount: z.number().int().nullable(),
    frequency: z.string().nullable(),
    note: z.string().nullable(),
  }),
  eligibility: z.strictObject({
    age_min: z.number().int().nullable(),
    age_max: z.number().int().nullable(),
    income_max: z.number().int().nullable(),
    gender: z.enum(['female', 'male', 'any']),
    occupation: z.array(z.string()),
    caste: z.array(z.enum(['GEN', 'OBC', 'SC', 'ST'])),
    residence_state: z.array(z.string()),
    other_flags: z.array(z.string()),
  }),
  documents: z.array(z.string()),
  official_url: z.string().nullable(),
  relevant_links: z.array(z.strictObject({ label: z.string(), url: z.string() })),
  contacts: z.strictObject({
    toll_free: z.array(z.string()),
    phones: z.array(z.string()),
    emails: z.array(z.string()),
  }),
  notes: z.string(), // model's own flags about ambiguity — shown to the reviewer
});
export type LlmResult = z.infer<typeof LlmResult>;

// --- Sanitisers for the new contact/link fields (also reused by the backfill) ---

// Coerce to a valid http(s) URL or null (adds https:// if the scheme is missing).
function validHttpUrl(u: string): string | null {
  const t = (u || '').trim();
  if (!t) return null;
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const url = new URL(withProto);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

// Keep only real labelled links with valid URLs; dedupe by URL; cap at 6.
export function sanitizeLinks(raw: { label: string; url: string }[]): RelevantLink[] {
  const seen = new Set<string>();
  const out: RelevantLink[] = [];
  for (const l of raw ?? []) {
    const url = validHttpUrl(l?.url);
    const label = (l?.label || '').trim();
    if (!url || !label || seen.has(url)) continue;
    seen.add(url);
    out.push({ label, url });
    if (out.length >= 6) break;
  }
  return out;
}

// A phone string is valid if it has 7–15 digits (toll-free 1800… or a 10-digit).
function cleanPhone(s: string): string | null {
  const t = (s || '').trim();
  const digits = t.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return t.replace(/\s+/g, ' ');
}
function cleanEmail(s: string): string | null {
  const t = (s || '').trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t) ? t : null;
}

export function sanitizeContacts(raw: {
  toll_free?: string[];
  phones?: string[];
  emails?: string[];
}): Contacts {
  const uniq = (arr: (string | null)[]) =>
    [...new Set(arr.filter((x): x is string => !!x))].slice(0, 6);
  return {
    toll_free: uniq((raw?.toll_free ?? []).map(cleanPhone)),
    phones: uniq((raw?.phones ?? []).map(cleanPhone)),
    emails: uniq((raw?.emails ?? []).map(cleanEmail)),
  };
}

// Drop nulls / 'any' / empty arrays → our canonical sparse Eligibility (D11).
export function sparsifyEligibility(e: LlmResult['eligibility']): Eligibility {
  const out: Eligibility = {};
  if (e.age_min !== null) out.age_min = e.age_min;
  if (e.age_max !== null) out.age_max = e.age_max;
  if (e.income_max !== null) out.income_max = e.income_max;
  if (e.gender !== 'any') out.gender = e.gender;
  if (e.occupation.length) out.occupation = e.occupation;
  if (e.caste.length) out.caste = e.caste;
  if (e.residence_state.length) out.residence_state = e.residence_state;
  if (e.other_flags.length) out.other_flags = e.other_flags;
  return EligibilitySchema.parse(out); // validate the canonical result
}

const FREQS = new Set(['one_time', 'monthly', 'yearly']);

function sparsifyBenefit(b: LlmResult['benefit']): Benefit {
  // The LLM may return a free-form frequency ("quarterly", "varies"). Coerce
  // anything outside our enum to null rather than failing the record — the
  // reviewer sets the correct value (D26: drafts, fixed in review).
  const frequency = b.frequency && FREQS.has(b.frequency) ? (b.frequency as Benefit['frequency']) : null;
  const out = {
    type: b.type,
    amount: b.amount,
    frequency,
    ...(b.note ? { note: b.note } : {}),
  };
  return BenefitSchema.parse(out);
}

export type ParsedScheme = {
  name: string;
  level: 'central' | 'state';
  state: string | null;
  categories: string[];
  benefit: Benefit;
  eligibility: Eligibility;
  documents: string[];
  official_url: string | null;
  relevant_links: RelevantLink[];
  contacts: Contacts;
  notes: string;
};

// LLMs sometimes emit the STRING "null"/"none"/"" instead of JSON null. Coerce.
export function nullifyString(s: string | null): string | null {
  if (s === null) return null;
  return ['null', 'none', 'n/a', 'na', ''].includes(s.trim().toLowerCase()) ? null : s;
}

// Validate the raw LLM object, then convert to our canonical structured shape.
export function toParsedScheme(raw: unknown): ParsedScheme {
  const r = LlmResult.parse(raw);
  const state = nullifyString(r.state);
  // Keep level/state consistent (the DB enforces it): a state present ⇒ 'state'.
  const level = state !== null ? 'state' : r.level;
  return {
    name: r.name,
    level,
    state,
    categories: r.categories,
    benefit: sparsifyBenefit(r.benefit),
    eligibility: sparsifyEligibility(r.eligibility),
    documents: r.documents,
    official_url: nullifyString(r.official_url),
    relevant_links: sanitizeLinks(r.relevant_links),
    contacts: sanitizeContacts(r.contacts),
    notes: r.notes,
  };
}

// JSON Schema for OpenAI Structured Outputs (strict): all keys required,
// optionality expressed as null / 'any' / []. additionalProperties:false.
export const EXTRACTION_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'level', 'state', 'categories', 'benefit', 'eligibility', 'documents', 'official_url', 'relevant_links', 'contacts', 'notes'],
  properties: {
    name: { type: 'string' },
    level: { type: 'string', enum: ['central', 'state'] },
    state: { type: ['string', 'null'] },
    categories: { type: 'array', items: { type: 'string' } },
    benefit: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'amount', 'frequency', 'note'],
      properties: {
        type: { type: 'string', enum: ['cash', 'pension', 'insurance', 'loan', 'subsidy', 'savings', 'scholarship', 'service'] },
        amount: { type: ['integer', 'null'] },
        frequency: { type: ['string', 'null'] },
        note: { type: ['string', 'null'] },
      },
    },
    eligibility: {
      type: 'object',
      additionalProperties: false,
      required: ['age_min', 'age_max', 'income_max', 'gender', 'occupation', 'caste', 'residence_state', 'other_flags'],
      properties: {
        age_min: { type: ['integer', 'null'] },
        age_max: { type: ['integer', 'null'] },
        income_max: { type: ['integer', 'null'] },
        gender: { type: 'string', enum: ['female', 'male', 'any'] },
        occupation: { type: 'array', items: { type: 'string' } },
        caste: { type: 'array', items: { type: 'string', enum: ['GEN', 'OBC', 'SC', 'ST'] } },
        residence_state: { type: 'array', items: { type: 'string' } },
        other_flags: { type: 'array', items: { type: 'string' } },
      },
    },
    documents: { type: 'array', items: { type: 'string' } },
    official_url: { type: ['string', 'null'] },
    relevant_links: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'url'],
        properties: { label: { type: 'string' }, url: { type: 'string' } },
      },
    },
    contacts: {
      type: 'object',
      additionalProperties: false,
      required: ['toll_free', 'phones', 'emails'],
      properties: {
        toll_free: { type: 'array', items: { type: 'string' } },
        phones: { type: 'array', items: { type: 'string' } },
        emails: { type: 'array', items: { type: 'string' } },
      },
    },
    notes: { type: 'string' },
  },
};

export const SYSTEM_PROMPT = [
  'You extract structured facts about Indian government welfare schemes from the text of an official scheme page.',
  'Extract ONLY what the text states or clearly implies. NEVER invent facts. If something is not stated, use null (scalars), "any" (gender), or [] (arrays).',
  'Convert money to integer rupees: "₹6000" → 6000; "₹5 lakh" → 500000; "₹1.5 lakh" → 150000.',
  'income_max = the ANNUAL HOUSEHOLD income ceiling in rupees, only if the text gives one.',
  'benefit.type ∈ cash|pension|insurance|loan|subsidy|savings|scholarship|service. benefit.amount = the headline figure (null if not a single number). benefit.frequency ∈ one_time|monthly|yearly|null. benefit.note = a SHORT factual phrase IN YOUR OWN WORDS (do not copy a sentence verbatim from the page), or null.',
  'CRITICAL — the page usually has an "Exclusions" section listing who is NOT eligible. Encode EACH exclusion as a constraint flag. Examples: income-tax payers excluded → "not_income_tax_payer"; serving/retired government employees in the family → "no_government_employee_in_family"; high pension → "no_high_pension_in_family"; constitutional-post holders / professionals (doctors, lawyers, etc.) practising → appropriate flags. Do not skip exclusions — they are eligibility rules.',
  'other_flags: snake_case, positively phrased about the applicant (negations too, e.g. "not_income_tax_payer"). Reuse this vocabulary where it fits, else coin a clear flag:',
  FLAG_VOCAB.join(', ') + '.',
  'categories: choose 1–3 from THIS FIXED LIST only (closest fit) — do not invent new ones:',
  CANONICAL_CATEGORIES.join(', ') + '.',
  'occupation: lowercase single words like farmer, student, artisan, street_vendor, where applicable.',
  'relevant_links: extra official links the page explicitly gives (e.g. guidelines, online registration, notification PDF), each as {label, url}. Include ONLY real URLs that actually appear in the text — never invent one. [] if none.',
  'contacts: helpline/contact details stated on the page. toll_free = numbers described as toll-free or helpline (e.g. 1800-xxx, 104, 14555); phones = other phone numbers; emails = email addresses. Copy digits/emails EXACTLY as written; never invent. [] for any list with none.',
  'notes: one sentence on anything ambiguous or that a human reviewer should double-check.',
].join('\n');
