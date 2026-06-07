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

**Phase 3 — Faceted browse (no search server, D2)** ✅ BUILT (deploy pending)
- [x] Pure facet engine (`lib/facets.ts`), 8 unit tests. OR within group, AND across (D19).
      `beneficiaries` derived at build time from eligibility (D21), added to the index.
- [x] Browse page `/[locale]/schemes/` (`Browse.tsx`): 3 checkbox facets with per-option
      counts that respect other groups; reuses the Phase 2 index (one fetch, no server).
- [x] Selection synced to URL via `URLSearchParams` + `replaceState` (shareable).
- ✅ *Ship test:* unit tests pass; build verified (browse + detail coexist). Pending: live.

**Phase 4 — Data pipeline (the risky phase — go slow)** — IN PROGRESS
- [x] **Recon (D24):** no official API returns structured eligibility (API Setu myScheme =
      aggregate counts; rich data is behind the forbidden internal API). Bootstrap dataset =
      723 archived myScheme **public-page PDFs** (prose, dated ~Mar 2024). GODL-India permits
      commercial reuse w/ attribution. ⇒ structured eligibility is OUR work (the moat).
- [x] **4a — deterministic extract + clean** (`lib/extract.ts` + `scripts/extract.ts`,
      `npm run extract`, 8 tests). PDF→text (unpdf), cp1252 mojibake fix (D22), chrome strip
      (D23), snapshot-date capture. Output: `data/extracted/<slug>.json` (LLM input). Verified
      on pm-kisan + pm-svanidhi.
- [x] **4b — LLM structured parser** (`lib/llm.ts` + `lib/parse.ts` + `scripts/parse-eligibility.ts`,
      `npm run parse`, 4 tests). fetch + Structured Outputs (no SDK); full object → sparse
      (D11) → Zod. Model = one constant `STRUCTURED_MODEL` (`gpt-4o-mini`). FINDING (D26):
      cheap model nails easy fields but UNDER-EXTRACTS exclusion-based flags (missed
      `not_income_tax_payer` on pm-kisan twice) → drafts, fixed at review. Output `unverified`.
- [x] **4c — import drafts → DB** (`scripts/import-drafts.ts`, `npm run import-drafts`).
      8 drafts imported `llm_unverified`/`pending`; derives official_url; normalises the
      "null"-string quirk (D27) + reconciles level/state for the DB CHECK. NEVER clobbers a
      published scheme (verified seeds protected). Build confirmed: 8 drafts, 0 leak (D5).
- [~] **Scale to pilot (~100, D7):** batch 2 done (16 high-value central + state schemes:
      PM-KUSUM/POSHAN/GKAY/DAKSH/YASASVI, scholarships, housing, farmer insurance). Pipeline
      scaled with zero new bugs; categories auto-normalised; published protected. State now:
      18 published + 16 pending review. Repeat batches → 100. Dataset has ~2066 schemes.
- [ ] **Parallel (owner):** register on API Setu, fetch ONE record → evaluate as future feed.
- ✅ *Ship test (10-scheme slice):* drafts in DB, excluded from site; review tool clears them.

**Phase 5 — LLM prose pass + review workflow** — TOOL BUILT
- [x] **5a — Prose generator** (`lib/prose.ts` + `scripts/generate-prose.ts`, `npm run prose`).
      `PROSE_MODEL` constant; prompt forbids copying (original prose, §2); output a draft
      (`llm_unverified`), never exported (D5). Ran for all 10.
- [x] **5b — Review tool, first-class UX (D6):** LOCAL-ONLY Node server (`npm run review`
      → localhost:5174), never deployed (site is static, D1). Side-by-side official source +
      editable draft; EDITS STRUCTURED FLAGS not just prose (D26); keyboard Ctrl+Enter
      publish / Ctrl+S save / Ctrl+Backspace reject; live queue counter. Zod-validates on
      write. Verified: /api/next + /api/save persist to Neon.
- [x] **OWNER reviewed + published all 8 drafts** (2026-06-07, last_verified stamped). Site
      now has 18 published schemes. FULL PIPELINE PROVEN end-to-end: PDF → extract → LLM
      parse → LLM prose → review → publish → static pages.
