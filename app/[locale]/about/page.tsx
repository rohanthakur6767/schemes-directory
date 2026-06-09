import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About us',
  description: `About ${SITE_NAME} — an independent directory of Indian government schemes with original, verified summaries.`,
  alternates: { canonical: '/en/about/' },
};

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <article className="content-page">
      <h1>About {SITE_NAME}</h1>

      <p>
        {SITE_NAME} is an independent informational website that helps people in
        India discover central and state government welfare schemes — and quickly
        understand who qualifies, what the benefit is, and how to apply.
      </p>

      <h2>Why we built this</h2>
      <p>
        Hundreds of genuinely useful government schemes go unused simply because
        people don’t know they exist or can’t tell whether they’re eligible. Official
        information is scattered across dozens of portals and written in dense,
        formal language. Our goal is to make that information findable, comparable,
        and easy to read in plain English.
      </p>

      <h2>How we source and verify information</h2>
      <p>
        We compile <strong>facts</strong> — eligibility criteria, benefit amounts,
        required documents and application steps — from official government sources
        such as the national myScheme platform, data.gov.in and ministry and state
        portals, which publish open data under the Government Open Data Licence (GODL-India).
      </p>
      <p>
        We do <strong>not</strong> copy text from those sources or from other
        directories. Every description on this site is rewritten in our own words.
        Crucially, before a scheme is published, a person checks its details against
        the official source, and we show a <strong>“last verified” date</strong> on
        each page so you know how current the information is. Where we haven’t yet
        re-verified a page, we say so plainly.
      </p>

      <h2>Our independence</h2>
      <p>
        {SITE_NAME} is an independently run informational website. We are{' '}
        <strong>not</strong> affiliated with, authorised by, or endorsed by the
        Government of India or any state government. We don’t process applications, charge fees, or act as
        intermediaries — we point you to the official source, where you apply directly
        and for free.
      </p>

      <h2>A note on privacy</h2>
      <p>
        Our <Link href={`/${locale}/checker/`}>eligibility checker</Link> runs entirely
        in your browser. The answers you enter — including income or category — are{' '}
        <strong>never sent to our servers</strong>. See our{' '}
        <Link href={`/${locale}/privacy/`}>Privacy Policy</Link> for details.
      </p>

      <p>
        Spotted an error or an out-of-date detail? Please{' '}
        <Link href={`/${locale}/contact/`}>tell us</Link> — corrections from readers
        help everyone.
      </p>
    </article>
  );
}
