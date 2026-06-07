import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: `${SITE_NAME} is an independent site, not affiliated with any government. Always verify scheme details on the official source.`,
  alternates: { canonical: '/en/disclaimer/' },
};

export default async function DisclaimerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <article className="content-page">
      <h1>Disclaimer</h1>

      <h2>Not a government website</h2>
      <p>
        {SITE_NAME} is an <strong>independent, informational website</strong>. We are
        not affiliated with, authorised by, or endorsed by the Government of India, any
        state or union territory government, or any of their departments or agencies.
      </p>

      <h2>Information is provided “as is”</h2>
      <p>
        We make a sincere effort to keep scheme details accurate and current — compiling
        from official sources, rewriting in our own words, and verifying each scheme
        before publishing (with a “last verified” date shown on every page). However,
        government schemes change frequently: amounts, eligibility rules, deadlines and
        application processes can be revised or withdrawn at any time.
      </p>
      <p>
        We therefore make <strong>no guarantee</strong> as to the accuracy, completeness
        or timeliness of any information here. Nothing on this site is legal, financial
        or professional advice. <strong>Always confirm the latest details on the
        official source linked on each scheme page before you apply or make any
        decision.</strong>
      </p>

      <h2>We never charge fees</h2>
      <p>
        {SITE_NAME} does not process applications and never charges money to apply for
        any scheme. Government schemes are applied for directly, and for free, on their
        official portals. Be cautious of anyone demanding payment to “register” you.
      </p>

      <h2>External links</h2>
      <p>
        We link to official government websites and other resources for your
        convenience. We are not responsible for the content, accuracy or practices of
        external sites.
      </p>

      <p>
        Found something wrong or outdated?{' '}
        <Link href={`/${locale}/contact/`}>Let us know</Link> and we’ll review it.
      </p>
    </article>
  );
}
