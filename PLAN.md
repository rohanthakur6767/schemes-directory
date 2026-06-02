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

## 4. Tech stack (challenge me if you disagree before we commit)

- **Next.js (App Router) with `output: 'export'`** — a fully static site: one pre-rendered
  page per scheme and **no server runtime at all** (D1). Postgres is queried at build time
  only; the deploy artifact is plain HTML/JS/CSS.
- **Hosting: Cloudflare Pages** (NOT Vercel). Reason: Vercel's free Hobby plan is
  **non-commercial use only**, and we will run ads (commercial). Cloudflare Pages' free
  tier permits commercial use and has unlimited bandwidth. Bonus of static export: we skip
  the OpenNext/Workers adapter entirely and stay portable (Pages, Netlify, S3 — anything).
- **TypeScript** throughout.
- **Database: Neon Postgres (free tier)** as source of truth; store the `eligibility`
  object as a `jsonb` column. **Build-time only** — the live site never opens a DB
  connection. Local dev runs Postgres via docker-compose.
- **Search: build-time static JSON facet index + client-side filtering. No search server**
  (D2). Typo-tolerant keyword search comes later via Pagefind/MiniSearch (also client-side,
  zero infra). Typesense/Meilisearch reconsidered only if we someday exceed ~10k documents.
- **Eligibility checker** = a small deterministic rules engine over the `eligibility`
  object, running **entirely in the browser** — answers (income, caste, disability) never
  leave the user's device (D1). No ML.
- Add **schema.org / JSON-LD** structured markup on scheme pages for search rich results.

### Cost to production (target: free)
Everything above runs on free tiers. Two near-unavoidable costs:
- **Domain: ~₹800/year** — required because AdSense won't approve a free subdomain.
- **LLM prose-rewriting pass: ₹0 to ~₹1,000 total** for all ~1000 schemes (see token math
  in §6, Phase 4). Drive to ₹0 by using a provider free tier, a local open model, or
  writing prose manually for the high-priority schemes first.
**Realistic floor ≈ ₹800/year (just the domain).**

---

## 5. The data model (design everything around this)

```ts
type Scheme = {
  id: string;
  slug: string;
  name: string;                  // canonical official name (slug source); per-locale display names below
  level: 'central' | 'state';
  state: string | null;          // null for central
  categories: string[];          // e.g. ['Scholarship','Education']

  benefit: {
    type: string;                // cash | subsidy | loan | service | ...
    amount: number | null;
    frequency: string | null;    // one-time | monthly | yearly
  };

  // MACHINE-READABLE — powers checker + filters. This is the moat.
  eligibility: {
    age_min: number | null;
    age_max: number | null;
    income_max: number | null;
    gender: 'any' | 'female' | 'male';
    occupation: string[];        // farmer, student, widow, unemployed...
    caste: string[];             // GEN, OBC, SC, ST, any
    residence_state: string[];   // [] or ['any'] = no state restriction
    other_flags: string[];       // disabled, BPL, minority, ...
  };

  documents: string[];
  official_url: string;
  source: string;                // attribution (GODL-India)
  last_verified: string;         // ISO date
};

// Per-locale prose — one row per (scheme, locale). Hindi later = insert rows + add
// 'hi' to the locale list + rebuild. Zero schema migration (D4).
type SchemeTranslation = {
  scheme_id: string;
  locale: 'en' | 'hi';
  name: string;                  // display name in this locale
  eligibility_prose: string;     // OUR words, for the page
  benefits_prose: string;        // OUR words
  how_to_apply: string;          // OUR words
  status: 'missing' | 'llm_unverified' | 'published';
  // The static export renders ONLY status === 'published' prose (D5) —
  // unreviewed LLM text physically cannot ship.
};
```

---

## 6. Build phases (smallest shippable slice first — DO NOT skip ahead)

**Phase 0 — Scaffold + deploy pipeline** ← CURRENT
- [x] Hand-rolled minimal Next.js scaffold: App Router, TypeScript, `output: 'export'`,
      `trailingSlash: true`. Plain CSS, no UI framework (D8). (Next 16.2 / React 19.2 / TS 6)
- [x] `/[locale]/` routing, `en` only for now (D4); `public/_redirects` maps `/` → `/en/`.
- [x] Site-wide disclaimer + attribution footer (required by §2, from day one).
- [x] `docker-compose.yml` for local Postgres (first used in Phase 1) + `.env.example`.
- [x] `npm run build` emits the static site to `out/` (verified: `out/en/index.html`,
      `lang="en"`, disclaimer present, no root page so `_redirects` handles `/`).
- [ ] Push to GitHub; connect repo to Cloudflare Pages (build `npm run build`, output `out`).
      ← OWNER STEP, see instructions below §6 or ask the assistant.
- ✅ *Ship test:* public `*.pages.dev` URL serves the skeleton (D3).

**Phase 1 — Data model + 10 hand-entered schemes**
- [ ] Postgres schema: `schemes` (language-neutral facts + `eligibility` jsonb) and
      `scheme_translations` (per-locale prose + content `status`, D4/D5) + provenance columns.
- [ ] Manually enter **10 real schemes** (mix central + 1–2 states) with fully structured
      `eligibility` and original prose. No fetching yet.
- [ ] Build-time data loader (Postgres → static props) + scheme page template:
      JSON-LD, source attribution, hreflang.
