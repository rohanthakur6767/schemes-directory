import type { Metadata } from 'next';
import Browse from './Browse';

export const metadata: Metadata = {
  title: 'Browse all schemes',
  description:
    'Browse Indian government schemes by state, category and beneficiary type. ' +
    'Filter instantly to find the schemes that fit.',
};

export default async function BrowsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <h1>Browse schemes</h1>
      <p>Filter by state, category and who the scheme is for. Tick any combination.</p>
      <Browse locale={locale} />
    </>
  );
}
