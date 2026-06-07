import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { getPublishedSchemes } from '@/lib/schemes';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const schemes = await getPublishedSchemes(locale as Locale);

  return (
    <>
      <h1>Indian government schemes, made findable</h1>
      <p>
        A directory of central and state government schemes — with a personal
        eligibility checker and instant filters (coming in the next phases).
        Currently listing {schemes.length} schemes.
      </p>
      <ul>
        {schemes.map((s) => (
          <li key={s.id}>
            <Link href={`/${locale}/schemes/${s.slug}/`}>{s.prose.name}</Link>
            {' — '}
            {s.prose.summary}
          </li>
        ))}
      </ul>
    </>
  );
}
