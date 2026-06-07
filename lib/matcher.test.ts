// Run with: npm test   (Node's built-in runner — no jest/vitest, per D10)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchScheme, matchAll, type SchemeIndexEntry } from './matcher.ts';

// Minimal fixtures exercising each criterion type.
const farmerScheme: SchemeIndexEntry = {
  id: 'f', slug: 'f', name: 'Farmer scheme', summary: 's',
  level: 'central', state: null, categories: ['Agriculture'],
  benefit: { type: 'cash', amount: 6000, frequency: 'yearly' },
  eligibility: { occupation: ['farmer'], other_flags: ['owns_cultivable_land'] },
};

const womenMpScheme: SchemeIndexEntry = {
  id: 'm', slug: 'm', name: 'MP women scheme', summary: 's',
  level: 'state', state: 'Madhya Pradesh', categories: ['Women & Child'],
  benefit: { type: 'cash', amount: 18000, frequency: 'yearly' },
  eligibility: {
    gender: 'female', age_min: 21, age_max: 60,
    income_max: 250000, residence_state: ['Madhya Pradesh'],
  },
};

const unconstrained: SchemeIndexEntry = {
  id: 'u', slug: 'u', name: 'Open scheme', summary: 's',
  level: 'central', state: null, categories: ['General'],
  benefit: { type: 'service', amount: null, frequency: null },
  eligibility: {},
};

test('hard criterion violated → ineligible', () => {
  // 70-year-old man vs women-only, age 21–60 scheme
  const r = matchScheme({ age: 70, gender: 'male' }, womenMpScheme);
  assert.equal(r.verdict, 'ineligible');
});

test('all defined criteria pass, no flags → eligible', () => {
  const r = matchScheme(
    { age: 30, gender: 'female', income: 100000, state: 'Madhya Pradesh' },
    womenMpScheme,
  );
  assert.equal(r.verdict, 'eligible');
  assert.ok(r.reasons.length >= 4);
  assert.equal(r.toConfirm.length, 0);
});

test('other_flags always become "to confirm" → maybe', () => {
  // Matches occupation, but the scheme has an unaskable flag.
  const r = matchScheme({ occupation: ['farmer'] }, farmerScheme);
  assert.equal(r.verdict, 'maybe');
  assert.ok(r.toConfirm.some((t) => t.includes('cultivable land')));
});

test('unanswered question → unknown, not fail → maybe', () => {
  // Female + right state, but age not provided.
  const r = matchScheme({ gender: 'female', state: 'Madhya Pradesh' }, womenMpScheme);
  assert.equal(r.verdict, 'maybe');
  assert.ok(r.toConfirm.some((t) => t.includes('Age must be')));
});

test('income above ceiling → ineligible', () => {
  const r = matchScheme(
    { age: 30, gender: 'female', income: 999999, state: 'Madhya Pradesh' },
    womenMpScheme,
  );
  assert.equal(r.verdict, 'ineligible');
});

test('scheme with no constraints → eligible for an empty profile', () => {
  const r = matchScheme({}, unconstrained);
  assert.equal(r.verdict, 'eligible');
});

test('wrong-state resident → that state scheme is excluded', () => {
  const r = matchScheme(
    { age: 30, gender: 'female', income: 100000, state: 'Bihar' },
    womenMpScheme,
  );
  assert.equal(r.verdict, 'ineligible');
});

test('matchAll ranks eligible before maybe, then by benefit amount', () => {
  const profile = { occupation: ['farmer'] }; // farmer=maybe, unconstrained=eligible
  const ranked = matchAll(profile, [farmerScheme, unconstrained]);
  assert.equal(ranked[0].scheme.id, 'u'); // eligible first
  assert.equal(ranked[1].scheme.id, 'f'); // maybe second
});
