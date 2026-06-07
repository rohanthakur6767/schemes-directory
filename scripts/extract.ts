// Phase 4a: PDF → cleaned text + deterministic metadata.
// Reads data/raw/*.pdf, writes data/extracted/<slug>.json. This cleaned text is
// the INPUT to the LLM structured-eligibility parser (4b). No LLM here.
//   Run: npm run extract
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { extractText, getDocumentProxy } from 'unpdf';
import { cleanText, extractSnapshotDate, slugFromFilename } from '../lib/extract.ts';

const RAW = new URL('../data/raw/', import.meta.url);
const OUT = new URL('../data/extracted/', import.meta.url);
await mkdir(OUT, { recursive: true });

const files = (await readdir(RAW)).filter((f) => f.toLowerCase().endsWith('.pdf'));
if (files.length === 0) {
  console.log('No PDFs in data/raw/. Download some first.');
  process.exit(0);
}

for (const file of files) {
  const buf = await readFile(new URL(file, RAW));
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });

  const slug = slugFromFilename(file);
  const snapshot = extractSnapshotDate(text);
  const cleaned = cleanText(text);

  const record = {
    slug,
    source: 'myScheme (myscheme.gov.in) archived page via gov_myscheme dataset',
    source_snapshot_date: snapshot, // dated → re-verify before publish (§2)
    extracted_at_chars: cleaned.length,
    text: cleaned,
  };
  await writeFile(new URL(`${slug}.json`, OUT), JSON.stringify(record, null, 2));
  console.log(`${slug}: ${cleaned.length} chars, snapshot ${snapshot ?? 'unknown'}`);
}
