// Backfill ONLY relevant_links + contacts onto EXISTING schemes.
//   npm run backfill-contacts            → every scheme not yet backfilled
//   npm run backfill-contacts -- pm-kisan apy   → just these slugs (force)
//
// This NEVER touches verified eligibility/benefit/prose — it writes only the two
// new jsonb columns. It reads the archived source text and asks the LLM for just
// contacts + links (cheap), then sanitises with the same helpers the pipeline uses.
import { readFile } from 'node:fs/promises';
import { sql } from '../lib/db.ts';
import { callJSON } from '../lib/llm.ts';
import { sanitizeLinks, sanitizeContacts } from '../lib/parse.ts';
import type { JsonSchema } from '../lib/llm.ts';

const db = sql();
const EXTRACTED = (slug: string) => new URL(`../data/extracted/${slug}.json`, import.meta.url);

const SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['relevant_links', 'contacts'],
  properties: {
    relevant_links: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'url'],
        properties: { label: { type: 'string' }, url: { type: 'string' } },
      },
    },
    contacts: {
      type: 'object',
      additionalProperties: false,
      required: ['toll_free', 'phones', 'emails'],
      properties: {
        toll_free: { type: 'array', items: { type: 'string' } },
        phones: { type: 'array', items: { type: 'string' } },
        emails: { type: 'array', items: { type: 'string' } },
      },
    },
  },
};

const SYSTEM = [
  'From the text of an official Indian government scheme page, extract ONLY contact details and official links. NEVER invent anything; copy values exactly as written.',
  'relevant_links: extra official links the text explicitly gives (guidelines, online registration, notification PDF), each {label, url}. Real URLs only. [] if none.',
  'contacts: toll_free = toll-free/helpline numbers (e.g. 1800-xxx, 104, 14555); phones = other phone numbers; emails = email addresses. [] for any with none.',
].join('\n');

const argv = process.argv.slice(2);

const rows = argv.length
  ? await db`select id, slug from schemes where slug = any(${argv}) order by id`
  : await db`
      select id, slug from schemes
      where coalesce(jsonb_array_length(relevant_links), 0) = 0
        and contacts = '{"toll_free":[],"phones":[],"emails":[]}'::jsonb
      order by id`;

console.log(`Backfilling contacts/links for ${rows.length} scheme(s)…\n`);
let updated = 0, skipped = 0, failed = 0;

for (const row of rows) {
  let text = '';
  try {
    text = JSON.parse(await readFile(EXTRACTED(row.slug), 'utf8')).text ?? '';
  } catch {
    /* extracted scratch may be gitignored/absent */
  }
  if (!text) {
    console.log(`skip ${row.slug} (no source text on disk)`);
    skipped++;
    continue;
  }
  try {
    const raw = (await callJSON(SYSTEM, text, 'scheme_contacts', SCHEMA)) as {
      relevant_links?: { label: string; url: string }[];
      contacts?: { toll_free?: string[]; phones?: string[]; emails?: string[] };
    };
    const links = sanitizeLinks(raw.relevant_links ?? []);
    const contacts = sanitizeContacts(raw.contacts ?? {});
    await db`
      update schemes
      set relevant_links = ${db.json(links)}, contacts = ${db.json(contacts)}, updated_at = now()
      where id = ${row.id}`;
    const phones = contacts.toll_free.length + contacts.phones.length;
    console.log(`ok   ${row.slug} — ${links.length} link(s), ${phones} phone(s), ${contacts.emails.length} email(s)`);
    updated++;
  } catch (err) {
    console.log(`FAIL ${row.slug}: ${(err as Error).message}`);
    failed++;
  }
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${failed} failed.`);
await db.end();
