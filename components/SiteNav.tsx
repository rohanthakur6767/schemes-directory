'use client';

import { useState } from 'react';
import Logo from './Logo';
import SearchBox from './SearchBox';
import { SITE_NAME } from '@/lib/site';
import { t } from '@/lib/messages';

// Top navigation. Desktop: logo · search (fills the middle) · Browse · CTA on
// one line. Mobile: logo + hamburger; search/Browse/CTA collapse into a panel.
export default function SiteNav({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  // Wordmark: highlight the last word in green per the theme spec.
  const words = SITE_NAME.split(' ');
  const head = words.slice(0, -1).join(' ');
  const tail = words[words.length - 1];
  const close = () => setOpen(false);

  return (
    <nav className="site-nav container">
      <a className="brand" href={`/${locale}/`} onClick={close}>
        <Logo />
        <span className="brand-text">
          {head} <span className="brand-in">{tail}</span>
        </span>
      </a>

      <button
        type="button"
        className="nav-toggle"
        aria-label={t(locale, open ? 'nav.closeMenu' : 'nav.openMenu')}
        aria-expanded={open}
        aria-controls="nav-items"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '✕' : '☰'}
      </button>

      <div id="nav-items" className={`nav-items${open ? ' is-open' : ''}`}>
        <div className="nav-search">
          <SearchBox locale={locale} variant="nav" />
        </div>
        <a className="nav-link" href={`/${locale}/schemes/`} onClick={close}>
          {t(locale, 'nav.browse')}
        </a>
        <a className="nav-cta" href={`/${locale}/checker/`} onClick={close}>
          {t(locale, 'nav.checkEligibility')}
        </a>
      </div>
    </nav>
  );
}
