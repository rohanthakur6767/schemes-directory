// Phase 5b: the REVIEW TOOL (owner directive D6 — first-class UX).
// A LOCAL-ONLY server (never deployed — the public site is a static export, D1).
// Reads/writes Neon directly; serves a keyboard-driven side-by-side UI.
//   Run: npm run review   →   http://localhost:5174
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { sql } from '../lib/db.ts';
import { EligibilitySchema, BenefitSchema } from '../lib/types.ts';
import { CANONICAL_CATEGORIES } from '../lib/categories.ts';

const db = sql();
const PORT = 5174;
const HTML = new URL('./review.html', import.meta.url);
const EXTRACTED = (slug: string) => new URL(`../data/extracted/${slug}.json`, import.meta.url);

const today = () => new Date().toISOString().slice(0, 10);

async function counts() {
  const [r] = await db`
    select
      count(*) filter (where review_status = 'pending')   as pending,
      count(*) filter (where status = 'published')        as published,
      count(*) filter (where review_status = 'rejected')  as rejected
    from scheme_translations where locale = 'en'`;
  return { pending: Number(r.pending), published: Number(r.published), rejected: Number(r.rejected) };
}

// Next draft awaiting review (oldest id first → stable order).
async function nextItem() {
  const [row] = await db`
    select s.id, s.slug, s.name, s.level, s.state, s.categories, s.benefit, s.eligibility,
           s.documents, s.official_url, s.source, s.source_snapshot_date::text, s.llm_notes,
           t.summary, t.eligibility_prose, t.benefits_prose, t.how_to_apply
    from schemes s
    join scheme_translations t on t.scheme_id = s.id and t.locale = 'en'
    where t.review_status = 'pending'
    order by s.id limit 1`;
  if (!row) return null;
  let source_text = '';
  try {
    source_text = JSON.parse(await readFile(EXTRACTED(row.slug), 'utf8')).text ?? '';
  } catch {
    /* extracted scratch may be absent (gitignored) — link still works */
  }
  return { ...row, source_text };
}

// Persist editor changes to both tables. Zod-validates the structured fields.
async function save(b: any, publish: boolean) {
  const eligibility = EligibilitySchema.parse(b.eligibility);
  const benefit = BenefitSchema.parse(b.benefit);
  const state = b.state || null;
  const level = state ? 'state' : 'central';

  await db`
    update schemes set
      name = ${b.name}, level = ${level}, state = ${state},
      categories = ${b.categories}, benefit = ${db.json(benefit)},
      eligibility = ${db.json(eligibility)}, documents = ${b.documents},
      official_url = ${b.official_url},
      last_verified = ${publish ? today() : null},
      updated_at = now()
    where id = ${b.id}`;

  await db`
    update scheme_translations set
      name = ${b.name}, summary = ${b.summary}, eligibility_prose = ${b.eligibility_prose},
      benefits_prose = ${b.benefits_prose}, how_to_apply = ${b.how_to_apply},
      status = ${publish ? 'published' : 'llm_unverified'},
      review_status = ${publish ? 'published' : 'pending'},
      updated_at = now()
    where scheme_id = ${b.id} and locale = 'en'`;
}

async function reject(id: string) {
  await db`update scheme_translations set review_status = 'rejected', updated_at = now()
           where scheme_id = ${id} and locale = 'en'`;
}

function readBody(req: import('node:http').IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
  });
}

const json = (res: import('node:http').ServerResponse, code: number, body: unknown) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url!, `http://localhost:${PORT}`);
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(await readFile(HTML, 'utf8'));
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/next') {
      json(res, 200, { item: await nextItem(), counts: await counts(), categoryVocab: CANONICAL_CATEGORIES });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/save') {
      await save(await readBody(req), false);
      json(res, 200, { ok: true, counts: await counts() });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/publish') {
      await save(await readBody(req), true);
      json(res, 200, { ok: true, item: await nextItem(), counts: await counts(), categoryVocab: CANONICAL_CATEGORIES });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/reject') {
      await reject((await readBody(req)).id);
      json(res, 200, { ok: true, item: await nextItem(), counts: await counts() });
      return;
    }
    json(res, 404, { error: 'not found' });
  } catch (err) {
    json(res, 400, { error: (err as Error).message });
  }
});

server.listen(PORT, () => {
  console.log(`\n  Review tool → http://localhost:${PORT}\n  (Ctrl+C to stop. Writes directly to Neon.)\n`);
});
