# Session Handoff  2026-09-13  Phases 0 to 2 live, all 226 questions blind-solved, continuity docs in place

> Read this fully before acting. It is the state of the work as of the end of the last session. Assume you have no memory of that session and may be a different model. This document plus the repository should be enough to resume.
>
> Before trusting any claim below, the previous session should have verified it against the repo, not the conversation. If a section says "assumed", treat it as unconfirmed.

## How this was verified
Commands run at handoff time on 2026-09-13 from the repo root (`aalopp/`), all exit code 0:
- `npm test`: pass. 15 test files, 72 tests.
- `npm run content:check`: pass. 36 skills, 226 questions, all `"reviewed"`. By band: 1: 39, 2: 84, 3: 72, 4: 28, 5: 3.
- `npm run typecheck`: pass. No errors.
- `npm run lint`: pass. No problems.

Repo state at handoff: branch `main` level with `origin/main` at `5c56dc6`. Uncommitted: `docs/DEVLOG.md`, `docs/HANDOFF.md`, `CLAUDE.md` (this handoff's edits). No em dashes in `CLAUDE.md` or `docs/`.

## 1. Current state
- Works and verified:
  - Live at `https://aalopp.vercel.app`. Vercel reported "Deployment has completed" for commit `413d549`, the last code or content change. `5c56dc6` changed only `docs/DEVLOG.md`.
  - Phase 0 (content format), Phase 1 (child player, sign-in, offline answer queue, grown-ups page) and Phase 2 (adaptive practice) are done. Status per phase is in `docs/ROADMAP.md`.
  - Both family Google accounts sign in on production. Verified 2026-09-13: new Supabase `auth.users` sign-ins at 14:45 and 14:46 UTC, each with an active `auth.sessions` row.
  - Production database schema matches `prisma/schema.prisma`. Verified after the Phase 2 migration with `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` (empty).
  - All 226 questions passed an independent blind solve: 187 generated (187 of 187), and 39 hand-typed (38 of 39, 3 fixed and re-solved). Record in `content/REVIEW.md`.
  - `/api/health` returns 200 on production with the correct `CRON_SECRET`.
- In progress: nothing. No phase has been started since Phase 2.
- Broken or known failing: none observed.
- Assumed, not verified:
  - The offline answer queue recovers after a Wi-Fi drop. The parent's real sessions uploaded within 2 seconds, so it was never exercised on a device. Only the server side (idempotent saves) was tested against the database.
  - The Vercel cron actually calls `/api/health` daily. The route works when called by hand; no cron run has been observed.
  - Real usage by Aishik: only the parent's test sessions exist (2 sessions, 6 attempts as of the Phase 1 test).

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
- Commit this handoff | `git status` clean | parent runs the command in the final report of this handoff.
- Parent confirms the next phase | parent picks Phase 4 or another item | `docs/ROADMAP.md`, phases table.
- Phase 4, scratchpad and Find the Bug (proposed, not confirmed) | drawing canvas works with finger and stylus on phone and tablet; a paper-mode toggle is recorded on each attempt; new find-the-bug answer type in `src/content/schema.ts` with at least 12 blind-solved questions; tests pass; phone-width screenshots show no overflow | `src/components/Player.tsx`, `src/content/schema.ts`, `prisma/schema.prisma` (new nullable `Attempt` field plus migration), `scripts/generate/`.
- Phase 3, parent dashboard | after 1 to 2 weeks of real answers | `src/app/parent/page.tsx`, `src/components/parent/SkillProgress.tsx`, `src/lib/engine/skill-state.ts`.
- Tune the engine from real data | only after Aishik has used it for a week or more; compare real accuracy and review share with the simulation | `src/lib/engine/select-session.ts` constants, `src/lib/engine/simulation.test.ts`.
- Content batch 2 | in about 3 to 4 weeks, before the pool thins (the simulation used about 150 of 226 in 30 days) | `scripts/generate/`.

## 5. Open questions and blockers
- Blocks Phase 4: parent confirmation of the next phase.
- Parent action, not blocking code: set up the TrueNAS backup (`docs/backup-truenas.md`). Until then the only copy of answer data is in Supabase, whose free plan has no downloadable backups.
- Parent action: repeat the Wi-Fi drop test on a phone (airplane mode, answer, wait 10 seconds, reconnect; the cloud counter at the top right should clear).
- Parent input: is 8 questions the right session length? Asked, not yet answered.
- Parent input, optional: read-aloud voice quality on Android.
- Parent spot-check suggestions: `mdl-bus-cm-offset`, `lgr-cars-4x4`, `lsp-zoo-best-route`, `mdc-ca-piggy-bank`, `gs-fan-triangles-4`, `lrv-undo-the-walk`, `bb-beaver-color-path`, `kl12-folded-rope-cut`, `kl12-symmetric-butterfly`.

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
  - Local previews without sign-in: `/dev/player?ids=<id,id>` and `/dev/skills` under `npm run dev` (404 in production).
- Accounts and services: GitHub `ghoshs89/aalopp` (`gh` is logged in on the parent's Mac); Vercel project `aalopp`; Supabase project whose ref starts with `strk`; Google Cloud OAuth client in Testing mode with both family accounts as test users.
- Environment gotchas:
  - Secrets are in `.env.local` (git-ignored): the four Supabase values, `ALLOWED_EMAILS` (both accounts) and `CRON_SECRET`. `PARENT_PIN` is not set locally, so the grown-ups page shows a notice in local development.
  - Supabase's copy button includes the variable name. Pasting it after `NAME=` produced `DATABASE_URL=DATABASE_URL="..."` once. Check for that if a connection fails with host `base`.
  - Prisma CLI reads `DIRECT_URL` (session pooler, port 5432) through `prisma.config.ts`; the app uses `DATABASE_URL` (transaction pooler, port 6543).
  - `npm run typecheck` runs `next typegen` first; plain `tsc` fails on typed routes without it.
  - The shell is zsh: an unmatched glob aborts a command chain, and a variable holding several words is passed as one argument. Use `xargs`.
- Where the original context came from: the parent's folder one level above the repo holds `Aishik-Support-Plan.md` (assessment and goals), the IXL report PDF, `bebras_100_questions.md` and `BRIGHT STEPS/` (the earlier practice pages the first content came from).
