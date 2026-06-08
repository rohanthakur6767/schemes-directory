import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import { SITE_NAME } from '@/lib/site';
import { getPublishedSchemes } from '@/lib/schemes';
import { deriveCategoryHubs } from '@/lib/hubs';
import { iconFor } from '@/lib/categoryIcons';
import SchemeCardGrid from '@/components/SchemeCardGrid';

export const dynamicParams = false;

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const schemes = await getPublishedSchemes(params.locale as Locale);
  return deriveCategoryHubs(schemes).map((h) => ({ category: h.slug }));
}

type Props = { params: Promise<{ locale: string; category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category } = await params;
  const hub = deriveCategoryHubs(await getPublishedSchemes(locale as Locale)).find(
    (h) => h.slug === category,
  );
  if (!hub) return {};
  const title = `${hub.label} schemes in India`;
  return {
    title,
    description: `Government ${hub.label.toLowerCase()} schemes in India — eligibility, benefits and how to apply. ${hub.schemes.length} schemes listed.`,
    alternates: { canonical: `/${locale}/category/${category}/` },
    openGraph: { title: `${title} | ${SITE_NAME}`, type: 'website' },
  };
}

export default async function CategoryHub({ params }: Props) {
  const { locale, category } = await params;
  const hub = deriveCategoryHubs(await getPublishedSchemes(locale as Locale)).find(
    (h) => h.slug === category,
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
          <span aria-hidden>{iconFor(hub.label)}</span> {hub.label} schemes in India
        </h1>
        <p className="hub-intro">
          Browse {n} government {hub.label.toLowerCase()} scheme{n === 1 ? '' : 's'} in India.
          Tap any scheme to see who is eligible, the benefits, and how to apply — each verified
          against its official source.
        </p>
      </header>
      <SchemeCardGrid schemes={hub.schemes} locale={locale} />
    </article>
  );
}
