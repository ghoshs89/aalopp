# Session Handoff  2026-09-13  Phases 0 to 2 and 4 live; next is real-device stylus testing, then Phase 3 after real use

> Read this fully before acting. It is the state of the work as of the end of the last session. Assume you have no memory of that session and may be a different model. This document plus the repository should be enough to resume.
>
> Before trusting any claim below, the previous session should have verified it against the repo, not the conversation. If a section says "assumed", treat it as unconfirmed.

## How this was verified
Commands run on 2026-09-13 from the repo root (`aalopp/`) after the Phase 4 changes, all exit code 0:
- `npm test`: pass. 16 test files, 79 tests (includes `src/lib/engine/simulation.test.ts`).
- `npm run content:check`: pass. 37 skills, 247 questions, all `"reviewed"`.
- `npm run typecheck`: pass. No errors.
- `npm run lint`: pass. No problems.
- `npm run build`: compiled successfully.

Repo state: Phase 4 committed as `1e8d91e` and pushed; this docs update is committed on top of it. No em dashes in `CLAUDE.md`, `docs/` or `content/REVIEW.md`.

## 1. Current state
- Works and verified:
  - Live at `https://aalopp.vercel.app`: Phases 0, 1, 2 and 4. Vercel reported "Deployment has completed" for `1e8d91e` (Phase 4), and `/api/health` returned 200 afterwards.
  - Both family Google accounts sign in on production (new `auth.users` sign-ins at 14:45 and 14:46 UTC on 2026-09-13, each with an active `auth.sessions` row).
  - All 247 questions passed an independent blind solve (187 generated, 39 hand-typed, 21 Find the Bug). Record in `content/REVIEW.md`.
  - Phase 4 locally: scratchpad and Find the Bug work in headless Chrome at 384 px and 820 px wide (mouse and touch strokes, undo, hidden per question, correct and wrong feedback, no sideways scroll, no console errors).
  - Production database already has the Phase 4 migration `20260913180000_attempt_scratchpad` (nullable columns, so the live Phase 2 code is unaffected). `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma` printed an empty migration. A probe sync saved `step` answers and scratchpad fields, then the probe student was deleted.
- In progress: nothing. Phase 4 is committed and deployed.
- Broken or known failing: none observed.
- Assumed, not verified:
  - A real stylus (Apple Pencil, S Pen) draws with pressure, and palm rejection works on a physical tablet. Only mouse and emulated touch were tested.
  - The offline answer queue after a real Wi-Fi drop (never exercised on a device).
  - The Vercel cron calls `/api/health` daily (route works by hand; no cron run observed).
  - Real usage by Aishik: only the parent's test sessions exist.

## 2. Decisions made this session
All are in `docs/DEVLOG.md` with reasons and attribution. Treat as settled; do not reopen without new cause.
- Revised build plan (thin vertical slices) instead of the original AALOPP specification. Assistant review, parent approved.
- Hosting: Vercel and Supabase; TrueNAS pulls backups (planned). Parent decision.
- Google sign-in with `ALLOWED_EMAILS` (both family accounts) and `PARENT_PIN`. Parent confirmed the second account.
- Row Level Security on every table with no policies; all data access server-side through Prisma 7.10.0.
- Content review rule: a question is `"reviewed"` only after an independent blind solve; parent spot-checks. Parent's reason: "Time constraints."
- Generators compute answers; mixed US and Canadian units (parent decision, reason not stated).
- Engine: mastery at 4 of the last 5 right on 2 or more device-local days; reviews after 1, 3, 7 and 14 days; caps of 2 retries, 3 reviews and 2 per skill; 2 stretch slots; at least 3 everyday-skill questions; every strand starts at level 2; tuned with `src/lib/engine/simulation.test.ts`.
- Sessions are 8 questions with a quiet 12 minute cap and no visible timer.
- Phase 4 before Phase 3 (parent decision). Scratchpad stores only mode and stroke count, never drawings. Find the Bug asks for the first wrong step, with skill `CS-DEBUG`.
- Migrations run on every production deploy and must stay compatible with the previous deployment.
- `docs/ROADMAP.md` is the in-repo plan.

## 3. Constraints and invariants the next session must not violate
Standing rules in `CLAUDE.md`: Row Level Security on every table with server-side data access only, no `any`, skill state replayed never stored, no em dashes anywhere, process over speed.
- Never edit `content/questions/generated-*.json` by hand. Change `scripts/generate/*.ts` and run `npm run content:generate`; otherwise `scripts/generate/generate.test.ts` fails.
- A new question file must be imported in `src/content/bank.ts`, or `src/content/bank.test.ts` fails and the file never reaches production.
- Only `"reviewed"` questions reach the child (`src/app/play/[studentId]/page.tsx`). Do not mark a question reviewed without an independent blind solve, and log each round in `content/REVIEW.md`.
- Migrations deploy automatically on push (`vercel-build`). Breaking compatibility with the previous deployment makes live answer uploads fail during the rollout.
- Keep `Attempt.localDate` nullable until older app versions cached on devices are gone; `src/lib/sync.ts` fills it.
- Do not record a reason in `docs/DEVLOG.md` that the parent did not give. Write "not stated" or "pending".
- Do not commit or push unless the parent asks; the `/handoff` procedure never commits.
- Rerun `src/lib/engine/simulation.test.ts` after changing any engine cap.

