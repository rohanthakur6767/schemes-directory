// Upsert the hand-entered seed schemes. Run with:  npm run db:seed
// Idempotent: re-running updates rows in place (ON CONFLICT DO UPDATE), so
// fact corrections are just "edit data/seed.ts, run again".
import postgres from 'postgres';
import { SEED_SCHEMES } from '../data/seed.ts';
import { ProseSchema, SchemeSchema } from '../lib/types.ts';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set. Run via `npm run db:seed` (loads .env).');
  process.exit(1);
}

const sql = postgres(url, {
  max: 1,
  ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require',
});

let count = 0;
for (const seed of SEED_SCHEMES) {
  // Validate at the boundary (D10): a typo'd enum or malformed URL in seed
  // data must fail HERE with a precise error, not surface as a broken page.
  const { en, ...scheme } = seed;
  SchemeSchema.parse(scheme);
  ProseSchema.parse(en);

  await sql`
    insert into schemes (id, slug, name, level, state, categories, benefit, eligibility,
                         documents, official_url, source, last_verified)
    values (${scheme.id}, ${scheme.slug}, ${scheme.name}, ${scheme.level}, ${scheme.state},
            ${scheme.categories}, ${sql.json(scheme.benefit)}, ${sql.json(scheme.eligibility)},
            ${scheme.documents}, ${scheme.official_url}, ${scheme.source}, ${scheme.last_verified})
    on conflict (id) do update set
      slug = excluded.slug, name = excluded.name, level = excluded.level,
      state = excluded.state, categories = excluded.categories,
      benefit = excluded.benefit, eligibility = excluded.eligibility,
      documents = excluded.documents, official_url = excluded.official_url,
      source = excluded.source, last_verified = excluded.last_verified,
      updated_at = now()
  `;

  // Seed prose is human-written (by us, original) → 'published' directly.
  // LLM-generated prose (Phase 5) NEVER takes this path; it lands 'llm_unverified'.
  await sql`
    insert into scheme_translations (scheme_id, locale, name, summary, eligibility_prose,
                                     benefits_prose, how_to_apply, status)
    values (${scheme.id}, 'en', ${en.name}, ${en.summary}, ${en.eligibility_prose},
            ${en.benefits_prose}, ${en.how_to_apply}, 'published')
    on conflict (scheme_id, locale) do update set
      name = excluded.name, summary = excluded.summary,
      eligibility_prose = excluded.eligibility_prose,
      benefits_prose = excluded.benefits_prose,
      how_to_apply = excluded.how_to_apply,
      status = excluded.status, updated_at = now()
  `;
  count++;
}

console.log(`Seeded ${count} schemes (en, published — hand-written prose).`);
await sql.end();
