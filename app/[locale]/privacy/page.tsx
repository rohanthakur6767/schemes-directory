import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME, CONTACT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE_NAME} handles data, cookies and advertising.`,
  alternates: { canonical: '/en/privacy/' },
};

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <article className="content-page">
      <h1>Privacy Policy</h1>
      <p className="muted-note">Last updated: 7 June 2026</p>

      <p>
        This policy explains what information {SITE_NAME} (“we”, “us”) handles when
        you visit this website, and how cookies and advertising work here.
      </p>

      <h2>Information we collect</h2>
      <p>
        {SITE_NAME} is a static informational website. We do <strong>not</strong> ask
        you to create an account, and we do not directly collect personal details such
        as your name, phone number or address. We don’t sell personal data to anyone.
      </p>
      <p>
        Like most websites, our hosting provider may automatically log standard
        technical information (such as your IP address, browser type and the pages
        requested) for security and to keep the service running. Third-party services
        described below may also collect information through cookies.
      </p>

      <h2>The eligibility checker stays in your browser</h2>
      <p>
        Our <Link href={`/${locale}/checker/`}>eligibility checker</Link> processes your
        answers — including sensitive details like income or social category —{' '}
        <strong>entirely within your browser</strong>. These answers are never
        transmitted to, or stored on, our servers.
      </p>

      <h2>Cookies and advertising (Google AdSense)</h2>
      <p>
        We may display advertisements served by <strong>Google AdSense</strong>. To do
        this, third-party vendors — <strong>including Google</strong> — use cookies to
        serve ads based on your prior visits to this website and other websites.
      </p>
      <ul>
        <li>
          Google’s use of advertising cookies enables it and its partners to serve ads
          to you based on your visits to our site and/or other sites on the internet.
        </li>
        <li>
          You can opt out of personalised advertising by visiting{' '}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            Google Ads Settings
          </a>
          . You can also opt out of some third-party vendors’ use of cookies for
          personalised advertising at{' '}
          <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">
            aboutads.info
          </a>
          .
        </li>
        <li>
          For more on how Google uses data when you use our partners’ sites or apps, see{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
            Google’s policy
          </a>
          .
        </li>
      </ul>
      <p>
        Most browsers let you refuse or delete cookies through their settings; doing so
        will not stop you from using this website.
      </p>

      <h2>Analytics</h2>
      <p>
        We do not currently use analytics cookies that identify you personally. If we
        add analytics in future, we will update this policy.
      </p>

      <h2>Data handling and your choices</h2>
      <p>
        Our visitors are largely in India. We aim to handle any information lawfully and
        to keep it to the minimum needed to run and improve the site. We do not
        knowingly collect information from children. If you have questions about your
        data or wish to raise a concern, contact us at the address below.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be reflected
        by the “last updated” date above.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or use our{' '}
        <Link href={`/${locale}/contact/`}>contact page</Link>.
      </p>
    </article>
  );
}
