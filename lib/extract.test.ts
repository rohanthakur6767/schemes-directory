// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fixMojibake,
  stripChrome,
  collapseWhitespace,
  cleanText,
  extractSnapshotDate,
  slugFromFilename,
} from './extract.ts';

test('fixMojibake repairs the rupee sign (cp1252 mis-decode)', () => {
  assert.equal(fixMojibake('â‚¹ 6000'), '₹ 6000');
});

test('fixMojibake repairs a curly apostrophe', () => {
  assert.equal(fixMojibake('farmersâ€™ families'), 'farmers’ families');
});

test('fixMojibake leaves clean text untouched (no false positives)', () => {
  assert.equal(fixMojibake('Plain ASCII, ₹6000, café'), 'Plain ASCII, ₹6000, café');
});

test('stripChrome removes known boilerplate', () => {
  const s = 'KeepThisSomething went wrong. Please try again later.OkAnd this';
  assert.equal(stripChrome(s).includes('went wrong'), false);
  assert.ok(stripChrome(s).includes('KeepThis'));
});

test('collapseWhitespace normalises runs', () => {
  assert.equal(collapseWhitespace('a   b\n\t c '), 'a b c');
});

test('cleanText chains fix → strip → collapse', () => {
  const raw = 'â‚¹ 6000  Was this helpful?  per year';
  assert.equal(cleanText(raw), '₹ 6000 per year');
});

test('extractSnapshotDate parses dd/mm/yyyy to ISO', () => {
  assert.equal(extractSnapshotDate('foo Last Updated On : 28/03/2024 | v-2.1.1'), '2024-03-28');
  assert.equal(extractSnapshotDate('no date here'), null);
});

test('slugFromFilename strips path, extension and " copy"', () => {
  assert.equal(slugFromFilename('data/raw/pm-kisan.pdf'), 'pm-kisan');
  assert.equal(slugFromFilename('C:\\x\\pm-svanidhi copy.pdf'), 'pm-svanidhi');
});
