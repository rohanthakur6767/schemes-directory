// D4: the single place locales are declared. Adding Hindi later = add 'hi' here,
// insert scheme_translations rows, rebuild. Nothing else changes.
export const LOCALES = ['en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
