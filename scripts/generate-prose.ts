// Phase 5a: write ORIGINAL prose drafts for parsed schemes. Reads data/parsed/
// + data/extracted/, calls PROSE_MODEL, writes a `prose` block back into the
// parsed JSON. Always a DRAFT (llm_unverified) — never published unread (D5).
//   Run: npm run prose            (all parsed)
//        npm run prose aaby       (one slug)
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { callJSON } from '../lib/llm.ts';
import { PROSE_SCHEMA, PROSE_SYSTEM, ProseResultSchema, proseUserPrompt } from '../lib/prose.ts';

const PARSED = new URL('../data/parsed/', import.meta.url);
const EXTRACTED = new URL('../data/extracted/', import.meta.url);

const argv = process.argv.slice(2);
const all = (await readdir(PARSED)).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
const slugs = argv.length ? argv : all;

for (const slug of slugs) {
  const parsed = JSON.parse(await readFile(new URL(`${slug}.json`, PARSED), 'utf8'));
  const src = JSON.parse(await readFile(new URL(`${slug}.json`, EXTRACTED), 'utf8'));
  process.stdout.write(`Prose ${slug}… `);

  const facts = {
    name: parsed.name, level: parsed.level, state: parsed.state,
    categories: parsed.categories, benefit: parsed.benefit,
    eligibility: parsed.eligibility, documents: parsed.documents,
  };
  try {
    const raw = await callJSON(PROSE_SYSTEM, proseUserPrompt(facts, src.text), 'scheme_prose', PROSE_SCHEMA);
    const r = ProseResultSchema.parse(raw);
    parsed.prose = {
      summary: r.summary,
      eligibility_prose: r.eligibility_prose,
      benefits_prose: r.benefits_prose,
      how_to_apply: r.how_to_apply,
    };
    parsed.apply_steps = r.apply_steps;
    parsed.faqs = r.faqs.map((f) => ({ q: f.question, a: f.answer })); // store as {q,a}
    await writeFile(new URL(`${slug}.json`, PARSED), JSON.stringify(parsed, null, 2));
    console.log(`ok — ${r.apply_steps.length} steps, ${r.faqs.length} FAQs — ${r.summary}`);
  } catch (err) {
    console.log(`FAILED: ${(err as Error).message}`);
  }
}
