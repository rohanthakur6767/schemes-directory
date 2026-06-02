import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // D1: fully static export — `next build` writes plain HTML/JS/CSS to out/.
  // No server runtime anywhere; Postgres is only touched at build time.
  output: 'export',

  // Static export writes each page as folder/index.html. Trailing slashes make
  // the canonical URL map 1:1 to that file on any static host — no /x vs /x/
  // duplicate-content ambiguity for SEO.
  trailingSlash: true,
};

export default nextConfig;
