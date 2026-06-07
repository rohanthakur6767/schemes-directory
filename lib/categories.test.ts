// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCategories, CANONICAL_CATEGORIES } from './categories.ts';

test('drifted loan labels collapse to one canonical "Loan"', () => {
  const { canonical } = normalizeCategories(['loan', 'loans', 'loan-subsidy']);
  assert.deepEqual(canonical, ['Loan']);
});

test('maps mixed real labels and dedupes', () => {
  const { canonical } = normalizeCategories(['Income Support', 'Financial Security', 'Health']);
  assert.deepEqual(canonical.sort(), ['Financial Assistance', 'Health']);
});

test('tech/research/infrastructure → Education', () => {
  const { canonical } = normalizeCategories(['technology', 'research', 'technical education']);
  assert.deepEqual(canonical, ['Education']);
});

test('already-canonical labels pass through', () => {
  const { canonical, unmapped } = normalizeCategories(['Agriculture', 'Pension']);
  assert.deepEqual(canonical, ['Agriculture', 'Pension']);
  assert.equal(unmapped.length, 0);
});

test('unknown labels are reported, not dropped silently', () => {
  const { canonical, unmapped } = normalizeCategories(['Health', 'Quantum Teleportation']);
  assert.deepEqual(canonical, ['Health']);
  assert.deepEqual(unmapped, ['Quantum Teleportation']);
});

test('canonical list is the ~16 expected size', () => {
  assert.equal(CANONICAL_CATEGORIES.length, 16);
});
