// ---------------------------------------------------------------------------
// Plain-English definitions of common Indian government-scheme jargon.
// ORIGINAL content (written by us) — so it's publishable everywhere, including
// on already-published pages, with no review gate. Builds trust + comprehension
// + adds unique content (good for SEO). Pure module → testable.
// ---------------------------------------------------------------------------

export type GlossaryEntry = { term: string; match: RegExp; definition: string };

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: 'DBT (Direct Benefit Transfer)',
    match: /\bDBT\b|direct benefit transfer/i,
    definition:
      'A system where the scheme amount is paid straight into the beneficiary’s bank account, with no middlemen handling the cash.',
  },
  {
    term: 'Aadhaar',
    match: /\baadhaar\b/i,
    definition:
      'A 12-digit unique identity number issued by UIDAI. Most schemes use it to confirm identity and link your bank account for payments.',
  },
  {
    term: 'eKYC',
    match: /\be-?kyc\b/i,
    definition:
      'Electronic “Know Your Customer” — verifying your identity online, usually with an Aadhaar OTP, instead of submitting physical documents.',
  },
  {
    term: 'BPL (Below Poverty Line)',
    match: /\bBPL\b|below poverty line/i,
    definition:
      'An official classification for households whose income falls below a government-set threshold; many welfare schemes prioritise them.',
  },
  {
    term: 'SECC 2011',
    match: /\bSECC\b|socio-?economic caste census/i,
    definition:
      'The Socio-Economic and Caste Census of 2011 — a nationwide survey used to identify eligible households for several central schemes.',
  },
  {
    term: 'SC / ST / OBC',
    match: /\bSC\s*\/\s*ST\b|scheduled caste|scheduled tribe|\bOBC\b|other backward class/i,
    definition:
      'Official social categories — Scheduled Castes, Scheduled Tribes and Other Backward Classes — used for reservations and targeted welfare schemes.',
  },
  {
    term: 'EWS (Economically Weaker Section)',
    match: /\bEWS\b|economically weaker section/i,
    definition:
      'A category for people below a defined income level who don’t fall under SC/ST/OBC, eligible for certain benefits and reservations.',
  },
  {
    term: 'CSC (Common Service Centre)',
    match: /\bCSC\b|common service cent(re|er)/i,
    definition:
      'A government-authorised local kiosk where citizens can apply online for schemes and services, often for a small fee.',
  },
  {
    term: 'Gram Panchayat',
    match: /gram panchayat/i,
    definition:
      'The elected local self-government at the village level, often the first point of verification or application for rural schemes.',
  },
  {
    term: 'ULB (Urban Local Body)',
    match: /\bULB\b|urban local bod/i,
    definition:
      'A municipal authority (municipality or corporation) that administers an urban area and verifies applicants for many urban schemes.',
  },
  {
    term: 'Self-declaration',
    match: /self-?declaration/i,
    definition:
      'A signed statement where you certify your own details (like income) are true, accepted in place of a formal certificate for some schemes.',
  },
  {
    term: 'Collateral-free loan',
    match: /collateral-?free/i,
    definition:
      'A loan you can take without pledging any asset (land, gold, etc.) as security.',
  },
  {
    term: 'Antyodaya (AAY)',
    match: /antyodaya|\bAAY\b/i,
    definition:
      'Antyodaya Anna Yojana — a category for the poorest households, who receive the highest priority for food and welfare benefits.',
  },
  {
    term: 'PMAY (Pradhan Mantri Awas Yojana)',
    match: /\bPMAY\b|pradhan mantri awas yojana/i,
    definition:
      'The central housing scheme that helps eligible families build or buy a pucca (permanent) house.',
  },
];

// Return the definitions whose terms appear in the given text, in glossary order.
export function findGlossaryTerms(text: string): GlossaryEntry[] {
  return GLOSSARY.filter((e) => e.match.test(text));
}
