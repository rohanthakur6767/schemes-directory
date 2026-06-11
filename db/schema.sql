-- Schema v1 (Phase 1).
-- Migration strategy for now: this file is idempotent (IF NOT EXISTS) and applied
-- whole. When the schema starts *evolving* (Phase 4-ish) we graduate to numbered
-- migration files. Don't build migration machinery before there are migrations.

create table if not exists schemes (
  id            text primary key,            -- stable id; = slug for hand-entered seeds
  slug          text unique not null,
  name          text not null,               -- canonical official name (slug source)
  level         text not null check (level in ('central', 'state')),
  state         text,
  categories    text[] not null default '{}',
  benefit       jsonb not null,              -- { type, amount, frequency, note? }
  eligibility   jsonb not null,              -- structured object — the moat (PLAN §5, D11)
  documents     text[] not null default '{}',
  official_url  text not null,
  source        text not null,               -- attribution line (GODL-India, PLAN §2)
  last_verified date,                        -- NULL = facts pending owner verification
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Data quality enforced by the DB, not by discipline: a state scheme MUST
  -- name its state, a central scheme MUST NOT. `(a) = (b)` is boolean equality.
  check ((level = 'state') = (state is not null))
);

-- Per-locale prose (D4). Hindi later = INSERT rows, zero schema change.
create table if not exists scheme_translations (
  scheme_id         text not null references schemes(id) on delete cascade,
  locale            text not null check (locale in ('en', 'hi')),
  name              text not null,           -- display name in this locale
  summary           text not null default '',-- ~160 chars: meta description + cards (D12)
  eligibility_prose text not null default '',
  benefits_prose    text not null default '',
  how_to_apply      text not null default '',
  -- D5: the content gate. The site build only ever selects 'published'.
  status            text not null default 'missing'
                    check (status in ('missing', 'llm_unverified', 'published')),
  updated_at        timestamptz not null default now(),
  primary key (scheme_id, locale)
);

-- No indexes yet, deliberately: ~1000 rows queried only at build time. We add an
-- index when a real query is measurably slow, not because jsonb columns exist.

-- --- Schema evolution (Phase 4c) -----------------------------------------
-- First real change since v1. schema.sql stays idempotent (applied whole), so
-- evolutions are additive ALTER ... IF NOT EXISTS until churn justifies numbered
-- migrations (D10).
alter table schemes add column if not exists source_snapshot_date date;  -- dated source page
alter table schemes add column if not exists llm_notes text;             -- model's reviewer hint
-- review_status on the translation drives the Phase 5 queue. 'pending' = a draft
-- awaiting human review; published is the live gate (D5). Separate from `status`
-- so we can tell "LLM wrote it" (status) from "human acted on it" (review_status).
alter table scheme_translations add column if not exists review_status text
  not null default 'pending' check (review_status in ('pending', 'published', 'rejected'));
-- The ALTER above defaulted EXISTING rows (incl. already-published seeds) to
-- 'pending'. Reconcile: anything already published is, by definition, reviewed.
-- Idempotent, so it self-heals on every migrate.
update scheme_translations set review_status = 'published'
  where status = 'published' and review_status <> 'published';
-- Deeper per-locale content (D33): numbered application steps + FAQs.
alter table scheme_translations add column if not exists apply_steps jsonb not null default '[]';
alter table scheme_translations add column if not exists faqs jsonb not null default '[]';
-- Extra labelled links + contact info (scheme-level — same across locales).
-- relevant_links: [{label,url}] · contacts: {toll_free,phones,emails}. Rendered
-- only when non-empty; sanitised upstream so URLs are always valid http(s).
alter table schemes add column if not exists relevant_links jsonb not null default '[]';
alter table schemes add column if not exists contacts jsonb not null
  default '{"toll_free":[],"phones":[],"emails":[]}';
