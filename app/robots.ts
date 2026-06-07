import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Required for output:'export' — emit a static robots.txt.
export const dynamic = 'force-static';

// Generated at build → static robots.txt. Allow everything; point crawlers at
// the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
