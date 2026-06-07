# PLAN.md — Government Schemes Directory (India)

> **For the AI assistant working in this repo:** This file is the source of truth.
> Work in **plan-first, teach-as-you-go** mode. Before each phase, explain WHAT,
> WHY, and the trade-offs in a few sentences; THEN write code; THEN tell me how to
> run and verify it; THEN pause and wait for my confirmation before the next phase.
> Keep this file updated — check off tasks as they ship and note any decisions.

---

## 1. What we're building

A directory of Indian government schemes (central + all states/UTs, ~1000+ schemes
target). One static, SEO-friendly page per scheme. Original written content. Two
headline features that beat existing directories:

1. **Eligibility checker** — user answers a short questionnaire; deterministic rules
   matching returns schemes they likely qualify for. No ML.
2. **Faceted search/filters** — filter by state + category + beneficiary type
   simultaneously, with instant results.

Monetized later via ads, so **SEO and original content are non-negotiable** — ad
networks reject thin/scraped sites, and duplicate content does not rank.

---

## 2. Hard constraints (do not violate)

- **Do NOT scrape or copy text** from govtschemes.in or any private aggregator.
- **Do NOT build on myScheme's internal/backend API** (api.myscheme.gov.in with a
  reverse-engineered key). That is effectively scraping their backend.
- **Facts are reusable; prose is not.** Eligibility amounts, deadlines, criteria,
  application steps = free to use. Their *wording* = rewrite entirely in our own words.
- **Eligibility must be machine-readable structured data**, never just prose. It powers
  both headline features.
- **GODL-India compliance:** even official govt data generally requires attribution and
  must not imply government endorsement. Add a clear source/attribution line on every
  scheme page and a site-wide disclaimer from day one.
- Verify every scheme's facts against the live official source before publishing it.
- **Never publish LLM-generated prose unreviewed.** Enforced structurally, not by
  discipline: the static export renders only `status = 'published'` prose (see D5).

---

## 3. Data sourcing strategy (corrected & verified)

Priority order, cleanest first:

1. **API Setu** (`directory.apisetu.gov.in`, search tag `myscheme`) — the official MeitY
   Open API platform. Register, get a key, read the OpenAPI specs. **First action in the
   data phase:** confirm exactly which fields/records it exposes (some endpoints may be
   aggregate counts rather than full scheme records). This is the preferred live source.
2. **Public bootstrap dataset** — an existing extracted myScheme dataset (~723 schemes;
   name, description, eligibility, benefits, application process, official link) can be
   used to **seed** structured fields quickly. It is unofficial and dated — treat it as a
   skeleton to clean and re-verify, never as the live source. Attribute it.
3. **data.gov.in** — open government datasets under GODL-India for anything missing.
4. **Official scheme pages** (myScheme public pages, ministry/state portals, PIB) — the
   ground truth used to **verify facts and rewrite prose**.

The eligibility-parsing step (turning prose criteria into the structured `eligibility`
object) is mostly **our own work** — a script + LLM-assisted pass with human review. This
parsing is the moat, not a freebie from any API.

---

## 4. Tech stack (as committed)

- **Next.js (App Router) with `output: 'export'`** — a fully static site: one pre-rendered
  page per scheme and **no server runtime at all** (D1). Postgres is queried at build time
  only; the deploy artifact is plain HTML/JS/CSS. Currently Next 16.2 / React 19.2 / TS 6.
- **Hosting: Cloudflare Pages** (NOT Vercel). Vercel's free Hobby plan is **non-commercial
  only**, and we run ads. Cloudflare's free tier permits commercial use + unlimited
  bandwidth. Static export means we skip the OpenNext/Workers adapter and stay portable.
  LIVE: https://schemes-directory.pages.dev
