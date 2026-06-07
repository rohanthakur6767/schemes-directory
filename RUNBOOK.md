# RUNBOOK — running the scheme pipeline yourself

Cheat-sheet for adding schemes and publishing, without help. Run everything from
the project root (`D:\Website\Govtschemes`).

---

## One-time setup (already done — just for reference)

`.env` must contain (it's gitignored — never commit it):

```
DATABASE_URL=postgresql://…           # Neon
OPENAI_API_KEY=sk-…                   # for parse + prose (cheap model)
CLOUDFLARE_DEPLOY_HOOK=https://…      # for the "Deploy live" button
```

---

## 1. Add a new batch of schemes

Run these five, in order. Steps 3 & 4 use the LLM and are **incremental** — they
only process schemes that are new since last time, so it's safe to re-run.

```powershell
npm run fetch -- 20      # download 20 NEW scheme PDFs   ← set batch size here
npm run extract          # PDF → cleaned text  (fast, no LLM)
npm run parse            # text → structured facts  (LLM; only new schemes)
npm run prose            # facts → summary + steps + FAQs  (LLM; only new schemes)
npm run import-drafts    # load into the database as 'pending'  (never touches published)
```

**Batch size:** change the number after `--`. `npm run fetch -- 15` gets 15,
`npm run fetch -- 30` gets 30. Default is 20 if you omit it. Keep batches to
~15–20 so the review queue stays clearable in one sitting.

After this, the new schemes are in the database as **drafts** — NOT on the live
site yet.

---

## 2. Review and publish

```powershell
npm run review           # opens the tool at http://localhost:5174
```

For each scheme in the queue:
1. Open the **official page** (button on the left) and check the facts.
2. Fix anything wrong — especially **eligibility flags** (the model misses
   exclusions) and **categories**. Add missing flags. Make sure the **official
   URL** is a full `https://…` link.
3. Keyboard: **Ctrl+Enter** = Publish · **Ctrl+S** = Save draft · **Ctrl+Backspace** = Reject.

Reject anything too thin or off-topic — quality beats quantity for ads/SEO.

---

## 3. Deploy to the live site

In the review tool, click **“Deploy live ↗”** (top bar) once you've published a
batch. Your changes go live in **~2 minutes**. One click per batch — not per scheme.

> Publishing writes to the database; the live site only updates when a build runs.
> The Deploy button triggers that build. (No need to run `npm run build` yourself.)

---

## Handy commands

```powershell
npm run status           # how many published / pending / rejected
npm run parse -- aaby    # FORCE re-parse specific scheme(s) (e.g. after a fix)
npm run prose -- aaby    # FORCE re-generate prose for specific scheme(s)
npm run dev              # preview the site locally at http://localhost:3000/en/
npm test                 # run the unit tests
```

---

## Gotchas

- **Never commit `.env`.** Run `git status` before committing — it must not appear.
- `data/raw`, `data/extracted`, `data/parsed` are scratch (gitignored). The
  **database is the source of truth.**
- A scheme is only live after you **Publish** it AND click **Deploy live**.
- If `npm run parse`/`prose` says "nothing new", everything downloaded is already
  done — that's expected. Run `npm run fetch -- N` first to get more.
- Shipping code changes (not scheme data) still needs a normal
  `git add -A && git commit && git push`.

---

## The whole loop, in one glance

```
fetch → extract → parse → prose → import-drafts → review (Publish) → Deploy live
                  └──── LLM, incremental ────┘     └─ you verify ─┘   └ ~2 min ┘
```
