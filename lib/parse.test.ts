// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sparsifyEligibility, toParsedScheme } from './parse.ts';

const full = {
  age_min: null, age_max: null, income_max: null, gender: 'any' as const,
  occupation: [] as string[], caste: [] as ('GEN'|'OBC'|'SC'|'ST')[],
  residence_state: [] as string[], other_flags: [] as string[],
};

test('sparsify drops nulls / any / empty arrays', () => {
  assert.deepEqual(sparsifyEligibility(full), {});
});

test('sparsify keeps real constraints', () => {
  const e = sparsifyEligibility({
    ...full, age_min: 18, age_max: 40, gender: 'female', occupation: ['farmer'],
  });
  assert.deepEqual(e, { age_min: 18, age_max: 40, gender: 'female', occupation: ['farmer'] });
});

test('toParsedScheme validates the full LLM shape and converts it', () => {
  const raw = {
    name: 'Test Scheme', level: 'central', state: null, categories: ['Health'],
    benefit: { type: 'cash', amount: 6000, frequency: 'yearly', note: null },
    eligibility: { ...full, occupation: ['farmer'], other_flags: ['not_income_tax_payer'] },
    documents: ['Aadhaar'], official_url: 'https://x.gov.in', notes: 'looks fine',
  };
  const p = toParsedScheme(raw);
  assert.equal(p.benefit.amount, 6000);
  assert.equal(p.benefit.note, undefined); // null note dropped
  assert.deepEqual(p.eligibility, { occupation: ['farmer'], other_flags: ['not_income_tax_payer'] });
});

test('toParsedScheme rejects a malformed LLM object', () => {
  assert.throws(() => toParsedScheme({ name: 'x' }));
});
