import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LOCALES, type Locale } from '@/lib/i18n';
import { SITE_URL } from '@/lib/site';
import { getPublishedScheme, getPublishedSchemes } from '@/lib/schemes';
import { benefitLine, eligibilityFacts } from '@/lib/format';

export const dynamicParams = false;

// Called once per locale (Next feeds each parent param combo through here);
// only schemes with PUBLISHED prose in that locale get a page (D5).
export async function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  const schemes = await getPublishedSchemes(params.locale as Locale);
  return schemes.map((s) => ({ slug: s.slug }));
}

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const scheme = await getPublishedScheme(locale as Locale, slug);
  if (!scheme) return {};
  const path = (l: string) => `/${l}/schemes/${slug}/`;
  return {
    title: scheme.prose.name,
    description: scheme.prose.summary,
    alternates: {
      canonical: path(locale),
      // hreflang (D4): built from LOCALES, so adding 'hi' lights this up site-wide.
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, path(l)])),
        'x-default': path('en'),
      },
    },
  };
}

export default async function SchemePage({ params }: Props) {
  const { locale, slug } = await params;
  const scheme = await getPublishedScheme(locale as Locale, slug);
  if (!scheme) notFound();

  const facts = eligibilityFacts(scheme.eligibility);

  // schema.org structured data: a scheme is a GovernmentService provided by a
  // GovernmentOrganization. Rich-result food for search engines (PLAN §4).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: scheme.prose.name,
    description: scheme.prose.summary,
    provider: {
      '@type': 'GovernmentOrganization',
      name:
        scheme.level === 'central'
          ? 'Government of India'
          : `Government of ${scheme.state}`,
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: scheme.state ?? 'India',
    },
    url: scheme.official_url,
    mainEntityOfPage: `${SITE_URL}/${locale}/schemes/${scheme.slug}/`,
  };

  return (
    <article>
      <h1>{scheme.prose.name}</h1>
      <p>{scheme.prose.summary}</p>

      <dl className="key-facts">
        <dt>Level</dt>
        <dd>{scheme.level === 'central' ? 'Central scheme' : `State scheme — ${scheme.state}`}</dd>
        <dt>Category</dt>
        <dd>{scheme.categories.join(', ')}</dd>
        <dt>Benefit</dt>
        <dd>{benefitLine(scheme.benefit)}</dd>
      </dl>

      <h2>Who is eligible?</h2>
      {/* Chips render the same STRUCTURED data the checker matches on — page
          and checker cannot disagree, by construction. */}
      <ul className="chips">
        {facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <p>{scheme.prose.eligibility_prose}</p>

      <h2>What you get</h2>
      <p>{scheme.prose.benefits_prose}</p>

      <h2>How to apply</h2>
      <p>{scheme.prose.how_to_apply}</p>

      {scheme.documents.length > 0 && (
        <>
          <h2>Documents needed</h2>
          <ul>
            {scheme.documents.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </>
      )}

      <p>
        <a href={scheme.official_url} target="_blank" rel="noopener noreferrer">
          Official website ↗
        </a>
      </p>

      {/* PLAN §2: attribution + verification status on every page. */}
      <p className="attribution">
        Source: {scheme.source}.{' '}
        {scheme.last_verified
          ? `Facts last verified on ${scheme.last_verified}.`
          : 'Facts pending re-verification against the official source — confirm details there before applying.'}
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}
