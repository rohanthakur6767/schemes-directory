// "Naya Savera" rising-sun brand mark. Decorative (aria-hidden) — the wordmark
// text carries the accessible name. Deliberately NOT the national flag/emblem/
// chakra (independent directory).
export default function Logo() {
  return (
    <svg className="brand-logo" viewBox="0 0 64 64" width="36" height="36" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="navaSun" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#E2571E" />
          <stop offset="1" stopColor="#F5A623" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="#16241C" />
      <g stroke="#F5A623" strokeWidth="2.6" strokeLinecap="round">
        <line x1="32" y1="14" x2="32" y2="19" />
        <line x1="20" y1="18" x2="22.6" y2="22" />
        <line x1="44" y1="18" x2="41.4" y2="22" />
        <line x1="13" y1="29" x2="17.5" y2="30.5" />
        <line x1="51" y1="29" x2="46.5" y2="30.5" />
      </g>
      <path d="M19 43 A13 13 0 0 1 45 43 Z" fill="url(#navaSun)" />
      <line x1="13" y1="43" x2="51" y2="43" stroke="#F4EFE4" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
