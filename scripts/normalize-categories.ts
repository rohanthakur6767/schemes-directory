// One-time (idempotent) fix for D30: rewrite every scheme's categories to the
// canonical vocabulary. Reports any label that didn't map so we can extend it.
//   Run: npm run normalize-categories
import { sql } from '../lib/db.ts';
import { normalizeCategories } from '../lib/categories.ts';

const db = sql();
const rows = await db`select id, categories from schemes order by id`;

const allUnmapped = new Set<string>();
let changed = 0;

for (const r of rows) {
  const { canonical, unmapped } = normalizeCategories(r.categories);
  for (const u of unmapped) allUnmapped.add(u);
  // Don't wipe a scheme to zero categories — if nothing mapped, leave & warn.
  if (canonical.length === 0) {
    console.log(`! ${r.id}: nothing mapped from [${r.categories.join(', ')}] — left unchanged`);
    continue;
  }
  const before = r.categories.join(',');
  const after = canonical.join(',');
  if (before !== after) {
    await db`update schemes set categories = ${canonical}, updated_at = now() where id = ${r.id}`;
    console.log(`  ${r.id}: [${before}] → [${after}]`);
    changed++;
  }
}

console.log(`\nDone: ${changed} schemes updated.`);
if (allUnmapped.size) {
  console.log(`\nUNMAPPED labels (add to lib/categories.ts MAP):`);
  for (const u of [...allUnmapped].sort()) console.log(`  - ${u}`);
}
await db.end();
