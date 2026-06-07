// Download a batch of NEW scheme PDFs from the bootstrap dataset into data/raw/.
//   Usage: npm run fetch -- 20      (batch size; default 20)
// Picks an even spread across the dataset, skipping anything already downloaded.
import { readdir, mkdir, writeFile } from 'node:fs/promises';

const N = Math.max(1, Number(process.argv[2] ?? 20) || 20);
const RAW = new URL('../data/raw/', import.meta.url);
await mkdir(RAW, { recursive: true });

const existing = new Set(
  (await readdir(RAW)).filter((f) => f.endsWith('.pdf')).map((f) => f.replace(/\.pdf$/, '')),
);

// Paginate the Hugging Face dataset file tree to list every scheme slug.
let next: string | null =
  'https://huggingface.co/api/datasets/shrijayan/gov_myscheme/tree/main/text_data?limit=1000';
const all: string[] = [];
let pages = 0;
while (next && pages < 6) {
  const res: Response = await fetch(next);
  const items = (await res.json()) as { path?: string }[];
  for (const it of items) {
    if (it.path && it.path.endsWith('.pdf')) {
      all.push(it.path.replace(/^text_data\//, '').replace(/\.pdf$/, ''));
    }
  }
  const link: string | null = res.headers.get('link');
  const m: RegExpMatchArray | null = link ? link.match(/<([^>]+)>;\s*rel="next"/) : null;
  next = m ? m[1] : null;
  pages++;
}

const clean = [...new Set(all.filter((s) => !/ copy$/.test(s) && !/\(\d+\)/.test(s)))].sort();
const cand = clean.filter((s) => !existing.has(s));
if (!cand.length) {
  console.log('No new schemes available to download.');
  process.exit(0);
}

const step = Math.max(1, Math.floor(cand.length / N));
const pick: string[] = [];
for (let i = 0; i < cand.length && pick.length < N; i += step) pick.push(cand[i]);

const base = 'https://huggingface.co/datasets/shrijayan/gov_myscheme/resolve/main/text_data/';
let ok = 0;
for (const s of pick) {
  try {
    const r = await fetch(base + s + '.pdf');
    if (!r.ok) continue;
    await writeFile(new URL(`${s}.pdf`, RAW), Buffer.from(await r.arrayBuffer()));
    ok++;
  } catch {
    /* skip failed downloads */
  }
}
console.log(`\nDownloaded ${ok} new scheme PDFs into data/raw/.`);
console.log('Next: npm run extract  →  npm run parse  →  npm run prose  →  npm run import-drafts');
