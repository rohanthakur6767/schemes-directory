import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { slugify } from './hubs.ts';

// Resolve a category label → its icon in /public/images/category_icon/thumb
// (build-time, static export). Categories without an image fall back to the
// emoji from categoryIcons.ts in the UI.
const DIR = join(process.cwd(), 'public', 'images', 'category_icon', 'thumb');

// Short / variant filenames → the canonical category slug (slugify of the label).
const ALIAS: Record<string, string> = {
  agri: 'agriculture',
  startup: 'business-and-startup',
  'utility-energy': 'utility-and-energy',
  'social-wellfare': 'social-welfare',
  'women-child': 'women-and-child',
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
      cache[key] = `/images/category_icon/thumb/${f}`;
    }
  } catch {
    /* directory missing → no images, everything falls back to the emoji */
  }
  return cache;
}

export function categoryImage(label: string): string | null {
  return map()[slugify(label)] ?? null;
}
