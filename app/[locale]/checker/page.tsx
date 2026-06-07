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
      <h1>Eligibility checker</h1>
      <p>
        Answer what you can — every field is optional. Leaving an answer blank
        simply widens the results rather than ruling schemes out.
      </p>
      <Checker locale={locale} />
    </>
  );
}
