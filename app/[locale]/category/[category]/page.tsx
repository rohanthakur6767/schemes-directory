import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import { SITE_NAME } from '@/lib/site';
import { getPublishedSchemes } from '@/lib/schemes';
import { deriveCategoryHubs } from '@/lib/hubs';

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

  return (
    <>
      <h1>{hub.label} schemes in India</h1>
      <p>
        {hub.schemes.length} government {hub.label.toLowerCase()} scheme
        {hub.schemes.length === 1 ? '' : 's'} — tap any scheme for eligibility, benefits and
        how to apply.
      </p>
      <ul className="hub-list">
        {hub.schemes.map((s) => (
          <li key={s.id}>
            <Link href={`/${locale}/schemes/${s.slug}/`}>{s.prose.name}</Link>
            <p>{s.prose.summary}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
