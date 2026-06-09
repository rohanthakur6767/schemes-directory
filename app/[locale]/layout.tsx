import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Hanken_Grotesk, Hind } from 'next/font/google';
import { LOCALES, type Locale } from '@/lib/i18n';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import SearchBox from '@/components/SearchBox';
import Logo from '@/components/Logo';
import '../globals.css';

// Design tokens — typography. Fraunces (display, allows italic), Hanken Grotesk
// (body/UI), Hind (Devanagari for the Hindi phase). Exposed as CSS variables and
// referenced in globals.css. next/font self-hosts these, so static export is fine.
const fraunces = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-display' });
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body' });
const hind = Hind({ subsets: ['latin', 'devanagari'], weight: ['400', '500', '600', '700'], variable: '--font-hindi' });

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
  // Wordmark: highlight the last word ("India") in green per the theme spec.
  const words = SITE_NAME.split(' ');
  const brandHead = words.slice(0, -1).join(' ');
  const brandTail = words[words.length - 1];
  return (
    <html lang={locale} className={`${fraunces.variable} ${hanken.variable} ${hind.variable}`}>
      <body>
        <header className="site-header">
          <nav className="site-nav container">
            <a className="brand" href={`/${locale}/`}>
              <Logo />
              <span className="brand-text">
                {brandHead} <span className="brand-in">{brandTail}</span>
              </span>
            </a>
            <a className="nav-link" href={`/${locale}/schemes/`}>Browse</a>
            <div className="nav-search">
              <SearchBox locale={locale} variant="nav" />
            </div>
            <a className="nav-cta" href={`/${locale}/checker/`}>Check eligibility</a>
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
            {/* Outbound links to official portals — framed as references, NOT
                partners/endorsers, to stay consistent with the disclaimer above. */}
            <div className="footer-portals">
              <span className="footer-portals-label">Official government portals</span>
              <div className="footer-portal-list">
                <a
                  className="footer-portal"
                  href="https://www.mygov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/mygov.jpg" alt="MyGov" width={220} height={60} loading="lazy" />
                </a>
                <a
                  className="footer-portal"
                  href="https://pib.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/pibss.png"
                    alt="Press Information Bureau (PIB)"
                    width={237}
                    height={98}
                    loading="lazy"
                  />
                </a>
                <a
                  className="footer-portal"
                  href="https://www.india.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/india-gov-in.jpg"
                    alt="India.gov.in — National Portal of India"
                    width={200}
                    height={55}
                    loading="lazy"
                  />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
