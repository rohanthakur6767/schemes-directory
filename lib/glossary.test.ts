// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findGlossaryTerms } from './glossary.ts';

test('finds DBT and Aadhaar in prose', () => {
  const terms = findGlossaryTerms('Money is sent via DBT to the Aadhaar-linked bank account.');
  const names = terms.map((t) => t.term);
  assert.ok(names.some((n) => n.startsWith('DBT')));
  assert.ok(names.includes('Aadhaar'));
});

test('matches the spelled-out form too', () => {
  const terms = findGlossaryTerms('Paid through Direct Benefit Transfer mode.');
  assert.ok(terms.some((t) => t.term.startsWith('DBT')));
});

test('returns nothing for jargon-free text', () => {
  assert.equal(findGlossaryTerms('A simple grant for everyone.').length, 0);
});

test('does not false-match "SC" inside ordinary words', () => {
  // "science" / "describe" contain "sc" but must not trigger SC/ST/OBC.
  assert.equal(findGlossaryTerms('This describes a science fellowship.').length, 0);
});
