import { sql } from './db';
import {
  ProseSchema,
  SchemeSchema,
  type SchemeWithProse,
} from './types';
import type { Locale } from './i18n';

// ---------------------------------------------------------------------------
// THE D5 GATE LIVES HERE: every site-facing query joins on status='published'.
// Unreviewed prose isn't "filtered out by the UI" — it never leaves the DB.
// (From Phase 4, schemes with verified facts but unpublished prose will get a
// structured-facts-only rendering; that will be an explicit second query, not
// a loosening of this one.)
// ---------------------------------------------------------------------------

const SELECT = `
  select
    s.id, s.slug, s.name, s.level, s.state, s.categories,
    s.benefit, s.eligibility, s.documents, s.official_url, s.source,
    s.last_verified::text as last_verified,
    t.name as t_name, t.summary, t.eligibility_prose, t.benefits_prose, t.how_to_apply
  from schemes s
  join scheme_translations t
    on t.scheme_id = s.id and t.locale = $1 and t.status = 'published'
`;

export async function getPublishedSchemes(locale: Locale): Promise<SchemeWithProse[]> {
  const rows = await sql().unsafe(`${SELECT} order by s.name`, [locale]);
  return rows.map(parseRow);
}

export async function getPublishedScheme(
  locale: Locale,
  slug: string,
): Promise<SchemeWithProse | null> {
  const rows = await sql().unsafe(`${SELECT} where s.slug = $2 limit 1`, [locale, slug]);
  return rows.length ? parseRow(rows[0]) : null;
}

// Zod at the boundary (D10): a malformed row fails the BUILD, never the page.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRow(r: any): SchemeWithProse {
  const scheme = SchemeSchema.parse({
    id: r.id,
    slug: r.slug,
    name: r.name,
    level: r.level,
    state: r.state,
    categories: r.categories,
    benefit: r.benefit,
    eligibility: r.eligibility,
    documents: r.documents,
    official_url: r.official_url,
    source: r.source,
    last_verified: r.last_verified,
  });
  const prose = ProseSchema.parse({
    name: r.t_name,
    summary: r.summary,
    eligibility_prose: r.eligibility_prose,
    benefits_prose: r.benefits_prose,
    how_to_apply: r.how_to_apply,
  });
  return { ...scheme, prose };
}
