// Phase 4c: import parsed+prose drafts into the DB as UNVERIFIED.
//   Run: npm run import-drafts
// Safety: never clobbers a scheme whose translation is already 'published'
// (protects the hand-entered, verified seeds). Drafts land status='llm_unverified',
// review_status='pending', last_verified=null — invisible to the site (D5) until
// the owner approves them in the review tool.
import { readdir, readFile } from 'node:fs/promises';
import { sql } from '../lib/db.ts';
import { EligibilitySchema, BenefitSchema } from '../lib/types.ts';
import { nullifyString, sanitizeLinks, sanitizeContacts } from '../lib/parse.ts';
import { normalizeCategories } from '../lib/categories.ts';

const db = sql(); // lib/db exports a getter; grab the client once.
const PARSED = new URL('../data/parsed/', import.meta.url);
const files = (await readdir(PARSED)).filter((f) => f.endsWith('.json'));

let imported = 0;
let skipped = 0;

for (const file of files) {
  const d = JSON.parse(await readFile(new URL(file, PARSED), 'utf8'));
  const id = d.slug;

  const existing = await db`
    select status from scheme_translations where scheme_id = ${id} and locale = 'en'
  `;
  if (existing.length && existing[0].status === 'published') {
    console.log(`skip ${id} (already published — not clobbering verified data)`);
    skipped++;
    continue;
  }

  // Validate the structured fields at the boundary (D10).
  const eligibility = EligibilitySchema.parse(d.eligibility);
  const benefit = BenefitSchema.parse(d.benefit);
  // Normalise "null"-string quirk + keep level/state consistent for the DB check.
  const state = nullifyString(d.state);
  const level = state !== null ? 'state' : 'central';
  const official_url = nullifyString(d.official_url) ?? `https://www.myscheme.gov.in/schemes/${id}`;
  const categories = normalizeCategories(d.categories).canonical; // controlled vocab (D30)
  // New optional fields — re-sanitise (and default for older parsed files).
  const relevantLinks = sanitizeLinks(d.relevant_links ?? []);
  const contacts = sanitizeContacts(d.contacts ?? {});
  const hasProse = !!d.prose;

  await db`
    insert into schemes (id, slug, name, level, state, categories, benefit, eligibility,
                         documents, official_url, relevant_links, contacts, source,
                         source_snapshot_date, llm_notes, last_verified)
    values (${id}, ${d.slug}, ${d.name}, ${level}, ${state}, ${categories},
            ${db.json(benefit)}, ${db.json(eligibility)}, ${d.documents}, ${official_url},
            ${db.json(relevantLinks)}, ${db.json(contacts)},
            ${d.source}, ${d.source_snapshot_date}, ${d.llm_notes ?? null}, null)
    on conflict (id) do update set
      name = excluded.name, level = excluded.level, state = excluded.state,
      categories = ${categories}, benefit = excluded.benefit,
      eligibility = excluded.eligibility, documents = excluded.documents,
      official_url = excluded.official_url, relevant_links = excluded.relevant_links,
      contacts = excluded.contacts, source = excluded.source,
      source_snapshot_date = excluded.source_snapshot_date, llm_notes = excluded.llm_notes,
      updated_at = now()
  `;

  const applySteps = Array.isArray(d.apply_steps) ? d.apply_steps : [];
  const faqs = Array.isArray(d.faqs) ? d.faqs : [];
  await db`
    insert into scheme_translations (scheme_id, locale, name, summary, eligibility_prose,
                                     benefits_prose, how_to_apply, apply_steps, faqs,
                                     status, review_status)
    values (${id}, 'en', ${d.name}, ${d.prose?.summary ?? ''}, ${d.prose?.eligibility_prose ?? ''},
            ${d.prose?.benefits_prose ?? ''}, ${d.prose?.how_to_apply ?? ''},
            ${db.json(applySteps)}, ${db.json(faqs)},
            ${hasProse ? 'llm_unverified' : 'missing'}, 'pending')
    on conflict (scheme_id, locale) do update set
      name = excluded.name, summary = excluded.summary,
      eligibility_prose = excluded.eligibility_prose, benefits_prose = excluded.benefits_prose,
      how_to_apply = excluded.how_to_apply, apply_steps = excluded.apply_steps,
      faqs = excluded.faqs, status = excluded.status,
      review_status = excluded.review_status, updated_at = now()
  `;
  console.log(`import ${id} (${hasProse ? 'llm_unverified' : 'missing'})`);
  imported++;
}

console.log(`\nDone: ${imported} imported, ${skipped} skipped.`);
await db.end();
