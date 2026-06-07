import type { Metadata } from 'next';
import { SITE_NAME, CONTACT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact us',
  description: `Get in touch with ${SITE_NAME} — corrections, questions and feedback.`,
  alternates: { canonical: '/en/contact/' },
};

export default function ContactPage() {
  return (
    <article className="content-page">
      <h1>Contact us</h1>

      <p>
        We’d genuinely like to hear from you — especially if you spot a scheme detail
        that’s wrong or out of date. Reader corrections help keep this directory
        accurate for everyone.
      </p>

      <p>
        Email us at{' '}
        <strong>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </strong>
        .
      </p>

      <h2>Good things to write to us about</h2>
      <ul>
        <li>A correction to a scheme’s eligibility, benefit, or application details</li>
        <li>A scheme you think we should add</li>
        <li>Questions about how we source or verify information</li>
        <li>Privacy questions or data concerns</li>
        <li>General feedback on the site</li>
      </ul>

      <p>
        We’re a small independent team and read every message, though we may not be able
        to reply to each one individually. Please note we cannot apply for schemes on
        your behalf or check your personal eligibility — applications are made directly
        on each scheme’s official portal.
      </p>
    </article>
  );
}
