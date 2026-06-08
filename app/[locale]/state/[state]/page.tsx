import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import { SITE_NAME } from '@/lib/site';
import { getPublishedSchemes } from '@/lib/schemes';
import { deriveStateHubs } from '@/lib/hubs';
import SchemeCardGrid from '@/components/SchemeCardGrid';

export const dynamicParams = false;

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const schemes = await getPublishedSchemes(params.locale as Locale);
  return deriveStateHubs(schemes).map((h) => ({ state: h.slug }));
}

type Props = { params: Promise<{ locale: string; state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, state } = await params;
  const hub = deriveStateHubs(await getPublishedSchemes(locale as Locale)).find(
    (h) => h.slug === state,
  );
  if (!hub) return {};
  const title = `Government schemes in ${hub.label}`;
  return {
    title,
    description: `State government schemes in ${hub.label} — eligibility, benefits and how to apply. ${hub.schemes.length} schemes listed.`,
    alternates: { canonical: `/${locale}/state/${state}/` },
    openGraph: { title: `${title} | ${SITE_NAME}`, type: 'website' },
  };
}

export default async function StateHub({ params }: Props) {
  const { locale, state } = await params;
  const hub = deriveStateHubs(await getPublishedSchemes(locale as Locale)).find(
    (h) => h.slug === state,
  );
  if (!hub) notFound();

  const n = hub.schemes.length;
  return (
    <article className="hub">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/${locale}/`}>Home</Link>
        <span aria-hidden>›</span>
        <Link href={`/${locale}/schemes/`}>Browse</Link>
        <span aria-hidden>›</span>
        <span className="current">{hub.label}</span>
      </nav>
      <header className="hub-header">
        <h1>
          <span aria-hidden>📍</span> Government schemes in {hub.label}
        </h1>
        <p className="hub-intro">
          {n} state government scheme{n === 1 ? '' : 's'} listed for {hub.label}. Central
          schemes apply here too — use the{' '}
          <Link href={`/${locale}/checker/`}>eligibility checker</Link> to find everything you
          qualify for.
        </p>
      </header>
      <SchemeCardGrid schemes={hub.schemes} locale={locale} />
    </article>
  );
}
