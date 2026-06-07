// Prose-generation prompt + schema (Phase 5a). The LLM rewrites facts into
// ORIGINAL sentences; output is always 'llm_unverified' and never published
// until the owner approves it in the review tool (D5).
import { z } from 'zod';
import type { JsonSchema } from './llm.ts';

export const ProseResultSchema = z.strictObject({
  summary: z.string(),
  eligibility_prose: z.string(),
  benefits_prose: z.string(),
  how_to_apply: z.string(),
});
export type ProseResult = z.infer<typeof ProseResultSchema>;

export const PROSE_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'eligibility_prose', 'benefits_prose', 'how_to_apply'],
  properties: {
    summary: { type: 'string' },
    eligibility_prose: { type: 'string' },
    benefits_prose: { type: 'string' },
    how_to_apply: { type: 'string' },
  },
};

export const PROSE_SYSTEM = [
  'You write original, neutral, factual descriptions of Indian government schemes for a public directory.',
  'CRITICAL: Write entirely IN YOUR OWN WORDS. Do NOT copy sentences or distinctive phrases from the source text — paraphrase. Plagiarised text is unusable.',
  'Base every statement ONLY on the provided source text and structured facts. Do NOT invent figures, dates, or criteria. If the source is thin, keep it brief rather than padding.',
  'Use clear Indian English. No marketing language, no "we", no second-person hype.',
  'Fields:',
  '- summary: one sentence, ≤160 characters, for search snippets and cards.',
  '- eligibility_prose: who can apply and key exclusions, 2–4 sentences.',
  '- benefits_prose: what the beneficiary gets, 1–3 sentences.',
  '- how_to_apply: the application route in brief, 1–3 sentences.',
].join('\n');

// Compact the structured facts into a prompt block so the model rewrites from
// our verified-shape data, not just the noisy page text.
export function proseUserPrompt(facts: unknown, sourceText: string): string {
  return [
    'STRUCTURED FACTS (JSON):',
    JSON.stringify(facts),
    '',
    'SOURCE PAGE TEXT (for detail; rewrite, do not copy):',
    sourceText.slice(0, 6000),
  ].join('\n');
}
