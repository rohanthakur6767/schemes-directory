import type { Metadata } from 'next';
import Checker from './Checker';

export const metadata: Metadata = {
  title: 'Eligibility checker',
  description:
    'Answer a few questions and find Indian government schemes you may be eligible for. ' +
    'Private — your answers never leave your browser.',
};

export default async function CheckerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <header className="checker-head">
        <h1>Which schemes do you qualify for?</h1>
        <p>Answer a few quick questions — every one is optional, and your answers never leave your browser.</p>
      </header>
      <Checker locale={locale} />
    </>
  );
}
