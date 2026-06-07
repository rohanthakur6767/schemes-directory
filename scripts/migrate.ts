// Apply db/schema.sql. Run with:  npm run db:migrate
// (node --env-file=.env gives us process.env without any dotenv dependency — D10)
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set. Run via `npm run db:migrate` (loads .env).');
  process.exit(1);
}

const sql = postgres(url, {
  max: 1,
  ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require',
  onnotice: () => {}, // silence "relation already exists, skipping" notices
});

const ddl = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');
await sql.unsafe(ddl);
console.log('Schema applied.');
await sql.end();
