import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Hanken_Grotesk, Hind } from 'next/font/google';
import { LOCALES, type Locale } from '@/lib/i18n';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { t } from '@/lib/messages';
import SiteNav from '@/components/SiteNav';
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

// Locale-aware site metadata (title template + description per language).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    // Base for all relative canonical/hreflang URLs in generateMetadata calls.
    metadataBase: new URL(SITE_URL),
    title: {
      default: t(locale, 'meta.homeTitle', { site: SITE_NAME }),
      template: t(locale, 'meta.titleTemplate', { site: SITE_NAME }),
    },
    description: t(locale, 'meta.description'),
    openGraph: {
      siteName: SITE_NAME,
      type: 'website',
      locale: locale === 'hi' ? 'hi_IN' : 'en_IN',
    },
  };
}

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
    <html lang={locale} className={`${fraunces.variable} ${hanken.variable} ${hind.variable}`}>
      <body>
        {/* Google AdSense — async script; React 19 hoists it into <head> on every
            page (verification + ad serving). Publisher ca-pub-8300216892614030. */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8300216892614030"
          crossOrigin="anonymous"
        />
        <header className="site-header">
          <SiteNav locale={locale} />
        </header>
        <main className="container">{children}</main>
        {/* §2: site-wide disclaimer + attribution, required from day one. */}
        <footer className="site-footer">
          <div className="footer-inner container">
            <nav className="footer-links">
              <a href={`/${locale}/about/`}>{t(locale, 'footer.about')}</a>
              <a href={`/${locale}/privacy/`}>{t(locale, 'footer.privacy')}</a>
              <a href={`/${locale}/disclaimer/`}>{t(locale, 'footer.disclaimer')}</a>
              <a href={`/${locale}/contact/`}>{t(locale, 'footer.contact')}</a>
            </nav>
            <p>{t(locale, 'footer.independence', { site: SITE_NAME })}</p>
            <p>{t(locale, 'footer.dataSource')}</p>
            {/* Outbound links to official portals — framed as references, NOT
                partners/endorsers, to stay consistent with the disclaimer above. */}
            <div className="footer-portals">
              <span className="footer-portals-label">{t(locale, 'footer.officialPortals')}</span>
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