- **TypeScript** throughout. Plain CSS, no UI framework (D8).
- **Database: Neon Postgres (free tier)** as source of truth; `eligibility` as `jsonb`.
  **Build-time only** — the live site never opens a DB connection (D1). One Neon instance
  serves both local dev (`.env`) and Cloudflare builds (env var) — no local DB (D13).
- **Search: build-time static JSON index + client-side filtering. No search server** (D2).
  Keyword search later via Pagefind/MiniSearch. Typesense/Meilisearch only if we ever
  exceed ~10k docs.
- **Eligibility checker** = deterministic rules engine over the `eligibility` object,
  running **entirely in the browser** — answers never leave the user's device (D1). No ML.
- **schema.org / JSON-LD** (`GovernmentService`) on every scheme page.
- **No ORM** (D10): raw SQL via `postgres` driver + Zod validation at every boundary.
- **Tests:** Node's built-in `node --test` + Node 24 type-stripping; no jest/vitest (D18).

### Cost to production (target: free)
- **Domain: ~₹800/year** — required because AdSense won't approve a free subdomain.
- **LLM prose pass: ₹0 to ~₹1,000 total** for ~1000 schemes (cheap OpenAI model, D5).
- **Realistic floor ≈ ₹800/year (just the domain).**

---

## 5. The data model (design everything around this)

```ts
// Language-neutral facts — table `schemes`.
type Scheme = {
  id: string;
  slug: string;
  name: string;                  // canonical official name (slug source)
  level: 'central' | 'state';
  state: string | null;          // null for central; CHECK enforces consistency
  categories: string[];

  benefit: {                     // jsonb
    type: string;                // cash | pension | insurance | loan | subsidy | ...
    amount: number | null;
    frequency: 'one_time' | 'monthly' | 'yearly' | null;
    note?: string;
  };

  // MACHINE-READABLE — powers checker + filters. THE MOAT.
  // Convention (D9/D11): an OMITTED key = NO CONSTRAINT. No 'any' sentinels.
  // other_flags are positively phrased, incl. negations ('not_income_tax_payer').
  eligibility: {                 // jsonb
    age_min?: number;
    age_max?: number;
    income_max?: number;         // annual HOUSEHOLD income, ₹ (D9)
    gender?: 'female' | 'male';
    occupation?: string[];       // applicant matches ANY
    caste?: ('GEN'|'OBC'|'SC'|'ST')[];
    residence_state?: string[];
    other_flags?: string[];      // ALL must hold; surfaced as "to confirm"
  };

  documents: string[];
  official_url: string;
  source: string;                // attribution (GODL-India)
  last_verified: string | null;  // null = facts pending owner verification
};

// Per-locale prose — table `scheme_translations`, one row per (scheme, locale).
// Hindi later = INSERT rows + add 'hi' to LOCALES + rebuild. Zero migration (D4).
type SchemeTranslation = {
  scheme_id: string;
  locale: 'en' | 'hi';
  name: string;                  // display name in this locale
  summary: string;               // ~160 chars: meta description + cards (D12)
  eligibility_prose: string;     // OUR words
  benefits_prose: string;        // OUR words
  how_to_apply: string;          // OUR words
  status: 'missing' | 'llm_unverified' | 'published';  // D5 gate
  // The static export renders ONLY status === 'published' (D5) — unreviewed
  // LLM text physically cannot ship.
};
```

---

## 6. Build phases (smallest shippable slice first — DO NOT skip ahead)

**Phase 0 — Scaffold + deploy pipeline** ✅ SHIPPED
- [x] Next.js App Router + TS + `output: 'export'` + `trailingSlash`. Plain CSS (D8).
- [x] `/[locale]/` routing (`en` only, D4); `public/_redirects` maps `/` → `/en/`.
- [x] Site-wide disclaimer + attribution footer (§2).
- [x] `docker-compose.yml` (optional local DB) + `.env.example`.
- [x] `npm run build` → static `out/`; deployed to Cloudflare Pages.
- ✅ *Ship test PASSED:* https://schemes-directory.pages.dev/en/ live, `/`→`/en/` 301.