- ✅ *Ship test PASSED:* publishing moved schemes into the live build (18 in index, new
      pages render with JSON-LD + prose + verified date). ← pending: push to Cloudflare.

> NOTE: the 8 newly-reviewed schemes have last_verified stamped; the 10 hand-entered seeds
> still show last_verified=null ("pending re-verification"). Optionally run them through the
> review tool too, to stamp dates and confirm against official pages.
> API SETU: parked — PAN verification gate blocks solo registration; revisit only with a
> business PAN / custom domain. Pipeline is source-agnostic so it drops in later if useful.

**Phase 6 — SEO polish + launch** — IN PROGRESS
- [x] `app/sitemap.ts` + `app/robots.ts` (force-static for export). 54-URL sitemap.
- [x] Hub pages: `/[locale]/category/[category]/` + `/[locale]/state/[state]/`
      (`lib/hubs.ts`, 4 tests). State hubs = state-only schemes (unique content, D29).
- [x] Internal links (scheme→hubs, home browse-by sections) + OpenGraph tags.
- [x] **Category normalisation (D30 fixed):** controlled vocab `lib/categories.ts` (16
      canonical) + mapping, enforced in 3 places — normalizer (`npm run normalize-categories`,
      fixed existing 16 schemes, 0 unmapped), importer, parse prompt, AND a checkbox picker in
      the review tool. Hubs: 28 → 15. 6 unit tests.
- [x] **Scheme page redesign (clean UX):** breadcrumbs (+BreadcrumbList JSON-LD), badges,
      two-column layout — section cards (Benefits / Who can apply / How to apply / Documents)
      + sticky sidebar (bold benefit-amount card, key facts, official-site CTA, "on this page"
      jump-nav). Responsive (stacks on mobile). Verified via preview screenshots desktop+mobile.
      Original design — govtschemes.in used only for section-structure reference, no copying (§2).
- [x] **Definitions glossary (D31):** hand-written plain-English defs of scheme jargon
      (`lib/glossary.ts`, 4 tests). A "Key terms explained" card shows only the terms that
      appear on each scheme page. ORIGINAL content → publishable everywhere (no review gate).
- [x] **Category icons (D32):** emoji icon per canonical category (`lib/categoryIcons.ts`)
      on hero badges + home category links. Zero copyright risk; swappable for SVGs later.
- [ ] **NEXT — deeper scheme content (the "details + guidance" ask):** add `faqs` +
      `apply_steps` to `scheme_translations`; generate from source PDFs; render FAQ section
      (+FAQPage JSON-LD rich results) and numbered apply steps; add to review tool. Generate
      for the 16 PENDING first (no D5 issue); enrich the 18 published later via re-review.
- [ ] Performance + mobile pass (broader: home/browse/checker polish).
- [ ] Only after substantial original content exists: apply for ads.

**Phase 7 — Later (post-launch)**
- [ ] Keyword search via Pagefind/MiniSearch, client-side (D2). NOTE: owner expected a
      free-text box on the browse page (2026-06-07) and chose to keep facets-only for now —
      so this is user-validated as wanted; prioritise once the catalogue fills out. A simple
      substring box (name+summary) is the cheap interim if facets feel insufficient sooner.
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

- **D19 — Facet logic: OR within a group, AND across groups.** Standard faceted-search
  behaviour. Per-option counts reflect the OTHER groups' selections (not the group's own),
  so you never tick into zero results.
- **D20 — Browse `state` is a PROPERTY filter, not relevance.** Selecting "MP" shows MP
  schemes only (not MP + central). The checker already answers "what's relevant to me";
  the browse page is a predictable catalog explorer with honest counts. Two tools, two jobs.
- **D21 — `beneficiaries` derived at build time** from structured eligibility
  (`deriveBeneficiaries`), stored in the index for the browse facet. Heuristic on 10 seeds
  (cf. D11); revisit with real data in Phase 4. Matcher ignores the field (kept decoupled).

- **D22 — Encoding: source text is UTF-8 mis-decoded as Windows-1252** (₹ → `â‚¹`).
  `fixMojibake` re-encodes via a cp1252 table then decodes UTF-8; gated on a mojibake
  signature so clean text is never corrupted. (NOTE: PowerShell console misrenders correct
  UTF-8 — verify file contents with Node, not `Get-Content`.)
