import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { getPublishedSchemes } from '@/lib/schemes';
import { deriveCategoryHubs, deriveStateHubs } from '@/lib/hubs';
import { iconFor } from '@/lib/categoryIcons';
import { stateImage } from '@/lib/stateImages';
import SearchBox from '@/components/SearchBox';
import FeaturedMarquee from '@/components/FeaturedMarquee';
import BannerCarousel from '@/components/BannerCarousel';

// State initials for cards without a photo: "Tamil Nadu" → "TN", "Goa" → "GO".
const initials = (s: string) => {
  const words = s.trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : s.slice(0, 2)).toUpperCase();
};

const STEPS = [
  { icon: '🔎', title: 'Find your scheme', text: 'Browse by category, state, or who it’s for — across central and state government.' },
  { icon: '✅', title: 'Check your eligibility', text: 'Answer a few quick questions and see the schemes you likely qualify for. Private — answers never leave your browser.' },
  { icon: '🔗', title: 'Apply on the official site', text: 'We link you straight to the government’s own portal. Always free, no middlemen.' },
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
          <h1>Find government schemes made for you</h1>
          <p className="hero-sub">
            Search {schemes.length}+ central and state schemes — see what you can get,
            who can apply, and how. Free, and your details never leave your phone.
          </p>
          <div className="hero-search">
            <SearchBox locale={locale} variant="hero" />
          </div>
          <div className="hero-cta">
            <Link className="btn btn-primary" href={`/${locale}/checker/`}>
              Check what you qualify for →
            </Link>
            <Link className="btn btn-ghost" href={`/${locale}/schemes/`}>
              Browse all schemes
            </Link>
          </div>
        </div>
      </section>

      {central.length > 0 && (
        <section className="home-section featured">
          <div className="section-head">
            <h2>Popular central schemes</h2>
            <Link className="see-all" href={`/${locale}/schemes/`}>
              View all schemes →
            </Link>
          </div>
          <FeaturedMarquee schemes={central} locale={locale} />
        </section>
      )}

      <section className="how">
        <h2>How it works</h2>
        <ol className="how-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="how-icon" aria-hidden>{s.icon}</span>
              <span className="how-step-no">Step {i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {states.length > 0 && (
        <section className="home-section">
          <h2>Browse by state</h2>
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
                  <span className="place-count">
                    {h.schemes.length} scheme{h.schemes.length === 1 ? '' : 's'}
                  </span>
                  <span className="place-arrow" aria-hidden>→</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="home-section">
        <h2>Browse by category</h2>
        <div className="cat-grid">
          {categories.map((h) => (
            <Link key={h.slug} className="cat-card" href={`/${locale}/category/${h.slug}/`}>
              <span className="cat-card-icon" aria-hidden>{iconFor(h.label)}</span>
              <span className="cat-card-name">{h.label}</span>
              <span className="cat-card-count">
                {h.schemes.length} scheme{h.schemes.length === 1 ? '' : 's'}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
