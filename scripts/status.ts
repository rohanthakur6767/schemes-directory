import { sql } from '../lib/db.ts';
const db = sql();
const rows = await db`
  select s.slug, t.status, t.review_status, s.last_verified::text as lv
  from schemes s join scheme_translations t on t.scheme_id = s.id and t.locale = 'en'
  order by t.status, s.slug`;
let pub = 0, pend = 0, rej = 0;
for (const r of rows) {
  if (r.status === 'published') pub++;
  if (r.review_status === 'pending') pend++;
  if (r.review_status === 'rejected') rej++;
}
console.log(`PUBLISHED=${pub}  PENDING=${pend}  REJECTED=${rej}\n`);
for (const r of rows) {
  const mark = r.status === 'published' ? '✓' : ' ';
  console.log(`${mark} ${r.slug.padEnd(26)} ${r.status.padEnd(15)} review=${r.review_status} verified=${r.lv ?? '-'}`);
}
await db.end();
