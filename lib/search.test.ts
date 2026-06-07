// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchSchemes, type SearchableScheme } from './search.ts';

const data: SearchableScheme[] = [
  { slug: 'pm-kisan', name: 'PM-KISAN', summary: 'Income support for landholding farmers.', categories: ['Agriculture', 'Financial Assistance'], state: null },
  { slug: 'nmms', name: 'National Means-cum-Merit Scholarship', summary: 'Scholarship for class 9–12 students.', categories: ['Scholarship', 'Education'], state: null },
  { slug: 'ladli', name: 'Ladli Behna Yojana', summary: 'Monthly support for women.', categories: ['Women & Child'], state: 'Madhya Pradesh' },
];

test('empty query returns nothing', () => {
  assert.equal(searchSchemes(data, '').length, 0);
  assert.equal(searchSchemes(data, '   ').length, 0);
});

test('matches by name', () => {
  const r = searchSchemes(data, 'kisan');
  assert.equal(r[0].slug, 'pm-kisan');
});

test('matches by category keyword', () => {
  const r = searchSchemes(data, 'scholarship');
  assert.ok(r.some((s) => s.slug === 'nmms'));
});

test('matches by summary keyword', () => {
  const r = searchSchemes(data, 'farmers');
  assert.equal(r[0].slug, 'pm-kisan');
});

test('multi-term AND: both terms must appear', () => {
  assert.equal(searchSchemes(data, 'women madhya').length, 1); // ladli (state + summary)
  assert.equal(searchSchemes(data, 'women farmers').length, 0); // no single scheme has both
});

test('name prefix ranks above incidental matches', () => {
  const r = searchSchemes(data, 'national');
  assert.equal(r[0].slug, 'nmms');
});

test('no match returns empty', () => {
  assert.equal(searchSchemes(data, 'spaceship').length, 0);
});