- **D23 — Strip myScheme UI chrome before the LLM** (sign-in modals, nav, footer) via a
  fixed regex list. Heuristic, source-specific; revisit if the myScheme template changes.
- **D24 — Sourcing reality (recon 2026-06-07):** no turnkey official structured feed.
  Pipeline = acquire skeleton (archived public-page text) → deterministic clean (4a) → LLM
  structured parse (4b) → human verify + import (4c). Every record `unverified` until the
  owner checks it against the live official page (§2). Hybrid: bootstrap now, API Setu eval
  in parallel.
- **D25 — Source PDFs/extracted/parsed text are gitignored** (`data/raw/`,
  `data/extracted/`, `data/parsed/`): bulky, re-downloadable; the DB is the source of truth.
- **D26 — LLM extraction is a DRAFT, not truth** (owner decision 2026-06-07). Cheap model
  (`gpt-4o-mini`, one swappable constant) reliably extracts easy fields but UNDER-extracts
  nuanced exclusion rules into `other_flags` (verified: missed `not_income_tax_payer` on
  pm-kisan even with explicit prompting). Chosen path: keep cheap model (~₹0), correct at
  review. ⇒ the review tool MUST support editing structured flags, not just prose. Validate
  drafts against hand-entered ground truth where it exists.

- **D27 — Normalise LLM "null"-string + reconcile level/state at import.** The model
  sometimes returns the literal string "null"/"none"/"" for a field; `nullifyString` coerces
  these to real null. To satisfy the DB CHECK `(level='state')=(state not null)`, the import
  derives `level` from `state` presence. Both belt-and-suspenders for drafts (fixed in review).
- **D28 — Review tool is a LOCAL-ONLY Node server, separate from the static site.** The
  public site has no runtime (D1) so it can't write to the DB; the review tool
  (`npm run review`, localhost:5174) is a small `node:http` server (no framework, D10) that
  reads/writes Neon directly and is never deployed. `review_status` (pending/published/
  rejected) drives the queue, distinct from `status` (the publish/export gate).

- **D29 — Hub pages for SEO.** Static, crawlable, uniquely-titled `/category/<x>/` and
  `/state/<x>/` pages (the long-tail ranking surface) + internal links. State hubs list only
  that state's schemes to avoid duplicate central content across every state page. Only hubs
  with ≥1 scheme are generated (no thin/empty pages). The browse page stays the client-side
  filter UX; hubs are its SEO counterpart.
- **D30 — Controlled category vocabulary (FIXED 2026-06-07).** 16 canonical, search-term
  categories in `lib/categories.ts` + a drifted-label→canonical MAP. Enforced in 3 layers so
  drift can't return: (1) `normalize-categories` script fixed the existing DB; (2) `import-drafts`
  normalises future drafts; (3) the parse prompt constrains the LLM to the list; (4) the review
  tool shows a checkbox PICKER instead of free text. Result: 28 hubs → 15. Same lesson as D26 —
  free-text LLM fields drift; constrain them to a vocabulary. (Note: `Housing` canonical exists
  but isn't yet populated — the home-loan scheme's source labels didn't say "housing"; reviewer
  can add it via the picker.)

- **D31 — Definitions glossary is hand-authored, not LLM** (2026-06-07). Plain-English defs
  of jargon (DBT, Aadhaar, eKYC, BPL, SECC, SC/ST/OBC…) in `lib/glossary.ts`; each scheme page
  shows only the terms found in its prose. Hand-written = our content = publishable with no
  review gate, so it lifts ALL pages immediately (trust + comprehension + unique SEO content).
- **D32 — Category icons via emoji** (not SVG, for now). Standardised glyphs, zero copyright
  risk, consistent on modern devices, instant. Map in `lib/categoryIcons.ts`; callers read it,
  so a future swap to branded SVGs touches one file.

> ⚠️ 2026-06-07: PLAN.md was found reverted to its original once; rebuilt from the live
> codebase + decision history. If you use git to revert, avoid clobbering this file.
