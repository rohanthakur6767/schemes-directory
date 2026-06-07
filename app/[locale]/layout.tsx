import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { LOCALES, type Locale } from '@/lib/i18n';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import '../globals.css';

// Static export (D1): every locale is pre-rendered at build time; any other
// value in the [locale] segment is a build-time 404, not a runtime fallback.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  // Base for all relative canonical/hreflang URLs in generateMetadata calls.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Indian Government Schemes Directory`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Find central and state government schemes in India you may be eligible for. ' +
    'Original, verified summaries with links to official sources.',
};

// This IS the root layout — it lives inside [locale] (standard i18n pattern)
// so <html lang> is correct per locale. There is deliberately no app/layout.tsx.
export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  // Route params arrive as plain strings — the router can't know our locale
  // union. dynamicParams=false guarantees only generateStaticParams values
  // reach here, so narrowing to Locale below is safe.
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  return (
    <html lang={locale}>
      <body>
        <nav className="site-nav">
          <a href={`/${locale}/`}>{SITE_NAME}</a>
          <a href={`/${locale}/schemes/`}>Browse schemes</a>
          <a href={`/${locale}/checker/`}>Eligibility checker</a>
        </nav>
        <main>{children}</main>
        {/* §2: site-wide disclaimer + attribution, required from day one. */}
        <footer>
          <p>
            {SITE_NAME} is an independent informational website. We are not
            affiliated with, or endorsed by, the Government of India or any
            state government. Scheme details can change — always verify on the
            official source linked on each page before applying.
          </p>
          <p>
            Data compiled from official government sources (Open Government
            Data licence — GODL-India), rewritten and verified by us.
          </p>
        </footer>
      </body>
    </html>
  );
}
