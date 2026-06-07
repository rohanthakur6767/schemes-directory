import type { MetadataRoute } from 'next';
import { LOCALES } from '@/lib/i18n';
import { SITE_URL } from '@/lib/site';
import { getPublishedSchemes } from '@/lib/schemes';
import { deriveCategoryHubs, deriveStateHubs } from '@/lib/hubs';

// Required for output:'export' — emit a static sitemap.xml at build time.
export const dynamic = 'force-static';

// Generated at build time → static sitemap.xml (works with output:'export').
// Lists every crawlable URL so search engines find the whole directory.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    const base = `${SITE_URL}/${locale}`;
    entries.push(
      { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
      { url: `${base}/schemes/`, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${base}/checker/`, changeFrequency: 'monthly', priority: 0.8 },
    );

    const schemes = await getPublishedSchemes(locale);
    for (const s of schemes) {
      entries.push({
        url: `${base}/schemes/${s.slug}/`,
        lastModified: s.last_verified ?? undefined,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
    for (const h of deriveCategoryHubs(schemes)) {
      entries.push({ url: `${base}/category/${h.slug}/`, changeFrequency: 'weekly', priority: 0.6 });
    }
    for (const h of deriveStateHubs(schemes)) {
      entries.push({ url: `${base}/state/${h.slug}/`, changeFrequency: 'weekly', priority: 0.6 });
    }
  }

  return entries;
}
