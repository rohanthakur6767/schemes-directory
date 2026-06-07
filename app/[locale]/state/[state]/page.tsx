import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import { SITE_NAME } from '@/lib/site';
import { getPublishedSchemes } from '@/lib/schemes';
import { deriveStateHubs } from '@/lib/hubs';

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

  return (
    <>
      <h1>Government schemes in {hub.label}</h1>
      <p>
        {hub.schemes.length} state government scheme{hub.schemes.length === 1 ? '' : 's'} in{' '}
        {hub.label}. Central schemes also apply here — see the{' '}
        <Link href={`/${locale}/checker/`}>eligibility checker</Link>.
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
