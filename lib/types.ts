import { z } from 'zod';

// ---------------------------------------------------------------------------
// The eligibility object (PLAN §5, D11).
//
// Convention: AN OMITTED KEY MEANS "NO CONSTRAINT" (D9/D11). No 'any' sentinel
// values — the matcher simply iterates over the keys that are present and
// tests each one. Boolean requirements live in `other_flags` and are always
// positively phrased ("this must be true of the applicant"), including
// negations: 'not_income_tax_payer' means "applicant does not pay income tax".
//
// Known limit (logged as D11): this flat shape cannot express OR-combinations
// ("SC/ST household OR BPL OR ..."). We approximate with one representative
// flag and revisit with real Phase 4 data in hand.
// ---------------------------------------------------------------------------

export const CASTES = ['GEN', 'OBC', 'SC', 'ST'] as const;

export const EligibilitySchema = z.strictObject({
  age_min: z.number().int().min(0).optional(),       // inclusive
  age_max: z.number().int().min(0).optional(),       // inclusive
  income_max: z.number().int().positive().optional(),// annual HOUSEHOLD income, ₹ (D9)
  gender: z.enum(['female', 'male']).optional(),
  occupation: z.array(z.string()).min(1).optional(), // applicant matches ANY listed
  caste: z.array(z.enum(CASTES)).min(1).optional(),  // applicant matches ANY listed
  residence_state: z.array(z.string()).min(1).optional(),
  other_flags: z.array(z.string()).min(1).optional(),// ALL must hold for the applicant
});

export type Eligibility = z.infer<typeof EligibilitySchema>;

export const BENEFIT_TYPES = [
  'cash', 'pension', 'insurance', 'loan', 'subsidy', 'savings', 'scholarship', 'service',
] as const;

export const BenefitSchema = z.strictObject({
  type: z.enum(BENEFIT_TYPES),
  amount: z.number().int().positive().nullable(),    // headline ₹ figure, null if not flat
  frequency: z.enum(['one_time', 'monthly', 'yearly']).nullable(),
  note: z.string().optional(),                       // human nuance ("3 instalments of ₹2,000")
});

export type Benefit = z.infer<typeof BenefitSchema>;

export const SchemeSchema = z.strictObject({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  level: z.enum(['central', 'state']),
  state: z.string().nullable(),
  categories: z.array(z.string()).min(1),
  benefit: BenefitSchema,
  eligibility: EligibilitySchema,
  documents: z.array(z.string()),
  official_url: z.url(),
  source: z.string().min(1),
  last_verified: z.string().nullable(),              // 'YYYY-MM-DD' | null = pending
});

export type Scheme = z.infer<typeof SchemeSchema>;

export const ProseSchema = z.strictObject({
  name: z.string().min(1),
  summary: z.string().min(20),
  eligibility_prose: z.string().min(20),
  benefits_prose: z.string().min(20),
  how_to_apply: z.string().min(20),
});

export type Prose = z.infer<typeof ProseSchema>;

// Deeper content (D33), stored per-locale as jsonb. Optional with [] default so
// older rows / seeds without them stay valid.
export const FaqSchema = z.strictObject({ q: z.string().min(1), a: z.string().min(1) });
export type Faq = z.infer<typeof FaqSchema>;

export const ApplyStepsSchema = z.array(z.string().min(1));
export const FaqsSchema = z.array(FaqSchema);

export type SchemeWithProse = Scheme & {
  prose: Prose;
  apply_steps: string[];
  faqs: Faq[];
};