**Phase 1 — Data model + 10 hand-entered schemes** ✅ SHIPPED
- [x] Postgres schema: `schemes` + `scheme_translations` (status, D4/D5), CHECK constraints.
- [x] 10 real schemes (8 central + MP/WB), structured `eligibility` + original prose.
      Volatile facts checked vs live sources 2026-06-02 (header of `data/seed.ts`).
- [x] Build-time loader (`lib/schemes.ts`, D5 gate) + scheme page: JSON-LD, attribution,
      hreflang, eligibility chips. Verified in built HTML.
- [ ] OWNER: verify each seed scheme on its official portal, stamp `last_verified`
      (open: Kanyashree K1 ₹1,000/yr, Ujjwala refill cap, Ladli Behna registration window).
- ✅ *Ship test PASSED:* 10 scheme pages live with valid structured data.

**Phase 2 — Eligibility checker (client-side rules engine)** ✅ BUILT (deploy pending)
- [x] Build-time index (`scripts/build-index.ts`, npm `prebuild`/`predev`) →
      `public/index/<locale>/schemes.json`. Matchable fields only, NO prose leak (verified).
- [x] Pure matcher (`lib/matcher.ts`), 8 unit tests (`npm test`). Three-valued logic (D15).
- [x] Questionnaire (`Checker.tsx`), in-browser, single static fetch, privacy note (D1);
      options derived from index (D17); ranks eligible>maybe then by benefit (D16).
- ✅ *Ship test:* unit tests pass + real-data simulation correct. Pending: push + live URL.

**Phase 3 — Faceted browse (no search server, D2)**
- [ ] Reuse the Phase 2 JSON index; filter by state × category × beneficiary, client-side.
- [ ] Filter state synced to URL (shareable / SEO-able).
- ✅ *Ship test:* combined filters return correct subsets instantly.

**Phase 4 — Data pipeline (the risky phase — go slow)**
- [ ] **First:** register on API Setu, fetch **ONE** record, show raw JSON before mapping.
- [ ] Mapper: source record → `Scheme` (structured fields) + Zod.
- [ ] Eligibility-prose → structured `eligibility` parser (script + LLM pass, human review).
- [ ] Bootstrap structured fields from the public dataset (attributed); flag `unverified`.
- [ ] Bulk-import structured fields; pages w/o published prose show facts + "verifying" note.
- ✅ *Ship test:* pilot (~100 schemes, D7) imported; search + checker work across it.

**Phase 5 — LLM prose pass + review workflow**
- [ ] Prose generator: cheap OpenAI model, model name a SINGLE config constant; output
      saved as `llm_unverified` — never exported (D5).
- [ ] **Review tool as first-class UX (D6, owner directive):** side-by-side LLM draft vs
      official source link, keyboard-driven approve/edit/reject, running queue counter.
      Owner review speed is the bottleneck — ergonomics over code elegance.
- [ ] Approve → `published` + `last_verified`. Clear the ~100-scheme pilot queue.
- ✅ *Ship test:* ~100 reviewed schemes live with original prose.

**Phase 6 — SEO polish + launch**
- [ ] Sitemap, robots, meta/OG; per-state + per-category hub pages (big SEO surface).
- [ ] Performance + mobile pass.
- [ ] Only after substantial original content exists: apply for ads.

**Phase 7 — Later (post-launch)**
- [ ] Keyword search via Pagefind/MiniSearch, client-side (D2).
- [ ] Hindi: `/hi/` locale — translation rows + locale entry + rebuild (D4).
- [ ] Scale pilot → full catalogue; review-queue burndown.

---

## 7. Working agreement (how the assistant should behave)

- Plan before coding. Explain decisions in 2–3 sentences so I learn.
- One phase at a time; pause for my confirmation between phases.
- Get 10 schemes working end-to-end **before** fetching 1000.
- When I ask "why did you choose X?", stop and explain.
- Keep this file's checkboxes and the Decisions log (below) up to date.

