import Link from 'next/link';
import type { Metadata } from 'next';
import { LOCALES, type Locale } from '@/lib/i18n';
import { getPublishedSchemes } from '@/lib/schemes';
import { deriveCategoryHubs, deriveStateHubs } from '@/lib/hubs';
import { iconFor } from '@/lib/categoryIcons';
import { stateImage } from '@/lib/stateImages';
import { categoryImage } from '@/lib/categoryImages';
import { t, schemeCount, type MessageKey } from '@/lib/messages';
import SearchBox from '@/components/SearchBox';
import FeaturedMarquee from '@/components/FeaturedMarquee';
import BannerCarousel from '@/components/BannerCarousel';

// State initials for cards without a photo: "Tamil Nadu" → "TN", "Goa" → "GO".
const initials = (s: string) => {
  const words = s.trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : s.slice(0, 2)).toUpperCase();
};

// Locale-aware canonical + hreflang + og:url for the home page (resolved against
// metadataBase = https://www.indiagovschemes.com in the layout).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = (l: string) => `/${l}/`;
  return {
    alternates: {
      canonical: path(locale),
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, path(l)])),
        'x-default': path('en'),
      },
    },
    openGraph: { url: path(locale) },
  };
}

const STEPS: { icon: string; titleKey: MessageKey; textKey: MessageKey }[] = [
  { icon: '🔎', titleKey: 'home.step.find.title', textKey: 'home.step.find.text' },
  { icon: '✅', titleKey: 'home.step.check.title', textKey: 'home.step.check.text' },
  { icon: '🔗', titleKey: 'home.step.apply.title', textKey: 'home.step.apply.text' },
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const schemes = await getPublishedSchemes(locale as Locale);
  const categories = deriveCategoryHubs(schemes);
  const states = deriveStateHubs(schemes);
  // Flagship central schemes for the home showcase (capped for a tidy loop).
  const central = schemes.filter((s) => s.level === 'central').slice(0, 12);

  return (
    <>
      <BannerCarousel locale={locale} />

      <section className="hero">
        <div className="hero-bg" aria-hidden />
        <div className="hero-inner">
          <h1>{t(locale, 'home.heroH1')}</h1>
          <p className="hero-sub">{t(locale, 'home.heroSub', { count: schemes.length })}</p>
          <div className="hero-search">
            <SearchBox locale={locale} variant="hero" />
          </div>
          <div className="hero-cta">
            <Link className="btn btn-primary" href={`/${locale}/checker/`}>
              {t(locale, 'home.ctaCheck')}
            </Link>
            <Link className="btn btn-ghost" href={`/${locale}/schemes/`}>
              {t(locale, 'home.ctaBrowse')}
            </Link>
          </div>
        </div>
      </section>

      {central.length > 0 && (
        <section className="home-section featured">
          <div className="section-head">
            <h2>{t(locale, 'home.popularCentral')}</h2>
            <Link className="see-all" href={`/${locale}/schemes/`}>
              {t(locale, 'home.viewAll')}
            </Link>
          </div>
          <FeaturedMarquee schemes={central} locale={locale} />
        </section>
      )}

      <section className="how">
        <h2>{t(locale, 'home.howItWorks')}</h2>
        <ol className="how-steps">
          {STEPS.map((s, i) => (
            <li key={s.titleKey}>
              <span className="how-icon" aria-hidden>{s.icon}</span>
              <span className="how-step-no">{t(locale, 'home.stepNo', { n: i + 1 })}</span>
              <h3>{t(locale, s.titleKey)}</h3>
              <p>{t(locale, s.textKey)}</p>
            </li>
          ))}
        </ol>
      </section>

      {states.length > 0 && (
        <section className="home-section">
          <h2>{t(locale, 'home.browseByState')}</h2>
          <div className="place-grid">
            {states.map((h) => {
              const img = stateImage(h.label);
              return (
                <Link key={h.slug} className="place-card" href={`/${locale}/state/${h.slug}/`}>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="place-avatar"
                      src={img}
                      alt=""
                      width={72}
                      height={72}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="place-avatar place-monogram" aria-hidden>
                      {initials(h.label)}
                    </span>
                  )}
                  <span className="place-name">{h.label}</span>
                  <span className="place-count">{schemeCount(locale, h.schemes.length)}</span>
                  <span className="place-arrow" aria-hidden>→</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="home-section">
        <h2>{t(locale, 'home.browseByCategory')}</h2>
        <div className="cat-grid">
          {categories.map((h) => {
            const catImg = categoryImage(h.label);
            return (
              <Link key={h.slug} className="cat-card" href={`/${locale}/category/${h.slug}/`}>
                {catImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="cat-card-img"
                    src={catImg}
                    alt=""
                    width={52}
                    height={52}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="cat-card-icon" aria-hidden>{iconFor(h.label)}</span>
                )}
                <span className="cat-card-name">{h.label}</span>
                <span className="cat-card-count">{schemeCount(locale, h.schemes.length)}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