## 4. Next steps, prioritized
- Try Phase 4 on a real tablet or phone with a stylus | strokes appear with varying width, a resting palm does not draw, the Answers tab shows ✏️ and 📝 | `src/components/Scratchpad.tsx`, `src/app/parent/page.tsx`.
- Phase 3, parent dashboard | after 1 to 2 weeks of real answers | `src/app/parent/page.tsx`, `src/components/parent/SkillProgress.tsx`, `src/lib/engine/skill-state.ts`; scratchpad use per skill is now available in `Attempt.scratchpad`.
- Tune the engine from real data | after a week or more of use; compare real accuracy and review share with the simulation | `src/lib/engine/select-session.ts`, `src/lib/engine/simulation.test.ts`.
- Content batch 2, including more Find the Bug questions | in about 3 to 4 weeks | `scripts/generate/`.

## 5. Open questions and blockers
- Parent action, not blocking code: set up the TrueNAS backup (`docs/backup-truenas.md`); until then answer data exists only in Supabase, whose free plan has no downloadable backups.
- Parent action: repeat the Wi-Fi drop test on a phone.
- Parent input: is 8 questions the right session length? Asked, not yet answered.
- Parent spot-check suggestions: `mdl-bus-cm-offset`, `lgr-cars-4x4`, `lsp-zoo-best-route`, `mdc-ca-piggy-bank`, `gs-fan-triangles-4`, `lrv-undo-the-walk`, `bb-beaver-color-path`, `kl12-folded-rope-cut`, `kl12-symmetric-butterfly`, plus two Find the Bug items: `dbg-sub-52-18-trade`, `dbg-elapsed-past-sixty`.

## 6. Dead ends
Also in `docs/DEVLOG.md`.
- Detecting a new deployment by matching `/_next/static/chunks/` in page HTML. Next.js 16 uses `/_next/static/immutable/chunks/`. Use `gh api repos/ghoshs89/aalopp/commits/<sha>/status` instead.
- `npx prisma migrate diff --from-migrations` needs a shadow database. Use `--from-empty` or `--from-config-datasource` as described in the DEVLOG entry.
- Editing the single-line JSON content files with Python slice indexes produced invalid JSON. Replace exact unique strings, and guard with `json.loads` before writing.

## 7. Orientation for a cold reader
`CLAUDE.md` covers the stack, commands and standing rules; `docs/ROADMAP.md` covers the plan. This section is only what matters for resuming.
- Where things live:
  - Child flow: `src/app/play/[studentId]/page.tsx` loads attempts and calls `selectSession` (`src/lib/engine/select-session.ts`), which uses `computeSkillStates` (`src/lib/engine/skill-state.ts`), then renders `src/components/Player.tsx`.
  - Answers: `src/lib/outbox.ts` (IndexedDB queue), then `src/app/api/sync/route.ts` and `src/lib/sync.ts`.
  - Grown-ups page: `src/app/parent/page.tsx` (PIN lock in `src/lib/parent-lock.ts`), Skills tab in `src/components/parent/SkillProgress.tsx`.
  - Content: `content/`, validated by `src/content/schema.ts` and `src/content/graph.ts`, bundled by `src/content/bank.ts`; generators in `scripts/generate/`.
  - Local previews without sign-in: `/dev/player?ids=<id,id>` and `/dev/skills` under `npm run dev` (404 in production). Example for Phase 4: `/dev/player?ids=dbg-sub-52-18-trade,dbg-ruler-truck-offset`.
  - Phase 4: `src/components/Scratchpad.tsx` (canvas, pointer events), find-the-bug rendering and scratchpad state in `src/components/Player.tsx`, generator `scripts/generate/debugging.ts`.
- Accounts and services: GitHub `ghoshs89/aalopp` (`gh` is logged in on the parent's Mac); Vercel project `aalopp`; Supabase project whose ref starts with `strk`; Google Cloud OAuth client in Testing mode with both family accounts as test users.
- Environment gotchas:
  - Secrets are in `.env.local` (git-ignored): the four Supabase values, `ALLOWED_EMAILS` (both accounts) and `CRON_SECRET`. `PARENT_PIN` is not set locally, so the grown-ups page shows a notice in local development.
  - Supabase's copy button includes the variable name. Pasting it after `NAME=` produced `DATABASE_URL=DATABASE_URL="..."` once. Check for that if a connection fails with host `base`.
  - Prisma CLI reads `DIRECT_URL` (session pooler, port 5432) through `prisma.config.ts`; the app uses `DATABASE_URL` (transaction pooler, port 6543).
  - `npm run typecheck` runs `next typegen` first; plain `tsc` fails on typed routes without it.
  - The shell is zsh: an unmatched glob aborts a command chain, and a variable holding several words is passed as one argument. Use `xargs`.
- Where the original context came from: the parent's folder one level above the repo holds `Aishik-Support-Plan.md` (assessment and goals), the IXL report PDF, `bebras_100_questions.md` and `BRIGHT STEPS/` (the earlier practice pages the first content came from).