## 8. Decisions log
- **D1 — Fully static export (`output: 'export'`).** Checker + facets run client-side;
  Postgres is build-time only. Zero server = no OpenNext adapter, free-tier-safe, portable;
  and checker answers (income, caste, disability) never leave the browser. No ISR — content
  updates need rebuild + redeploy (minutes, automatable).
- **D2 — No search server.** Facets = build-time JSON index + client-side filtering;
  keyword search later via Pagefind/MiniSearch. Typesense needs an always-on host (conflicts
  with free) and only pays past ~10k docs.
- **D3 — Deploy-first.** Skeleton live on Cloudflare in Phase 0 so deploy surprises surface
  cheaply; every phase ends at a real URL. (Paid off immediately.)
- **D4 — i18n-ready for real.** `/[locale]/` routes (`en` now, `hi` later) from `LOCALES`,
  hreflang in templates, prose in `scheme_translations(scheme_id, locale)`. Eligibility +
  facets stay language-neutral on `schemes`.
- **D5 — Enforced content states** `missing → llm_unverified → published`. Build/index
  select only `published`, so unreviewed LLM prose cannot ship. LLM model = one constant.
- **D6 — Review tool is first-class UX** (owner directive). Side-by-side draft vs source,
  keyboard approve/edit/reject, queue counter. Review speed is the bottleneck.
- **D7 — Pilot launch slice ≈ 100 reviewed schemes** (central flagships + one state).
- **D8 — Plain CSS, no UI framework** for now. Noto Sans in the stack for Devanagari later.
- **D9 — Matcher semantics:** undefined criterion = no constraint; `income_max` = annual
  household income unless flagged in `other_flags`.
- **D10 — Raw SQL + `postgres` driver + Zod; no ORM.** Two tables don't earn an ORM. Bad
  data fails the BUILD via Zod, never a page. Scripts use Node's native TS + `--env-file`.
- **D11 — Eligibility jsonb conventions.** Omitted key = no constraint (no 'any'); flags
  positively phrased incl. negations. KNOWN LIMIT: flat shape can't express OR-combos
  (e.g. Ujjwala "SC/ST OR BPL OR PMAY…") — approximated with one flag; revisit in Phase 4.
- **D12 — `summary` field per locale** (~160 chars): meta description + listing cards.
- **D13 — Neon for dev AND prod; no local DB.** No Docker on dev machine; CF build needs
  Neon anyway (DB build-time only). One connection string, two consumers. compose retained.
- **D14 — Pre-publish fact-check pays:** live check caught 3 stale seed facts (Ladli Behna
  ₹1,250→₹1,500/mo; SVANidhi tranches 10/20/50k→15/25/50k + extended to 2030; Kanyashree
  income ceiling removed). NOTE: background agents can't get web-permission prompts —
  volatile-fact verification runs in the main conversation.
- **D15 — Three-valued matching:** each criterion pass/fail/**unknown** (skipped question
  OR an `other_flags` condition we don't ask). any fail→ineligible(hidden); all pass & no
  unknown→eligible; else→maybe ("confirm these"). Honest > silent false neg/pos.
- **D16 — Rank by headline benefit amount**, eligible above maybe; null amount last.
- **D17 — Questionnaire is data-driven:** occupation/state options derived from the index,
  so new schemes never require editing the form. Only 6 disqualifying questions asked.
- **D18 — `node --test` + Node 24 type-stripping for tests; no jest/vitest.** Requires
  explicit `.ts` on relative imports in `lib/`+`scripts/` (`allowImportingTsExtensions`);
  the bundler accepts them too. Zero test deps.

> ⚠️ 2026-06-07: PLAN.md was found reverted to its original; rebuilt from the live
> codebase + decision history. If you use git to revert, avoid clobbering this file.
