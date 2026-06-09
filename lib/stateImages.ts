import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { slugify } from './hubs.ts';

// Resolve a state name → its CM thumbnail in /public/images/cms/thumb (build-time,
// static export). States without an image fall back to a monogram in the UI.
const DIR = join(process.cwd(), 'public', 'images', 'cms', 'thumb');

// Misspelled / variant filenames → the canonical state slug we use.
const ALIAS: Record<string, string> = {
  maharastra: 'maharashtra',
  uttrakhand: 'uttarakhand',
  'adman-and-nicobar': 'andaman-and-nicobar-islands',
  'j-and-k': 'jammu-and-kashmir',
};

let cache: Record<string, string> | null = null;
function map(): Record<string, string> {
  if (cache) return cache;
  cache = {};
  try {
    for (const f of readdirSync(DIR)) {
      if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
      let key = slugify(f.replace(/\.[^.]+$/, ''));
      key = ALIAS[key] ?? key;
      cache[key] = `/images/cms/thumb/${f}`;
    }
  } catch {
    /* directory missing → no images, everything falls back to monograms */
  }
  return cache;
}

export function stateImage(stateName: string): string | null {
  return map()[slugify(stateName)] ?? null;
}
