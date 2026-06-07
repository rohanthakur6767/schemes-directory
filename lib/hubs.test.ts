// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, deriveCategoryHubs, deriveStateHubs } from './hubs.ts';
import type { SchemeWithProse } from './types.ts';

test('slugify handles ampersands, spaces, case', () => {
  assert.equal(slugify('Women & Child'), 'women-and-child');
  assert.equal(slugify('Madhya Pradesh'), 'madhya-pradesh');
  assert.equal(slugify('Income Support'), 'income-support');
});

const mk = (over: Partial<SchemeWithProse>): SchemeWithProse =>
  ({
    id: 'x', slug: 'x', name: 'X', level: 'central', state: null,
    categories: ['Health'], benefit: { type: 'service', amount: null, frequency: null },
    eligibility: {}, documents: [], official_url: 'https://x.gov.in',
    source: 's', last_verified: null,
    prose: { name: 'X', summary: 's', eligibility_prose: 'p', benefits_prose: 'p', how_to_apply: 'p' },
    ...over,
  }) as SchemeWithProse;

test('category hubs group multi-category schemes', () => {
  const hubs = deriveCategoryHubs([
    mk({ id: 'a', categories: ['Health', 'Insurance'] }),
    mk({ id: 'b', categories: ['Health'] }),
  ]);
  const health = hubs.find((h) => h.slug === 'health')!;
  assert.equal(health.schemes.length, 2);
  assert.equal(hubs.find((h) => h.slug === 'insurance')!.schemes.length, 1);
});

test('state hubs exclude central schemes (unique content per page)', () => {
  const hubs = deriveStateHubs([
    mk({ id: 'c', state: null }),                 // central → excluded
    mk({ id: 's', level: 'state', state: 'Assam' }),
  ]);
  assert.equal(hubs.length, 1);
  assert.equal(hubs[0].slug, 'assam');
});
