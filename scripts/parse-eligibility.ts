// Phase 4b: cleaned text → structured fields via the LLM, flagged 'unverified'.
//   Run: npm run parse              (all extracted schemes)
//        npm run parse pm-kisan     (one slug)
// For pm-kisan it also diffs the LLM output against our hand-entered ground
// truth in data/seed.ts — a free accuracy check on a scheme we already know.
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { callJSON } from '../lib/llm.ts';
import { EXTRACTION_SCHEMA, SYSTEM_PROMPT, toParsedScheme } from '../lib/parse.ts';
import { SEED_SCHEMES } from '../data/seed.ts';

const IN = new URL('../data/extracted/', import.meta.url);
const OUT = new URL('../data/parsed/', import.meta.url);
await mkdir(OUT, { recursive: true });

const argv = process.argv.slice(2);
const all = (await readdir(IN)).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
// No args → INCREMENTAL: parse only schemes not already parsed (skip re-LLM cost).
// Pass slugs explicitly to force re-parsing those (e.g. after a prompt change).
const done = new Set(
  (await readdir(OUT)).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')),
);
const slugs = argv.length ? argv : all.filter((s) => !done.has(s));
if (!slugs.length) console.log('Nothing new to parse (all extracted schemes already parsed).');

for (const slug of slugs) {
  const src = JSON.parse(await readFile(new URL(`${slug}.json`, IN), 'utf8'));
  process.stdout.write(`Parsing ${slug}… `);

  let parsed;
  try {
    const raw = await callJSON(SYSTEM_PROMPT, src.text, 'scheme_extraction', EXTRACTION_SCHEMA);
    parsed = toParsedScheme(raw);
  } catch (err) {
    console.log(`FAILED: ${(err as Error).message}`);
    continue;
  }

  const record = {
    slug,
    ...parsed,
    source: src.source,
    source_snapshot_date: src.source_snapshot_date,
    status: 'unverified', // facts NOT verified; prose not written. Never published as-is.
  };
  await writeFile(new URL(`${slug}.json`, OUT), JSON.stringify(record, null, 2));
  console.log('ok');
  console.log('  eligibility:', JSON.stringify(parsed.eligibility));
  console.log('  benefit:', JSON.stringify(parsed.benefit));
  if (parsed.notes) console.log('  notes:', parsed.notes);

  // Ground-truth diff for any slug we also hand-entered.
  const truth = SEED_SCHEMES.find((s) => s.slug === slug);
  if (truth) {
    console.log('  — vs hand-entered ground truth —');
    console.log('  truth eligibility:', JSON.stringify(truth.eligibility));
    console.log('  truth benefit:    ', JSON.stringify(truth.benefit));
  }
}
