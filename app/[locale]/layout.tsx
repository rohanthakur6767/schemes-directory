import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { LOCALES, type Locale } from '@/lib/i18n';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import SearchBox from '@/components/SearchBox';
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
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_IN',
  },
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
        <header className="site-header">
          <nav className="site-nav container">
            <a className="brand" href={`/${locale}/`}>{SITE_NAME}</a>
            <a href={`/${locale}/schemes/`}>Browse</a>
            <a href={`/${locale}/checker/`}>Checker</a>
            <div className="nav-search">
              <SearchBox locale={locale} variant="nav" />
            </div>
          </nav>
        </header>
        <main className="container">{children}</main>
        {/* §2: site-wide disclaimer + attribution, required from day one. */}
        <footer className="site-footer">
          <div className="footer-inner container">
            <nav className="footer-links">
              <a href={`/${locale}/about/`}>About</a>
              <a href={`/${locale}/privacy/`}>Privacy Policy</a>
              <a href={`/${locale}/disclaimer/`}>Disclaimer</a>
              <a href={`/${locale}/contact/`}>Contact</a>
            </nav>
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
          </div>
        </footer>
      </body>
    </html>
  );
}
