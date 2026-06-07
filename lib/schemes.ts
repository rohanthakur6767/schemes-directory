import { sql } from './db.ts';
import {
  ProseSchema,
  SchemeSchema,
  ApplyStepsSchema,
  FaqsSchema,
  type SchemeWithProse,
} from './types.ts';
import type { Locale } from './i18n.ts';

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
    t.name as t_name, t.summary, t.eligibility_prose, t.benefits_prose, t.how_to_apply,
    t.apply_steps, t.faqs
  from schemes s
  join scheme_translations t
    on t.scheme_id = s.id and t.locale = $1 and t.status = 'published'
`;

export async function getPublishedSchemes(locale: Locale): Promise<SchemeWithProse[]> {
  const rows = await sql().unsafe(`${SELECT} order by s.name`, [locale]);
  // Resilience (D39): a single malformed published row must NOT crash the whole
  // static build/deploy. Skip it with a loud warning; the rest of the site ships.
  // (The review tool validates on publish, so this is a backstop, not the norm.)
  const out: SchemeWithProse[] = [];
  for (const r of rows) {
    try {
      out.push(parseRow(r));
    } catch (err) {
      console.warn(`[build] SKIPPED published scheme "${r.slug}" — invalid data: ${(err as Error).message}`);
    }
  }
  return out;
}

export async function getPublishedScheme(
  locale: Locale,
  slug: string,
): Promise<SchemeWithProse | null> {
  const rows = await sql().unsafe(`${SELECT} where s.slug = $2 limit 1`, [locale, slug]);
  if (!rows.length) return null;
  try {
    return parseRow(rows[0]);
  } catch (err) {
    console.warn(`[build] scheme "${slug}" has invalid data: ${(err as Error).message}`);
    return null;
  }
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
  // jsonb arrives already parsed; validate with defaults so old rows are fine.
  const apply_steps = ApplyStepsSchema.parse(r.apply_steps ?? []);
  const faqs = FaqsSchema.parse(r.faqs ?? []);
  return { ...scheme, prose, apply_steps, faqs };
}
