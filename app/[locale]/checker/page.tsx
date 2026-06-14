import type { Metadata } from 'next';
import { t } from '@/lib/messages';
import Checker from './Checker';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t(locale, 'checker.metaTitle'),
    description: t(locale, 'checker.metaDescription'),
  };
}

export default async function CheckerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <header className="checker-head">
        <h1>{t(locale, 'checker.pageH1')}</h1>
        <p>{t(locale, 'checker.pageIntro')}</p>
      </header>
      <Checker locale={locale} />
    </>
  );
}
