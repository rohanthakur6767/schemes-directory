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

const FREQ_LABEL: Record<string, string> = {
  one_time: 'one-time',
  monthly: 'per month',
  yearly: 'per year',
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

  const facts = eligibilityFacts(scheme.eligibility);
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
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/${locale}/` },
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
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/${locale}/`}>Home</Link>
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
            <span className="badge badge-level">Central scheme</span>
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
            <h2>Benefits</h2>
            <p>{scheme.prose.benefits_prose}</p>
          </section>

          <section id="eligibility" className="card">
            <h2>Who can apply</h2>
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
            <h2>How to apply</h2>
            <p>{scheme.prose.how_to_apply}</p>
            {scheme.apply_steps.length > 0 && (
              <ol className="steps">
                {scheme.apply_steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}
            <a className="cta" href={scheme.official_url} target="_blank" rel="noopener noreferrer">
              Apply on the official website ↗
            </a>
          </section>

          {scheme.documents.length > 0 && (
            <section id="documents" className="card">
              <h2>Documents required</h2>
              <ul className="doc-list">
                {scheme.documents.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </section>
          )}

          {links.length > 0 && (
            <section id="links" className="card">
              <h2>Relevant links</h2>
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
              <h2>Contact information</h2>
              <ul className="contact-list">
                {c.toll_free.map((n) => (
                  <li key={`tf-${n}`}>
                    <span className="contact-label">Toll-free</span>
                    <a href={telHref(n)}>{n}</a>
                  </li>
                ))}
                {c.phones.map((n) => (
                  <li key={`ph-${n}`}>
                    <span className="contact-label">Phone</span>
                    <a href={telHref(n)}>{n}</a>
                  </li>
                ))}
                {c.emails.map((e) => (
                  <li key={`em-${e}`}>
                    <span className="contact-label">Email</span>
                    <a href={`mailto:${e}`}>{e}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {scheme.faqs.length > 0 && (
            <section id="faqs" className="card">
              <h2>Frequently asked questions</h2>
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
              <h2>Key terms explained</h2>
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
            Source: {scheme.source}.{' '}
            {scheme.last_verified
              ? `Facts last verified on ${scheme.last_verified}.`
              : 'Facts are being re-verified against the official source — please confirm details there before applying.'}
          </p>
        </main>

        <aside className="scheme-aside">
          <div className="facts-card">
            {b.amount !== null ? (
              <div className="benefit-amount">
                {formatINR(b.amount)}
                {b.frequency && <span>{FREQ_LABEL[b.frequency]}</span>}
              </div>
            ) : (
              <div className="benefit-amount benefit-amount-text">{b.note ?? b.type}</div>
            )}
            <dl className="facts-dl">
              <dt>Level</dt>
              <dd>{scheme.level === 'central' ? 'Central (all-India)' : scheme.state}</dd>
              <dt>Category</dt>
              <dd>{scheme.categories.join(', ')}</dd>
              <dt>Benefit type</dt>
              <dd className="cap">{b.type}</dd>
            </dl>
            <a className="cta cta-block" href={scheme.official_url} target="_blank" rel="noopener noreferrer">
              Visit official website ↗
            </a>
          </div>

          <nav className="toc" aria-label="On this page">
            <p className="toc-title">On this page</p>
            <a href="#benefits">Benefits</a>
            <a href="#eligibility">Who can apply</a>
            <a href="#apply">How to apply</a>
            {scheme.documents.length > 0 && <a href="#documents">Documents</a>}
            {links.length > 0 && <a href="#links">Relevant links</a>}
            {hasContacts && <a href="#contact">Contact</a>}
            {scheme.faqs.length > 0 && <a href="#faqs">FAQs</a>}
            {glossary.length > 0 && <a href="#terms">Key terms</a>}
          </nav>
        </aside>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}
