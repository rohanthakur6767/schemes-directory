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

- **Next.js (App Router), SSG** — one pre-rendered static page per scheme. Required for SEO.
- **Hosting: Cloudflare Pages** (NOT Vercel). Reason: Vercel's free Hobby plan is
  **non-commercial use only**, and we will run ads (commercial). Cloudflare Pages' free
  tier permits commercial use and has unlimited bandwidth. Stay on Cloudflare from day one.
- **TypeScript** throughout.
- **Database: Neon Postgres (free tier)** as source of truth; store the `eligibility`
  object as a `jsonb` column. Free tier (10 GB storage, 100 compute-hours/mo, no card) is
  ample for ~1000 schemes + a static site that barely queries at runtime.
- **Search: Typesense or Meilisearch, self-hosted or built at build time** (NOT their paid
  managed cloud) — both are open-source and free to run.
- **Eligibility checker** = a small deterministic rules engine over the `eligibility`
  object. No ML.
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
  name: string;
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

  eligibility_prose: string;     // OUR words, for the page
  benefits_prose: string;        // OUR words
  how_to_apply: string;          // OUR words
  documents: string[];
  official_url: string;
  source: string;                // attribution (GODL-India)
  last_verified: string;         // ISO date
};
```

---

## 6. Build phases (smallest shippable slice first — DO NOT skip ahead)

**Phase 0 — Repo & scaffolding**
- [ ] Init Next.js + TypeScript, Postgres (docker-compose), basic project structure.
- [ ] Add this PLAN.md to repo root; create a `data/` and `lib/` folder.

**Phase 1 — Data model & 10 hand-entered schemes**
- [ ] Implement the `Scheme` type and Postgres schema (eligibility as `jsonb`).
- [ ] Manually enter **10 real schemes** as clean seed data (mix of central + 1–2 states),
      with fully structured `eligibility` and original prose. No fetching yet.
- [ ] Build the static scheme page template (SSG) + JSON-LD + attribution footer.
- ✅ *Ship test:* 10 scheme pages build and render with correct structured data.

**Phase 2 — Eligibility checker (rules engine)**
- [ ] Build the questionnaire → user-profile object.
- [ ] Build the matcher: a scheme passes if every *defined* criterion in its `eligibility`
      object is satisfied by the profile (undefined criteria = no constraint).
- [ ] Rank results by benefit value; show "why you matched."
- ✅ *Ship test:* checker returns correct matches across the 10 seed schemes.

**Phase 3 — Faceted search**
- [ ] Stand up Typesense/Meilisearch; index the 10 schemes.
- [ ] Build UI: filter by state + category + beneficiary type at once, instant results.
- ✅ *Ship test:* combined filters return correct subsets instantly.

**Phase 4 — Data pipeline (the risky phase — go slow)**
- [ ] **First:** register on API Setu and fetch **ONE** real record. Show me the raw JSON
      before writing any mapping code, so we map against reality.
- [ ] Build the mapper: source record → `Scheme` (structured fields).
- [ ] Build the eligibility-prose → structured `eligibility` parser (script + LLM pass).
- [ ] Bootstrap structured fields from the public dataset; flag every record `unverified`.
- [ ] Bulk-import all schemes' **structured** fields. Prose fills in over time; pages with
      no prose yet show structured info and a "details being verified" note.
- ✅ *Ship test:* full catalog imported, search + checker work across all of it.

**Phase 5 — Content, SEO polish, monetization readiness**
- [ ] Rewrite/verify prose in priority order (highest-traffic schemes first).
- [ ] Sitemap, meta tags, performance pass, mobile UX.
- [ ] Only after substantial original content exists: apply for ads.

---

## 7. Working agreement (how the assistant should behave)

- Plan before coding. Explain decisions in 2–3 sentences so I learn.
- One phase at a time; pause for my confirmation between phases.
- Get 10 schemes working end-to-end **before** fetching 1000.
- When I ask "why did you choose X?", stop and explain.
- Keep this file's checkboxes and a short "Decisions log" (below) up to date.

## 8. Decisions log
- _(record stack choices, schema changes, and trade-offs here as we go)_

Option 1. Update PLAN.md §4 and §6: faceted search is a prebuilt static
JSON index, filtered client-side — no search server at launch. Typesense/
Meilisearch becomes a later optional phase only if/when we want fuzzy
full-text search. This keeps us on pure SSG + Cloudflare Pages for free.