- ✅ *Ship test:* 10 scheme pages live on Cloudflare with valid structured data.

**Phase 2 — Eligibility checker (client-side rules engine)**
- [ ] Questionnaire → user-profile object.
- [ ] Pure, unit-tested matcher: a scheme passes if every *defined* criterion in its
      `eligibility` object is satisfied by the profile (undefined criteria = no constraint).
- [ ] Runs entirely in the browser against the static index — answers never leave the
      device (D1); say so on the page.
- [ ] Rank results by benefit value; show "why you matched."
- ✅ *Ship test:* correct matches across the 10 seeds; matcher unit tests pass.

**Phase 3 — Faceted browse (no search server, D2)**
- [ ] Build-time JSON facet index (slug, name, state, categories, beneficiary facets).
- [ ] Filter UI: state × category × beneficiary type at once, instant, client-side.
- [ ] Filter state synced to the URL (shareable / linkable).
- ✅ *Ship test:* combined filters return correct subsets instantly.

**Phase 4 — Data pipeline (the risky phase — go slow)**
- [ ] **First:** register on API Setu and fetch **ONE** real record. Show me the raw JSON
      before writing any mapping code, so we map against reality.
- [ ] Build the mapper: source record → `Scheme` (structured fields).
- [ ] Build the eligibility-prose → structured `eligibility` parser (script + LLM pass,
      human review).
- [ ] Bootstrap structured fields from the public dataset (attributed); flag every record
      `unverified`.
- [ ] Bulk-import **structured** fields. Pages without published prose render structured
      facts + a "details being verified" note.
- ✅ *Ship test:* pilot set (~100 schemes, D7) imported; search + checker work across it.

**Phase 5 — LLM prose pass + review workflow**
- [ ] Prose generator: cheap OpenAI model, model name a **single config constant**; output
      saved as `llm_unverified` — never exported (D5).
- [ ] **Review tool as first-class UX (D6):** side-by-side LLM draft vs official source
      link, keyboard-driven approve / edit / reject, running queue counter. Review speed
      is the bottleneck — ergonomics over code elegance.
- [ ] Approve → `published` + `last_verified` stamp. Clear the ~100-scheme pilot queue.
- ✅ *Ship test:* ~100 reviewed schemes live with original prose.

**Phase 6 — SEO polish + launch**
- [ ] Sitemap, robots, meta/OG tags; per-state and per-category hub pages (big SEO surface).
- [ ] Performance + mobile pass.
- [ ] Only after substantial original content exists: apply for ads.

**Phase 7 — Later (post-launch)**
- [ ] Typo-tolerant keyword search via Pagefind/MiniSearch, client-side (D2).
- [ ] Hindi: `/hi/` locale — translations rows + locale list entry + rebuild (D4).
- [ ] Scale from the 100-scheme pilot to the full catalogue; review-queue burndown.

---

## 7. Working agreement (how the assistant should behave)

- Plan before coding. Explain decisions in 2–3 sentences so I learn.
- One phase at a time; pause for my confirmation between phases.
- Get 10 schemes working end-to-end **before** fetching 1000.
- When I ask "why did you choose X?", stop and explain.
- Keep this file's checkboxes and a short "Decisions log" (below) up to date.

## 8. Decisions log
- **D1 (2026-06-02) — Fully static export (`output: 'export'`).** Checker + facets run
  client-side; Postgres is build-time only. Why: zero server = no OpenNext/Workers adapter,
  free-tier-safe, fully portable hosting; and checker answers (income, caste, disability)
  never leave the browser — a trust/privacy differentiator. Trade-off: no ISR; content
  updates require rebuild + redeploy (minutes, automated).
- **D2 (2026-06-02) — No search server.** Facets = build-time JSON index + client-side
  filtering. Keyword search later via Pagefind/MiniSearch. Typesense/Meilisearch would need
  an always-on host (conflicts with free-tier goal) and only pays off past ~10k docs.
- **D3 (2026-06-02) — Deploy-first.** Skeleton goes live on Cloudflare Pages in Phase 0 so
  deploy surprises surface while they're cheap; every phase ends at a real URL.
- **D4 (2026-06-02) — i18n-ready for real.** `/[locale]/` routes (`en` now, `hi` later),
  hreflang in templates, prose in `scheme_translations(scheme_id, locale)`. Eligibility +
  facets stay language-neutral on `schemes`.
- **D5 (2026-06-02) — Enforced content states.** `missing → llm_unverified → published`.
  The static export renders only `published` prose, so unreviewed LLM text cannot ship.
  LLM model name = one config constant (cheap OpenAI model).
- **D6 (2026-06-02) — Review tool is first-class UX** (owner directive). Side-by-side LLM
  draft vs official source, keyboard-driven approve/edit/reject, running queue counter.
  Owner review speed is the bottleneck: ergonomics > code elegance.
- **D7 (2026-06-02) — Pilot launch slice ≈ 100 reviewed schemes** (central flagships + one
  pilot state), then mechanical scale-out.
- **D8 (2026-06-02) — Plain CSS, no UI framework for now.** Content site, simple design,
  fewer deps. Font stack includes Noto Sans (good Devanagari coverage for the Hindi phase).
  Revisit if design complexity grows.
- **D9 (2026-06-02) — Matcher semantics locked:** undefined criterion = no constraint;
  `income_max` = annual household income unless flagged otherwise in `other_flags`.
