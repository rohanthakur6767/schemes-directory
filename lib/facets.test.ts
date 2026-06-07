// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveBeneficiaries,
  filterEntries,
  facetOptions,
  paramsToSelection,
  selectionToParams,
  emptySelection,
  CENTRAL_LABEL,
  type FacetEntry,
} from './facets.ts';

const make = (over: Partial<FacetEntry>): FacetEntry => ({
  id: 'x', slug: 'x', name: 'X', summary: 's',
  level: 'central', state: null, categories: ['General'],
  benefit: { type: 'service', amount: null, frequency: null },
  eligibility: {},
  beneficiaries: ['General Public'],
  ...over,
});

const central = make({ id: 'c', state: null, categories: ['Health'], beneficiaries: ['Senior Citizens'] });
const mpWomen = make({ id: 'm', level: 'state', state: 'Madhya Pradesh', categories: ['Women & Child'], beneficiaries: ['Women & Girls'] });
const wbGirl = make({ id: 'w', level: 'state', state: 'West Bengal', categories: ['Women & Child', 'Education'], beneficiaries: ['Women & Girls', 'Children'] });
const ALL = [central, mpWomen, wbGirl];

test('deriveBeneficiaries maps structured eligibility', () => {
  assert.deepEqual(deriveBeneficiaries({ gender: 'female', age_max: 9 }), ['Children', 'Women & Girls']);
  assert.deepEqual(deriveBeneficiaries({ occupation: ['farmer'] }), ['Farmers']);
  assert.deepEqual(deriveBeneficiaries({}), ['General Public']);
  assert.ok(deriveBeneficiaries({ other_flags: ['x_age_70_plus'] }).includes('Senior Citizens'));
});

test('empty selection returns everything', () => {
  assert.equal(filterEntries(ALL, emptySelection()).length, 3);
});

test('state is a property filter — MP shows only MP schemes (D20)', () => {
  const r = filterEntries(ALL, { ...emptySelection(), state: ['Madhya Pradesh'] });
  assert.deepEqual(r.map((e) => e.id), ['m']);
});

test('OR within a group', () => {
  const r = filterEntries(ALL, { ...emptySelection(), state: ['Madhya Pradesh', 'West Bengal'] });
  assert.deepEqual(r.map((e) => e.id).sort(), ['m', 'w']);
});

test('AND across groups', () => {
  const r = filterEntries(ALL, {
    state: ['West Bengal'],
    category: ['Education'],
    beneficiary: [],
  });
  assert.deepEqual(r.map((e) => e.id), ['w']);
});

test('central scheme uses the Central label for state', () => {
  const opts = facetOptions(ALL, emptySelection(), 'state');
  const central = opts.find((o) => o.value === CENTRAL_LABEL);
  assert.equal(central?.count, 1);
});

test('facet counts respect OTHER groups but not their own group', () => {
  // Select state = West Bengal; category counts should reflect only WB entries.
  const sel = { ...emptySelection(), state: ['West Bengal'] };
  const cats = facetOptions(ALL, sel, 'category');
  assert.equal(cats.find((o) => o.value === 'Education')?.count, 1);
  assert.equal(cats.find((o) => o.value === 'Health')?.count, 0); // Health is central-only
  // State options ignore the state selection itself → all three states still counted.
  const states = facetOptions(ALL, sel, 'state');
  assert.equal(states.find((o) => o.value === 'Madhya Pradesh')?.count, 1);
});

test('URL round-trips a selection', () => {
  const sel = { state: ['Madhya Pradesh'], category: ['Women & Child'], beneficiary: [] };
  const round = paramsToSelection(selectionToParams(sel));
  assert.deepEqual(round, { state: ['Madhya Pradesh'], category: ['Women & Child'], beneficiary: [] });
});
