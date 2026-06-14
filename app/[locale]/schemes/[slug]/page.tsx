import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LOCALES, type Locale } from '@/lib/i18n';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { getPublishedScheme, getPublishedSchemes } from '@/lib/schemes';
import { eligibilityFacts, formatINR } from '@/lib/format';
import { slugify } from '@/lib/hubs';
import { findGlossaryTerms } from '@/lib/glossary';
import { iconFor } from '@/lib/categoryIcons';
import { t, type MessageKey } from '@/lib/messages';

const FREQ_KEY: Record<string, MessageKey> = {
  one_time: 'scheme.freq.oneTime',
  monthly: 'scheme.freq.monthly',
  yearly: 'scheme.freq.yearly',
};
const BTYPE_KEY: Record<string, MessageKey> = {
  cash: 'benefit.type.cash',
  pension: 'benefit.type.pension',
  insurance: 'benefit.type.insurance',
  loan: 'benefit.type.loan',
  subsidy: 'benefit.type.subsidy',
  savings: 'benefit.type.savings',
  scholarship: 'benefit.type.scholarship',
  service: 'benefit.type.service',
};

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
    openGraph: {
      title: `${scheme.prose.name} | ${SITE_NAME}`,
      description: scheme.prose.summary,
      type: 'article',
      url: path(locale),
    },
  };
}

