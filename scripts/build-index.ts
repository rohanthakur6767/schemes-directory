// Build-time index generator. Emits public/index/<locale>/schemes.json — the
// small, matchable, PROSE-FREE dataset the browser uses for the checker (Phase 2)
// and faceted search (Phase 3). Runs automatically as npm `prebuild`.
import { mkdir, writeFile } from 'node:fs/promises';
import { LOCALES } from '../lib/i18n.ts';
import { getPublishedSchemes } from '../lib/schemes.ts';
import { deriveBeneficiaries } from '../lib/facets.ts';
import { sql } from '../lib/db.ts';

for (const locale of LOCALES) {
  const schemes = await getPublishedSchemes(locale);
  // Same D5 gate as the pages: only published schemes are matchable, so the
  // checker can never point a user at a scheme that has no live page.
  const index = schemes.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.prose.name,
    summary: s.prose.summary,
    level: s.level,
    state: s.state,
    categories: s.categories,
    benefit: s.benefit,
    eligibility: s.eligibility,
    // Derived facet for the browse page (D21). Computed once, here.
    beneficiaries: deriveBeneficiaries(s.eligibility),
  }));
  const dir = new URL(`../public/index/${locale}/`, import.meta.url);
  await mkdir(dir, { recursive: true });
  await writeFile(new URL('schemes.json', dir), JSON.stringify(index));
  console.log(`Index: ${index.length} schemes → public/index/${locale}/schemes.json`);
}

await sql().end();
