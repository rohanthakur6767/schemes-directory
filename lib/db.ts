import postgres from 'postgres';

let client: ReturnType<typeof postgres> | undefined;

export function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. The database is needed at BUILD time only (D1) — ' +
          'set it in .env locally, or in the Cloudflare Pages build environment.',
      );
    }
    client = postgres(url, {
      max: 4,
      // Drain idle connections quickly so `next build` worker processes can
      // exit instead of hanging on open sockets — a classic static-export gotcha.
      idle_timeout: 5,
      // Local docker Postgres has no TLS; Neon requires it.
      ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require',
    });
  }
  return client;
}