export default async function SchemePage({ params }: Props) {
  const { locale, slug } = await params;
  const scheme = await getPublishedScheme(locale as Locale, slug);
  if (!scheme) notFound();

  const facts = eligibilityFacts(scheme.eligibility, locale);
  const primaryCategory = scheme.categories[0];
  // Definitions for any jargon that appears in this scheme's prose (D31).
  const glossary = findGlossaryTerms(
    [scheme.prose.eligibility_prose, scheme.prose.benefits_prose, scheme.prose.how_to_apply, scheme.prose.summary].join(' '),
  );
  const pageUrl = `${SITE_URL}/${locale}/schemes/${scheme.slug}/`;
  const b = scheme.benefit;

  // Optional blocks — rendered only when present (like Documents/FAQs).
  const links = scheme.relevant_links.filter((l) => /^https?:\/\//i.test(l.url));
  const c = scheme.contacts;
  const hasContacts = c.toll_free.length + c.phones.length + c.emails.length > 0;
  const telHref = (s: string) => `tel:${s.replace(/[^\d+]/g, '')}`;
  const primaryPhone = c.toll_free[0] ?? c.phones[0] ?? null;

  // schema.org: GovernmentService + BreadcrumbList (both as rich-result food).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'GovernmentService',
        name: scheme.prose.name,
        description: scheme.prose.summary,
        provider: {
          '@type': 'GovernmentOrganization',
          name: scheme.level === 'central' ? 'Government of India' : `Government of ${scheme.state}`,
        },
        areaServed: { '@type': 'AdministrativeArea', name: scheme.state ?? 'India' },
        url: scheme.official_url,
        mainEntityOfPage: pageUrl,
        ...(primaryPhone ? { telephone: primaryPhone } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t(locale, 'common.home'), item: `${SITE_URL}/${locale}/` },
          ...(primaryCategory
            ? [{
                '@type': 'ListItem', position: 2, name: primaryCategory,
                item: `${SITE_URL}/${locale}/category/${slugify(primaryCategory)}/`,
              }]
            : []),
          { '@type': 'ListItem', position: primaryCategory ? 3 : 2, name: scheme.prose.name, item: pageUrl },
        ],
      },
      // FAQPage → eligible for Google's FAQ rich result (D33).
      ...(scheme.faqs.length > 0
        ? [{
            '@type': 'FAQPage',
            mainEntity: scheme.faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }]
        : []),
    ],
  };

  return (
    <article className="scheme">
      <nav className="breadcrumbs" aria-label={t(locale, 'scheme.breadcrumb')}>
        <Link href={`/${locale}/`}>{t(locale, 'common.home')}</Link>
        <span aria-hidden>›</span>
        {primaryCategory && (
          <>
            <Link href={`/${locale}/category/${slugify(primaryCategory)}/`}>{primaryCategory}</Link>
            <span aria-hidden>›</span>
          </>
        )}
        <span className="current">{scheme.prose.name}</span>
      </nav>

      <header className="scheme-hero">
        <div className="badges">
          {scheme.level === 'central' ? (
            <span className="badge badge-level">{t(locale, 'scheme.centralScheme')}</span>
          ) : (
            <Link className="badge badge-level" href={`/${locale}/state/${slugify(scheme.state!)}/`}>
              {scheme.state}
            </Link>
          )}
          {scheme.categories.map((c) => (
            <Link key={c} className="badge badge-cat" href={`/${locale}/category/${slugify(c)}/`}>
              <span aria-hidden>{iconFor(c)}</span> {c}
            </Link>
          ))}
        </div>
        <h1>{scheme.prose.name}</h1>
        <p className="lede">{scheme.prose.summary}</p>
      </header>

      <div className="scheme-grid">
        <main className="scheme-main">
          <section id="benefits" className="card">
            <h2>{t(locale, 'scheme.benefits')}</h2>
            <p>{scheme.prose.benefits_prose}</p>
          </section>

          <section id="eligibility" className="card">
            <h2>{t(locale, 'scheme.whoCanApply')}</h2>
            {/* Chips render the SAME structured data the checker matches on —
                page and checker cannot disagree, by construction. */}
            <ul className="chips">
              {facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p>{scheme.prose.eligibility_prose}</p>
          </section>

          <section id="apply" className="card">
            <h2>{t(locale, 'scheme.howToApply')}</h2>
            <p>{scheme.prose.how_to_apply}</p>
            {scheme.apply_steps.length > 0 && (
              <ol className="steps">
                {scheme.apply_steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}
            <a className="cta" href={scheme.official_url} target="_blank" rel="noopener noreferrer">
              {t(locale, 'scheme.applyOfficial')}
            </a>
          </section>

          {scheme.documents.length > 0 && (
            <section id="documents" className="card">
              <h2>{t(locale, 'scheme.documentsRequired')}</h2>
              <ul className="doc-list">
                {scheme.documents.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </section>
          )}

          {links.length > 0 && (
            <section id="links" className="card">
              <h2>{t(locale, 'scheme.relevantLinks')}</h2>
              <ul className="link-list">
                {links.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer">
                      {l.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasContacts && (
            <section id="contact" className="card">
              <h2>{t(locale, 'scheme.contactInfo')}</h2>
              <ul className="contact-list">
                {c.toll_free.map((n) => (
                  <li key={`tf-${n}`}>
                    <span className="contact-label">{t(locale, 'scheme.tollFree')}</span>
                    <a href={telHref(n)}>{n}</a>
                  </li>
                ))}
                {c.phones.map((n) => (
                  <li key={`ph-${n}`}>
                    <span className="contact-label">{t(locale, 'scheme.phone')}</span>
                    <a href={telHref(n)}>{n}</a>
                  </li>
                ))}
                {c.emails.map((e) => (
                  <li key={`em-${e}`}>
                    <span className="contact-label">{t(locale, 'scheme.email')}</span>
                    <a href={`mailto:${e}`}>{e}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {scheme.faqs.length > 0 && (
            <section id="faqs" className="card">
              <h2>{t(locale, 'scheme.faqsTitle')}</h2>
              <div className="faqs">
                {scheme.faqs.map((f, i) => (
                  <details key={i}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {glossary.length > 0 && (
            <section id="terms" className="card">
              <h2>{t(locale, 'scheme.keyTerms')}</h2>
              <dl className="glossary">
                {glossary.map((g) => (
                  <div key={g.term}>
                    <dt>{g.term}</dt>
                    <dd>{g.definition}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* PLAN §2: attribution + verification status on every page. */}
          <p className="attribution">
            {t(locale, 'scheme.source', { source: scheme.source })}{' '}
            {scheme.last_verified
              ? t(locale, 'scheme.lastVerified', { date: scheme.last_verified })
              : t(locale, 'scheme.reverifying')}
          </p>
        </main>

        <aside className="scheme-aside">
          <div className="facts-card">
            {b.amount !== null ? (
              <div className="benefit-amount">
                {formatINR(b.amount)}
                {b.frequency && <span>{t(locale, FREQ_KEY[b.frequency])}</span>}
              </div>
            ) : (
              <div className="benefit-amount benefit-amount-text">{b.note ?? t(locale, BTYPE_KEY[b.type])}</div>
            )}
            <dl className="facts-dl">
              <dt>{t(locale, 'scheme.level')}</dt>
              <dd>{scheme.level === 'central' ? t(locale, 'scheme.centralAllIndia') : scheme.state}</dd>
              <dt>{t(locale, 'scheme.category')}</dt>
              <dd>{scheme.categories.join(', ')}</dd>
              <dt>{t(locale, 'scheme.benefitType')}</dt>
              <dd className="cap">{t(locale, BTYPE_KEY[b.type])}</dd>
            </dl>
            <a className="cta cta-block" href={scheme.official_url} target="_blank" rel="noopener noreferrer">
              {t(locale, 'scheme.visitOfficial')}
            </a>
          </div>

          <nav className="toc" aria-label={t(locale, 'scheme.onThisPage')}>
            <p className="toc-title">{t(locale, 'scheme.onThisPage')}</p>
            <a href="#benefits">{t(locale, 'scheme.benefits')}</a>
            <a href="#eligibility">{t(locale, 'scheme.whoCanApply')}</a>
            <a href="#apply">{t(locale, 'scheme.howToApply')}</a>
            {scheme.documents.length > 0 && <a href="#documents">{t(locale, 'scheme.toc.documents')}</a>}
            {links.length > 0 && <a href="#links">{t(locale, 'scheme.relevantLinks')}</a>}
            {hasContacts && <a href="#contact">{t(locale, 'scheme.toc.contact')}</a>}
            {scheme.faqs.length > 0 && <a href="#faqs">{t(locale, 'scheme.toc.faqs')}</a>}
            {glossary.length > 0 && <a href="#terms">{t(locale, 'scheme.toc.keyTerms')}</a>}
          </nav>
        </aside>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}
