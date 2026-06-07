import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { getPublishedSchemes } from '@/lib/schemes';
import { deriveCategoryHubs, deriveStateHubs } from '@/lib/hubs';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const schemes = await getPublishedSchemes(locale as Locale);
  const categories = deriveCategoryHubs(schemes);
  const states = deriveStateHubs(schemes);

  return (
    <>
      <h1>Indian government schemes, made findable</h1>
      <p>
        A directory of central and state government schemes — with a personal{' '}
        <Link href={`/${locale}/checker/`}>eligibility checker</Link> and instant{' '}
        <Link href={`/${locale}/schemes/`}>filters</Link>. Currently listing {schemes.length}{' '}
        schemes.
      </p>

      <h2>Browse by category</h2>
      <ul className="hub-links">
        {categories.map((h) => (
          <li key={h.slug}>
            <Link href={`/${locale}/category/${h.slug}/`}>
              {h.label} <span className="count">({h.schemes.length})</span>
            </Link>
          </li>
        ))}
      </ul>

      {states.length > 0 && (
        <>
          <h2>Browse by state</h2>
          <ul className="hub-links">
            {states.map((h) => (
              <li key={h.slug}>
                <Link href={`/${locale}/state/${h.slug}/`}>
                  {h.label} <span className="count">({h.schemes.length})</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>All schemes</h2>
      <ul>
        {schemes.map((s) => (
          <li key={s.id}>
            <Link href={`/${locale}/schemes/${s.slug}/`}>{s.prose.name}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
