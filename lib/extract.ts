// ---------------------------------------------------------------------------
// DETERMINISTIC extraction + cleanup of myScheme archived-page text (Phase 4a).
// Pure (no PDF lib, no I/O) so it unit-tests on fixture strings. The PDF→text
// step lives in scripts/extract.ts; everything semantic is left to the LLM (4b).
// ---------------------------------------------------------------------------

// Windows-1252 high range (0x80–0x9F) → Unicode. These are the bytes whose
// cp1252 mapping differs from Latin-1 — the source of the mojibake (D22).
const CP1252_HIGH: Record<number, number> = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160,
  0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153,
  0x9e: 0x017e, 0x9f: 0x0178,
};
// Reverse: Unicode codepoint → original cp1252 byte.
const REV = new Map<number, number>(
  Object.entries(CP1252_HIGH).map(([b, u]) => [u, Number(b)]),
);

// Signature of UTF-8-misread-as-cp1252. Gate the fix on this so we never
// corrupt text that is already clean (e.g. a legitimate 'é').
const MOJIBAKE = /Ã.|â€|â‚|Â[°±¹²³]/;

export function fixMojibake(s: string): string {
  if (!MOJIBAKE.test(s)) return s;
  const bytes: number[] = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (REV.has(cp)) bytes.push(REV.get(cp)!); // cp1252 special → its byte
    else if (cp <= 0xff) bytes.push(cp); // identity for the rest of cp1252
    else for (const b of Buffer.from(ch, 'utf8')) bytes.push(b); // genuine char
  }
  return Buffer.from(bytes).toString('utf8');
}

// Boilerplate that appears on EVERY archived myScheme page — pure UI chrome with
// no scheme content. Stripped to cut noise/tokens before the LLM pass (D23).
const CHROME: RegExp[] = [
  /Are you sure you want to sign out\?.*?Sign InBack/gs,
  /Something went wrong\. Please try again later\.Ok/g,
  /You need to sign in before applying for schemes.*?Sign In/gs,
  /It seems you have already initiated your application earlier\..*?Apply Now/gs,
  /Sign in to apply/g,
  /Check Eligibility/g,
  /Was this helpful\?/g,
  /News and UpdatesNo new news and updates available/g,
  /Share(?=Something|News|$)/g,
  /Feedback/g,
  // Footer from the copyright mark onward — address, quick links, contact.
  /©\d{4}Powered by.*$/s,
];

export function stripChrome(s: string): string {
  let out = s;
  for (const re of CHROME) out = out.replace(re, ' ');
  return out;
}

export function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

// Full deterministic clean: fix encoding → strip chrome → collapse.
export function cleanText(raw: string): string {
  return collapseWhitespace(stripChrome(fixMojibake(raw)));
}

// "Last Updated On : 28/03/2024" → "2024-03-28" (the source snapshot date).
export function extractSnapshotDate(s: string): string | null {
  const m = /Last Updated On\s*:\s*(\d{2})\/(\d{2})\/(\d{4})/.exec(s);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

// slug from a PDF filename: "data/raw/pm-kisan.pdf" → "pm-kisan".
export function slugFromFilename(file: string): string {
  return file.replace(/^.*[/\\]/, '').replace(/\.pdf$/i, '').replace(/ copy$/i, '').trim();
}
